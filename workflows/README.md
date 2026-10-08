# FlashData workflow examples

These workflows are inactive, contain no embedded credentials, and use the `n8n-nodes-flashdata.flashdata` node. Install the package before importing them. During the source preview, use the development instance and select its FlashData node if the loader uses a different local type name.

The workflows target n8n 2.42.5. Open each node after import, select credentials, replace destination IDs, and run manually before activation. FlashData queries and connected model providers may charge for usage. No workflow is currently published in n8n's template library.

## YouTube research to Notion

File: `youtube-research-to-notion.json`.

1. Select the same FlashData credential on Find a video, Video details, and Video transcript.
2. Set a query in Research topic. The example researches the first result only. Verify that it is relevant; a search can return no results.
3. Set the transcript language and caption type. If no matching captions exist, choose another video or track; this workflow stops rather than inventing evidence.
4. Select your model credential on Chat model. The default model can be changed to one available to your account, or replace the model node with another supported provider.
5. Create a Notion database with a title property, share it with your Notion integration, select the credential, and choose its **data source** in Save brief to Notion. The v3 node expects a data source ID, not merely a database URL.
6. Run manually and review the brief and its timestamp citations.

The prompt includes metadata and at most 20,000 characters of caption text. The brief is a model-generated interpretation of that excerpt, not a guarantee of complete coverage or factual accuracy. A deterministic source URL is appended to the saved page. Rerunning creates another Notion page.

## Daily search snapshots to Google Sheets

File: `daily-search-to-sheets.json`.

1. Create a spreadsheet tab named `Search snapshots` with this exact header row:

   `query,captured_at,title,url,snippet,position`

2. Select FlashData and Google Sheets credentials and the destination spreadsheet.
3. Edit Search settings, country, language, and requested result count.
4. Run manually and check the appended rows. Activate the workflow when ready for its daily 09:00 UTC schedule; adjust the workflow timezone and schedule as needed.

Every run appends one row per organic result. A zero-result response appends no rows. Collection time groups rows into snapshots. Compare dates/rank changes in Sheets; automatic change detection and notifications are not implemented in this example. The node does not overwrite past snapshots or automatically request more pages.

## Video transcript archive in Supabase

File: `video-transcript-to-supabase.json`.

1. Run `supabase-schema.sql` in your own Supabase project. This creates a new dedicated table with row-level security enabled; it does not modify existing tables.
2. Configure the n8n Supabase credential for an account/key with server-side permission to insert rows. Keep the key in n8n credentials. The SQL grants no anonymous access.
3. Select the FlashData credential, set a video URL, and choose language and caption type.
4. Run manually and check that each row contains the caption text, start/end seconds, a timestamped source URL, and capture time.

Each run appends a new snapshot, including on reruns. Caption segments are source material for a knowledge base. This example does not generate embeddings, combine segments into semantic chunks, or implement vector retrieval; connect the archived material to your chosen indexing pipeline.

## Validation scope

The package includes automated tests of the actual n8n routing engine using API fixtures. Template data transformations are checked in n8n with fixture responses. The model, Notion, Google Sheets, and Supabase account setup and writes require your credentials and destination IDs; they are not claimed as live-verified integrations.
