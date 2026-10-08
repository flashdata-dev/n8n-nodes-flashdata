# Publishing and n8n verification

Publication milestones are separate: public source, npm release, n8n verification submission, verified availability, and template-library publication. Do not claim verified status before n8n approves the package and installation is checked.

## First npm release

1. The maintainer signs in to the npm account that will own the unscoped `n8n-nodes-flashdata` package. Confirm the name is still available.
2. Configure npm publishing authorization. Trusted Publishers are configured in an existing package's settings. For a new unscoped package without that settings page, use a short-lived granular access token for the first GitHub Actions release. See [npm's token guide](https://docs.npmjs.com/creating-and-viewing-access-tokens).
3. Token settings: **Read and write (publish and stage)**, not stage-only; enable **Bypass two-factor authentication** for unattended publishing. Restrict to the package if it can be selected. If npm cannot select a package that does not exist yet, first-publish authorization may require **All Packages** on the owning account. Use the shortest practical expiration (npm permits one day) and revoke it after setup. Organization-management permissions are not needed for this unscoped package.
4. Save it in the GitHub repository's Actions secrets as `NPM_TOKEN`. Never put it in an Issue, workflow JSON, commit, or README.
5. On a reviewed main commit with all CI checks passing, tag the version (for example `v0.1.0`) and push the tag. `publish.yml` verifies that the tag matches `package.json`, tests the package in n8n, and runs the official `n8n-node release` command. In GitHub Actions that command runs lint/build and publishes with npm provenance.
6. Check the Actions result, npm version, repository link, tarball contents, and provenance attestation. Install the published package in a clean n8n instance and test it before updating the public release status.

Do not publish the initial package locally: n8n requires GitHub Actions and provenance for verification as of May 1, 2026.

## Subsequent releases with Trusted Publishing

In npm package settings → Trusted Publishers, configure GitHub Actions:

- Owner: `flashdata-dev`
- Repository: `n8n-nodes-flashdata`
- Workflow: `publish.yml`
- Environment: leave blank (the workflow does not use a GitHub Environment)

Remove the `NPM_TOKEN` secret and revoke its token after the publisher is configured. The workflow's `id-token: write` permission allows npm OIDC publishing and provenance. Node 24 supplies a compatible npm CLI; trusted publishing requires npm 11.5.1 or newer.

Update version and changelog, review CI, and push the matching version tag. Keep the source repository public.

## Submit to n8n

After npm publication and a clean install test, sign in to [n8n Creator Portal](https://creators.n8n.io/nodes). Suggested submission details:

- Package: `n8n-nodes-flashdata`
- Repository: `https://github.com/flashdata-dev/n8n-nodes-flashdata`
- Website: `https://flashdata.dev`
- Description: `Google search results, YouTube video discovery, metadata, and timestamped transcripts for research and automation workflows.`
- Authentication: one FlashData API key; the connection test is non-billable.
- Service: FlashData, with one account and API contract. Google and YouTube are data sources exposed through that service.
- Runtime: declarative HTTP API node, no external runtime dependencies, no filesystem or environment-variable access, MIT license, English documentation.
- Examples: three importable JSON workflows in this repository.

Follow the current portal form. Supply reviewer access only through the portal's appropriate private mechanism if requested. Record submission date, receipt, review feedback, and the actual public listing URL in the GTM task. npm publication alone is not n8n verification.

Template submissions use the separate [Creator Hub](https://creators.n8n.io/hub). Confirm its current requirements after the community node is available, complete destination/account testing, and submit each template separately. Repository examples are not template-library listings.

## Official references

Checked October 8, 2026:

- [n8n verification guidelines](https://docs.n8n.io/connect/create-nodes/build-your-node/reference/verification-guidelines)
- [Submit community nodes](https://docs.n8n.io/connect/create-nodes/deploy-your-node/submit-community-nodes)
- [Official publish workflow](https://github.com/n8n-io/n8n-nodes-starter/blob/master/.github/workflows/publish.yml)
- [npm trusted publishing](https://docs.npmjs.com/trusted-publishers)
