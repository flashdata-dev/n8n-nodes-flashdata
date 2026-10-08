const assert = require('node:assert/strict');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { spawnSync } = require('node:child_process');
const fixtures = mkdtempSync(join(tmpdir(), 'flashdata-n8n-test-'));
const image = process.env.N8N_TEST_IMAGE || 'n8nio/n8n:2.42.5';
const node = (name, parameters, type = 'CUSTOM.flashdata', typeVersion = 1) => ({
	id: name,
	name,
	type,
	typeVersion,
	position: [0, 0],
	parameters,
	...(type === 'CUSTOM.flashdata'
		? { credentials: { flashdataApi: { id: 'flashdata-test-key', name: 'FlashData test' } } }
		: {}),
});
const start = node('Start', {}, 'n8n-nodes-base.manualTrigger');
function workflow(id, nodes) {
	const all = [start, ...nodes];
	return {
		id,
		name: id,
		active: false,
		nodes: all,
		connections: Object.fromEntries(
			all
				.slice(0, -1)
				.map((n, i) => [n.name, { main: [[{ node: all[i + 1].name, type: 'main', index: 0 }]] }]),
		),
		settings: { executionOrder: 'v1' },
	};
}
const success = workflow('flashdataSuccess', [
	node(
		'Inputs',
		{ mode: 'raw', jsonOutput: '{"queries":["first query","second query"]}', options: {} },
		'n8n-nodes-base.set',
		3.4,
	),
	node('Split', { fieldToSplitOut: 'queries', options: {} }, 'n8n-nodes-base.splitOut'),
	node('Google', {
		resource: 'googleSearch',
		operation: 'search',
		query: '={{$json.queries}}',
		options: { gl: 'us', num: 2, page: 1, autocorrect: false },
	}),
	node('YouTube', {
		resource: 'youtube',
		operation: 'search',
		query: '={{$json.results[0].organic[0].title}}',
		maxResults: 2,
	}),
	node('Metadata', {
		resource: 'youtube',
		operation: 'getMetadata',
		videoId: '={{$json.results[0].results[0].videoId}}',
		options: { includeChapters: false, includeFormats: false },
	}),
	node('Transcript', {
		resource: 'youtube',
		operation: 'getTranscript',
		videoId: '=https://youtu.be/{{$json.results[0].videoId}}',
		language: 'en',
		auto: false,
	}),
]);
const payment = workflow('flashdataPayment', [
	{
		...node('Payment', {
			resource: 'googleSearch',
			operation: 'search',
			query: 'simulate-payment-error',
			options: {},
		}),
		continueOnFail: true,
	},
]);
const invalid = workflow('flashdataInvalid', [
	{
		...node('Invalid', {
			resource: 'youtube',
			operation: 'getMetadata',
			videoId: 'invalid',
			options: {},
		}),
		continueOnFail: true,
	},
]);
const templateCases = [
	['youtube-research-to-notion.json', 'flashdataResearch', 'Video transcript'],
	['daily-search-to-sheets.json', 'flashdataSearch', 'Search row'],
	['video-transcript-to-supabase.json', 'flashdataArchive', 'Transcript row'],
];
const templateWorkflows = templateCases.map(([file, id, stopAt]) => {
	const original = JSON.parse(readFileSync(join('workflows', file), 'utf8'));
	const nodes = original.nodes.slice(0, original.nodes.findIndex((n) => n.name === stopAt) + 1);
	for (const n of nodes)
		if (n.type === 'n8n-nodes-flashdata.flashdata') {
			n.type = 'CUSTOM.flashdata';
			n.credentials = { flashdataApi: { id: 'flashdata-test-key', name: 'FlashData test' } };
		}
	return workflow(id, nodes.slice(1));
});
const workflows = [success, payment, invalid, ...templateWorkflows];
writeFileSync(join(fixtures, 'workflows.json'), JSON.stringify(workflows));
writeFileSync(
	join(fixtures, 'credentials.json'),
	JSON.stringify([
		{
			id: 'flashdata-test-key',
			name: 'FlashData test',
			type: 'flashdataApi',
			data: { apiKey: 'test-key-not-a-secret' },
		},
	]),
);
const commands = [
	'n8n import:credentials --input=/fixtures/credentials.json > /fixtures/import-credentials.log 2>&1',
	'n8n import:workflow --input=/fixtures/workflows.json > /fixtures/import-workflows.log 2>&1',
	...workflows.map((w) => `n8n execute --id=${w.id} --rawOutput > /fixtures/${w.id}.log 2>&1`),
];
try {
	const result = spawnSync(
		'docker',
		[
			'run',
			'--rm',
			'--user',
			'0:0',
			'--entrypoint',
			'sh',
			'-e',
			'N8N_USER_FOLDER=/tmp/n8n-flashdata',
			'-e',
			'N8N_CUSTOM_EXTENSIONS=/opt/flashdata',
			'-e',
			'N8N_DIAGNOSTICS_ENABLED=false',
			'-e',
			'N8N_VERSION_NOTIFICATIONS_ENABLED=false',
			'-e',
			'N8N_LOG_LEVEL=info',
			'-e',
			'NODE_OPTIONS=--require=/workspace/test/mock-api.cjs',
			'-v',
			`${resolve('dist')}:/opt/flashdata:ro`,
			'-v',
			`${resolve('.')}:/workspace:ro`,
			'-v',
			`${fixtures}:/fixtures`,
			image,
			'-c',
			commands.join(' && '),
		],
		{ encoding: 'utf8', timeout: 240000 },
	);
	if (result.status !== 0) {
		for (const file of ['import-credentials', 'import-workflows', ...workflows.map((w) => w.id)]) {
			try {
				console.error(readFileSync(join(fixtures, `${file}.log`), 'utf8').slice(-5000));
			} catch {}
		}
		throw new Error(`n8n integration failed: ${result.stderr || result.error || result.status}`);
	}
	const requests = readFileSync(join(fixtures, 'requests.jsonl'), 'utf8')
		.trim()
		.split('\n')
		.map(JSON.parse);
	assert.equal(
		requests.length,
		14,
		'Fourteen expected requests including templates; no retries or invalid requests',
	);
	assert.deepEqual(
		requests
			.filter((r) => r.source === 'google_search')
			.slice(0, 2)
			.map((r) => r.query),
		['first query', 'second query'],
	);
	assert.deepEqual(requests[0].params, { gl: 'us', num: 2, page: 1, autocorrect: false });
	assert.deepEqual(requests.find((r) => r.source === 'youtube_search').params, { max_results: 2 });
	assert.deepEqual(requests.find((r) => r.source === 'youtube_metadata').params, {
		include_chapters: false,
		include_formats: false,
	});
	for (const r of requests.filter((r) => r.source === 'youtube_transcript').slice(0, 2)) {
		assert.equal(r.video_id, 'dQw4w9WgXcQ');
		assert.deepEqual(r.params, { language: 'en', auto: false });
	}
	for (const [id, lastNode, expectedError] of [
		['flashdataSuccess', 'Transcript'],
		['flashdataPayment', 'Payment', true],
		['flashdataInvalid', 'Invalid', true],
	]) {
		const raw = readFileSync(join(fixtures, `${id}.log`), 'utf8');
		const run = JSON.parse(raw.slice(raw.indexOf('{')));
		assert.equal(run.status, 'success');
		const items = run.data.resultData.runData[lastNode][0].data.main[0];
		if (expectedError) assert.ok(items[0].json.error);
		else {
			assert.equal(items.length, 2);
			assert.equal(items[0].json.results[0].segments[0].text, 'Example transcript.');
			assert.equal(items[1].pairedItem.item, 1);
			assert.ok(items[0].json.usage && items[0].json.created_at);
		}
	}
	for (const [, id, lastNode] of templateCases) {
		const raw = readFileSync(join(fixtures, `${id}.log`), 'utf8');
		const run = JSON.parse(raw.slice(raw.indexOf('{')));
		assert.equal(run.status, 'success');
		const rows = run.data.resultData.runData[lastNode][0].data.main[0];
		assert.equal(rows.length, 1);
		if (id === 'flashdataSearch')
			assert.deepEqual(rows[0].json, {
				query: 'battery recycling',
				captured_at: '2026-10-08T00:00:00Z',
				title: 'battery recycling',
				url: 'https://example.com/research',
				snippet: 'Search fixture',
				position: 1,
			});
		if (id === 'flashdataArchive')
			assert.deepEqual(rows[0].json, {
				video_id: 'dQw4w9WgXcQ',
				source_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=0',
				language: 'en',
				is_auto_generated: true,
				captured_at: '2026-10-08T00:00:00Z',
				start_seconds: 0,
				end_seconds: 3,
				text: 'Example transcript.',
			});
	}
	console.log(
		`PASS: n8n ${image}, four operations, per-item expressions, X-API-Key, nested params, URL normalization, paired items, payment errors, no automatic retry, validation before HTTP`,
	);
} finally {
	rmSync(fixtures, { recursive: true, force: true });
}
