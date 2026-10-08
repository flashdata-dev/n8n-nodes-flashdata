import { NodeOperationError } from 'n8n-workflow';
import type { IDataObject, IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

export function normalizeVideoId(input: string): string {
	const value = input.trim();
	if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
	let id: string | null = null;
	try {
		const url = new URL(value);
		if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error();
		if (url.hostname === 'youtu.be') {
			id = url.pathname.split('/')[1];
		} else if (
			['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com'].includes(
				url.hostname,
			)
		) {
			const parts = url.pathname.split('/');
			id =
				url.pathname === '/watch'
					? url.searchParams.get('v')
					: ['shorts', 'embed', 'live'].includes(parts[1])
						? parts[2]
						: null;
		}
	} catch {
		/* Report one actionable validation error below. */
	}
	if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
		throw new Error('Enter a valid YouTube video URL or 11-character video ID.');
	}
	return id;
}

export async function validateRequest(
	this: IExecuteSingleFunctions,
	request: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = request.body as IDataObject;
	const params = body.params as IDataObject;
	try {
		if ('query' in body) {
			const query = typeof body.query === 'string' ? body.query.trim() : '';
			if (!query || query.length > 2000)
				throw new Error('Query must contain between 1 and 2,000 characters.');
			body.query = query;
		}
		if ('video_id' in body) body.video_id = normalizeVideoId(String(body.video_id ?? ''));
		for (const [field, maximum] of [
			['num', 100],
			['page', 100],
			['max_results', 20],
		] as const) {
			if (
				params[field] !== undefined &&
				(!Number.isInteger(params[field]) ||
					Number(params[field]) < 1 ||
					Number(params[field]) > maximum)
			) {
				throw new Error(`${field} must be an integer between 1 and ${maximum}.`);
			}
		}
		if (params.gl !== undefined && !/^[A-Za-z]{2}$/.test(String(params.gl)))
			throw new Error('Country must be a two-letter country code.');
		for (const field of ['hl', 'language']) {
			if (params[field] !== undefined && !/^[A-Za-z0-9-]{1,35}$/.test(String(params[field])))
				throw new Error('Enter a valid language code.');
		}
		for (const field of ['location', 'tbs']) {
			if (
				params[field] !== undefined &&
				(typeof params[field] !== 'string' || String(params[field]).length > 200)
			)
				throw new Error(`${field} must be at most 200 characters.`);
		}
	} catch (error) {
		throw new NodeOperationError(this.getNode(), error as Error);
	}
	return request;
}
