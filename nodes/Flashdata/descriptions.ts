import type { INodeProperties } from 'n8n-workflow';
import { validateRequest } from './request';

export const googleSearchDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['googleSearch'] } },
		options: [
			{
				name: 'Search',
				value: 'search',
				action: 'Search google',
				description: 'Retrieve structured Google search results',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/queries/realtime',
						body: {
							source: 'google_search',
							query: '={{$parameter.query}}',
							params: '={{$parameter.options}}',
						},
					},
					send: { preSend: [validateRequest] },
				},
			},
		],
		default: 'search',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. battery recycling research',
		displayOptions: { show: { resource: ['googleSearch'] } },
		description: 'Search query, up to 2,000 characters',
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['googleSearch'] } },
		options: [
			{
				displayName: 'Autocorrect',
				name: 'autocorrect',
				type: 'boolean',
				default: true,
				description: 'Whether to apply spelling corrections',
			},
			{
				displayName: 'Country',
				name: 'gl',
				type: 'string',
				default: 'us',
				description: 'Two-letter country code, such as us or de',
			},
			{
				displayName: 'Language',
				name: 'hl',
				type: 'string',
				default: 'en',
				description: 'Interface language code, such as en',
			},
			{
				displayName: 'Location',
				name: 'location',
				type: 'string',
				default: '',
				placeholder: 'e.g. New York, United States',
				description: 'Geographic search location',
			},
			{
				displayName: 'Page',
				name: 'page',
				type: 'number',
				default: 1,
				typeOptions: { minValue: 1, maxValue: 100, numberPrecision: 0 },
				description: 'Page to request. Each page is a separate billable query.',
			},
			{
				displayName: 'Result Count',
				name: 'num',
				type: 'number',
				default: 10,
				typeOptions: { minValue: 1, maxValue: 100, numberPrecision: 0 },
				description: 'Requested number of results. The actual count depends on the query.',
			},
			{
				displayName: 'Time Filter',
				name: 'tbs',
				type: 'string',
				default: '',
				placeholder: 'e.g. qdr:d',
				description: 'Google time filter, such as qdr:d for the past day',
			},
		],
	},
];

export const youtubeDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['youtube'] } },
		options: [
			{
				name: 'Get Metadata',
				value: 'getMetadata',
				action: 'Get you tube video metadata',
				description: 'Retrieve video details, chapters, and available formats',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/queries/realtime',
						body: {
							source: 'youtube_metadata',
							video_id: '={{$parameter.videoId}}',
							params:
								'={{ { include_chapters: $parameter.options.includeChapters ?? true, include_formats: $parameter.options.includeFormats ?? true } }}',
						},
					},
					send: { preSend: [validateRequest] },
				},
			},
			{
				name: 'Get Transcript',
				value: 'getTranscript',
				action: 'Get a you tube transcript',
				description: 'Retrieve timestamped video captions in the requested language',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/queries/realtime',
						body: {
							source: 'youtube_transcript',
							video_id: '={{$parameter.videoId}}',
							params: '={{ { language: $parameter.language, auto: $parameter.auto } }}',
						},
					},
					send: { preSend: [validateRequest] },
				},
			},
			{
				name: 'Search',
				value: 'search',
				action: 'Search you tube',
				description: 'Discover up to 20 videos for a query',
				routing: {
					request: {
						method: 'POST',
						url: '/v1/queries/realtime',
						body: {
							source: 'youtube_search',
							query: '={{$parameter.query}}',
							params: '={{ { max_results: $parameter.maxResults } }}',
						},
					},
					send: { preSend: [validateRequest] },
				},
			},
		],
		default: 'search',
	},
	{
		displayName: 'Query',
		name: 'query',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. battery recycling explained',
		description: 'Search query, up to 2,000 characters',
		displayOptions: { show: { resource: ['youtube'], operation: ['search'] } },
	},
	{
		displayName: 'Maximum Results',
		name: 'maxResults',
		type: 'number',
		default: 10,
		typeOptions: { minValue: 1, maxValue: 20, numberPrecision: 0 },
		description: 'Max number of results to return',
		displayOptions: { show: { resource: ['youtube'], operation: ['search'] } },
	},
	{
		displayName: 'Video URL or ID',
		name: 'videoId',
		type: 'string',
		required: true,
		default: '',
		placeholder: 'e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		description: 'YouTube watch, short, embed, live, or youtu.be URL, or an 11-character video ID',
		displayOptions: {
			show: { resource: ['youtube'], operation: ['getMetadata', 'getTranscript'] },
		},
	},
	{
		displayName: 'Language',
		name: 'language',
		type: 'string',
		required: true,
		default: 'en',
		description:
			'Caption language code, such as en. The video must have captions in this language.',
		displayOptions: { show: { resource: ['youtube'], operation: ['getTranscript'] } },
	},
	{
		displayName: 'Automatically Generated',
		name: 'auto',
		type: 'boolean',
		default: true,
		description:
			'Whether to select automatically generated captions. Disable to select manual captions. There is no fallback between caption types.',
		displayOptions: { show: { resource: ['youtube'], operation: ['getTranscript'] } },
	},
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: { show: { resource: ['youtube'], operation: ['getMetadata'] } },
		options: [
			{
				displayName: 'Include Chapters',
				name: 'includeChapters',
				type: 'boolean',
				default: true,
				description: 'Whether to include video chapters',
			},
			{
				displayName: 'Include Formats',
				name: 'includeFormats',
				type: 'boolean',
				default: true,
				description: 'Whether to include available video and audio formats',
			},
		],
	},
];
