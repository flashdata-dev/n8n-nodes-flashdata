// Opt-in production smoke test. Uses four billable queries; never run in CI.
const { spawnSync } = require('node:child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join, resolve } = require('node:path');
const { FlashdataApi } = require('../dist/credentials/FlashdataApi.credentials');
(async () => {
	const key = process.env.FLASHDATA_API_KEY;
	if (!key) throw new Error('Set FLASHDATA_API_KEY to opt in to four live queries.');
	const test = new FlashdataApi().test.request;
	const auth = await fetch(test.baseURL + test.url, {
		method: test.method,
		headers: { 'X-API-Key': key },
	});
	console.log(JSON.stringify({ credentialTest: auth.status, billable: false }));
	if (!auth.ok) process.exitCode = 1;
	else {
		const fixtures = mkdtempSync(join(tmpdir(), 'flashdata-n8n-live-'));
		const ops = [
			[
				'Google Search',
				{
					resource: 'googleSearch',
					operation: 'search',
					query: 'n8n workflow automation',
					options: { num: 1, gl: 'us', hl: 'en' },
				},
			],
			[
				'YouTube Search',
				{
					resource: 'youtube',
					operation: 'search',
					query: 'Rick Astley Never Gonna Give You Up',
					maxResults: 1,
				},
			],
			[
				'Metadata',
				{
					resource: 'youtube',
					operation: 'getMetadata',
					videoId: 'https://youtu.be/dQw4w9WgXcQ',
					options: { includeFormats: false },
				},
			],
			[
				'Transcript',
				{
					resource: 'youtube',
					operation: 'getTranscript',
					videoId: 'dQw4w9WgXcQ',
					language: 'en',
					auto: false,
				},
			],
		];
		const nodes = [
			{
				id: 'start',
				name: 'Start',
				type: 'n8n-nodes-base.manualTrigger',
				typeVersion: 1,
				position: [0, 0],
				parameters: {},
			},
			...ops.map(([name, parameters]) => ({
				id: name,
				name,
				type: 'CUSTOM.flashdata',
				typeVersion: 1,
				position: [250, 0],
				parameters,
				continueOnFail: true,
				credentials: { flashdataApi: { id: 'flashdata-live-key', name: 'Temporary smoke test' } },
			})),
		];
		writeFileSync(
			join(fixtures, 'credential.json'),
			JSON.stringify([
				{
					id: 'flashdata-live-key',
					name: 'Temporary smoke test',
					type: 'flashdataApi',
					data: { apiKey: key },
				},
			]),
			{ mode: 0o600 },
		);
		writeFileSync(
			join(fixtures, 'workflow.json'),
			JSON.stringify({
				id: 'flashdataLiveSmoke',
				name: 'FlashData live smoke',
				active: false,
				nodes,
				connections: {
					Start: { main: [ops.map(([name]) => ({ node: name, type: 'main', index: 0 }))] },
				},
				settings: { executionOrder: 'v1' },
			}),
		);
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
					'N8N_USER_FOLDER=/tmp/n8n-flashdata-live',
					'-e',
					'N8N_CUSTOM_EXTENSIONS=/opt/flashdata',
					'-e',
					'N8N_DIAGNOSTICS_ENABLED=false',
					'-e',
					'N8N_VERSION_NOTIFICATIONS_ENABLED=false',
					'-v',
					`${resolve('dist')}:/opt/flashdata:ro`,
					'-v',
					`${fixtures}:/fixtures`,
					'n8nio/n8n:2.42.5',
					'-c',
					'n8n import:credentials --input=/fixtures/credential.json >/fixtures/import.log 2>&1 && n8n import:workflow --input=/fixtures/workflow.json >>/fixtures/import.log 2>&1 && n8n execute --id=flashdataLiveSmoke --rawOutput >/fixtures/run.log 2>&1',
				],
				{ encoding: 'utf8', timeout: 240000 },
			);
			if (result.status !== 0)
				throw new Error(
					'Live n8n execution failed; response logs were not printed to protect credentials.',
				);
			const raw = readFileSync(join(fixtures, 'run.log'), 'utf8');
			const run = JSON.parse(raw.slice(raw.indexOf('{')));
			for (const [name] of ops) {
				const output = run.data.resultData.runData[name]?.[0]?.data?.main?.[0]?.[0]?.json;
				const data = output?.results?.[0];
				console.log(
					JSON.stringify({
						operation: name,
						success: output?.status === 'done',
						source: output?.source,
						credits: output?.usage?.credits,
						createdAt: output?.created_at,
						resultCount: data?.organic?.length ?? data?.results?.length,
						segmentCount: data?.segments?.length,
						hasVideoId: Boolean(data?.videoId),
					}),
				);
				if (output?.status !== 'done') process.exitCode = 1;
			}
		} finally {
			rmSync(fixtures, { recursive: true, force: true });
		}
	}
})().catch((error) => {
	console.error(error.message);
	process.exitCode = 1;
});
