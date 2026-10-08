import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class FlashdataApi implements ICredentialType {
	name = 'flashdataApi';
	displayName = 'FlashData API';
	icon: Icon = {
		light: 'file:../nodes/Flashdata/flashdata.svg',
		dark: 'file:../nodes/Flashdata/flashdata.svg',
	};
	documentationUrl = 'https://github.com/flashdata-dev/n8n-nodes-flashdata#credentials';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { 'X-API-Key': '={{$credentials.apiKey}}' } },
	};
	test: ICredentialTestRequest = {
		request: { baseURL: 'https://api.flashdata.dev', url: '/v2/api-access', method: 'GET' },
	};
}
