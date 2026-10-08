import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { googleSearchDescription, youtubeDescription } from './descriptions';

export class Flashdata implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FlashData',
		name: 'flashdata',
		icon: { light: 'file:flashdata.svg', dark: 'file:flashdata.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Get Google search results and YouTube data with FlashData',
		defaults: { name: 'FlashData' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'flashdataApi', required: true }],
		requestDefaults: {
			baseURL: 'https://data.flashdata.dev',
			timeout: 120000,
			headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Google Search', value: 'googleSearch' },
					{ name: 'YouTube', value: 'youtube' },
				],
				default: 'googleSearch',
			},
			...googleSearchDescription,
			...youtubeDescription,
		],
	};
}
