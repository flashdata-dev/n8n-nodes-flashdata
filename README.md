# n8n-nodes-flashdata

Bring Google search results and YouTube data into your n8n workflows with [FlashData](https://flashdata.dev/?utm_source=n8n&utm_medium=integration&utm_campaign=community-node).

Discover videos, retrieve metadata and timestamped transcripts, and connect the results to research briefs, search monitoring, or a video knowledge base. This package connects to the FlashData API with one API key.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

**Release status:** source preview. npm publication and n8n verification are pending. This package is not yet discoverable or installable through the n8n Cloud node panel.

## Installation

After the first npm release, self-hosted n8n users can open **Settings → Community nodes → Install**, enter `n8n-nodes-flashdata`, and install it. See the [n8n community node installation guide](https://docs.n8n.io/integrations/community-nodes/installation/).

For the current source preview, use the [development instructions](#development). n8n Cloud availability requires separate approval by n8n; publishing to npm does not grant that approval.

## Credentials

1. Create a [FlashData account](https://flashdata.dev/?utm_source=n8n&utm_medium=integration&utm_campaign=community-node) and an API key in the console. Enable the sources you plan to use and ensure the account has access and sufficient credits.
2. In n8n, create a **FlashData API** credential and paste your key into **API Key**.
3. Test the credential, then select it on the FlashData nodes in your workflow.

The key is stored as an n8n credential and sent in the `X-API-Key` header. The credential test calls `GET https://api.flashdata.dev/v2/api-access` and does not run a billable search. A successful credential test verifies authentication; individual sources may still require additional permissions or account access.

See [FlashData documentation](https://flashdata.dev/docs/sources/google_search) and [current pricing](https://flashdata.dev/pricing). Data queries consume account credits. This package adds no separate fee.

## Operations

| Resource | Operation | Inputs and options |
| --- | --- | --- |
| Google Search | Search | Query; optional country, language, location, page, result count, time filter, autocorrect |
| YouTube | Search | Query; maximum 1–20 results |
| YouTube | Get Metadata | Video URL or ID; include chapters and formats |
| YouTube | Get Transcript | Video URL or ID, language, automatically generated or manual captions |

Video inputs accept 11-character IDs and YouTube watch, shorts, embed, live, and `youtu.be` URLs. No video download or asynchronous job polling is included in this version.

Caption availability varies by video and language. **Automatically Generated** selects automatic captions when enabled and manual captions when disabled. There is no fallback between the two. Adjust the language/type if the selected track is unavailable.

## Output and usage

Each input item makes one synchronous request and returns the full FlashData response as one output item. The response keeps `source`, `status`, `results`, `usage.credits`, and `created_at`; inputs retain n8n item linking. The node is also available as an AI Agent tool.

Useful n8n expressions:

| Data | Expression |
| --- | --- |
| Google organic results | `{{ $json.results[0].organic }}` |
| YouTube search results | `{{ $json.results[0].results }}` |
| Video metadata | `{{ $json.results[0] }}` |
| Transcript segments | `{{ $json.results[0].segments }}` |
| Credits for this request | `{{ $json.usage.credits }}` |
| Collection time | `{{ $json.created_at }}` |

Use **Split Out** to turn a result array into individual items. Transcript segments contain `start`, `end`, and `text`; timestamps are in seconds. Google options are only sent when selected. A page is a separate request; there is no automatic pagination.

The node does not automatically retry requests. A timeout can occur after a request has already been accepted. Check usage before rerunning; enabling n8n's **Retry On Fail** may submit another billable request. For many inputs, use n8n's node **Settings → Request Options → Batching** to control concurrency.

Typical API errors: `401` invalid key, `402` insufficient credits, `403` source/account access, `429` rate or quota limit, and `503`/`504` temporary service failures. n8n displays the API error; its standard error-handling settings are supported.

## Example workflows

Import the JSON files using **Import from File** in n8n. They contain no credentials and are inactive by default.

- [YouTube research → Notion](workflows/youtube-research-to-notion.json): discover one video, fetch metadata and captions, generate a sourced brief with a connected chat model, and save it to Notion.
- [Daily Google search → Sheets](workflows/daily-search-to-sheets.json): append timestamped search snapshots for comparison in a spreadsheet.
- [Video transcript → Supabase](workflows/video-transcript-to-supabase.json): archive caption segments with timestamps and source links for downstream knowledge-base processing.

Read the [setup guide](workflows/README.md) before running them. External service credentials, destination IDs, and model access must be supplied by the workflow owner. These are repository examples, not published n8n template-library listings.

## Compatibility

The integration targets n8n 2.x and is tested with n8n 2.42.5. Other versions have not been verified. Build tooling uses Node.js 24. The runtime package has no external dependencies beyond n8n's provided `n8n-workflow` peer and does not read environment variables or the filesystem.

## Development

```sh
nvm use
npm ci
npm run lint
npm test
npm run test:integration
npm run dev
```

`npm run test:integration` uses Docker and an isolated n8n instance with mocked HTTP responses. It exercises the real n8n routing engine without using account credits. `npm run dev` uses n8n's official development CLI; Docker is needed when that CLI starts n8n in a container. Use the URL printed by the CLI, add the node, and select your own credentials to test live queries.

Build and lint use the official `@n8n/node-cli`. See [release and verification instructions](RELEASING.md). Test tools are development dependencies and are excluded from the published runtime.

## Resources

- [FlashData](https://flashdata.dev/?utm_source=n8n&utm_medium=integration&utm_campaign=community-node)
- [API documentation](https://flashdata.dev/docs/sources/google_search)
- [Report an issue](https://github.com/flashdata-dev/n8n-nodes-flashdata/issues)
- [n8n community nodes](https://docs.n8n.io/integrations/community-nodes/)
- [Changelog](CHANGELOG.md)

## License

MIT
