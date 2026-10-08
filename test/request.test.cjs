const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeVideoId, validateRequest } = require('../dist/nodes/Flashdata/request');
const context = {
	getNode: () => ({
		name: 'FlashData',
		type: 'flashdata',
		typeVersion: 1,
		position: [0, 0],
		parameters: {},
	}),
};

test('accepts IDs and supported YouTube URL forms without forwarding the URL', () => {
	for (const value of [
		' dQw4w9WgXcQ ',
		'https://youtu.be/dQw4w9WgXcQ?t=20',
		'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=abc',
		'https://youtube.com/shorts/dQw4w9WgXcQ',
		'https://m.youtube.com/live/dQw4w9WgXcQ',
		'https://youtube.com/embed/dQw4w9WgXcQ',
	]) {
		assert.equal(normalizeVideoId(value), 'dQw4w9WgXcQ');
	}
});
test('rejects malformed IDs, unsupported protocols, and lookalike domains', () => {
	for (const value of [
		'',
		'too-short',
		'https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ',
		'https://example.com/dQw4w9WgXcQ',
		'ftp://youtube.com/watch?v=dQw4w9WgXcQ',
		'https://youtube.com/watch?v=invalid',
	])
		assert.throws(() => normalizeVideoId(value));
});
test('rejects invalid paid query inputs before sending a request', async () => {
	for (const body of [
		{ query: ' ', params: {} },
		{ query: 'x'.repeat(2001), params: {} },
		{ query: 'test', params: { max_results: 21 } },
		{ query: 'test', params: { num: 1.5 } },
		{ query: 'test', params: { page: 0 } },
		{ query: 'test', params: { gl: 'USA' } },
		{ video_id: 'dQw4w9WgXcQ', params: { language: 'en US' } },
	]) {
		await assert.rejects(validateRequest.call(context, { body }));
	}
});
test('keeps false caption and format settings and does not inject Google defaults', async () => {
	const body = {
		source: 'youtube_transcript',
		video_id: 'https://youtu.be/dQw4w9WgXcQ',
		params: { auto: false, language: 'en' },
	};
	const request = await validateRequest.call(context, { body });
	assert.deepEqual(request.body, { ...body, video_id: 'dQw4w9WgXcQ' });
	assert.equal(request.body.params.auto, false);
	const search = await validateRequest.call(context, { body: { query: ' research ', params: {} } });
	assert.deepEqual(search.body, { query: 'research', params: {} });
});
