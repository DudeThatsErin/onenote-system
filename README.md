# OneNote System

OneNote System is an open-source, self-hostable capture API and setup dashboard for Microsoft OneNote. Deploy your own copy, connect Microsoft, choose a destination section, then create OneNote pages from Apple Shortcuts or any HTTPS client.

The public guide is available at [onenotesystem.erinskidds.com](https://onenotesystem.erinskidds.com/).

## What works today

- Guided Neon/PostgreSQL and Microsoft Entra setup
- Microsoft OAuth with encrypted access and refresh tokens
- Notebook and section picker
- Hashed per-user capture API keys
- `POST /api/capture` for a title, plain-text body, and optional source URL
- `POST /api/append` for adding plain text and an optional source URL to an existing page
- Signed Discord HTTP interactions with PING validation and Ed25519 verification
- Idempotent registration and removal of the `/onenote create` and `/onenote append` actions
- An official terminal client on npm for Linux, servers, and locked-down work machines
- Vercel deployment and Docker Compose self-hosting

## Terminal client

[`onenotesystem`](https://www.npmjs.com/package/onenotesystem) is the command-line client for a deployment. It calls the same `/api/capture` and `/api/append` endpoints the Apple Shortcuts use, so pages created from a shell and pages created from a phone are identical.

```bash
npm install -g onenotesystem
onenotesystem configure
onenotesystem capture "Standup notes" --content "Shipped the CLI"
git log -1 --stat | onenotesystem capture "Today's commit" --stdin
onenotesystem append "Ask about the Q3 budget" --page-title "Quick Inbox"
```

It needs Node.js 18.17 or newer, has no runtime dependencies, and stores your API key in an owner-only config file. Source: [onenote-terminal](https://github.com/DudeThatsErin/onenote-terminal). Full guide: [/terminal](https://onenotesystem.erinskidds.com/terminal).

## Upgrading from OneNote Queue

This project was previously called OneNote Queue. Existing deployments upgrade in place:

- **Database tables** are renamed from the `oq_` prefix to `ons_` automatically the first time the new code runs `ensureSchema()`. The rename carries indexes, constraints, and foreign keys with it, so no data moves and nothing is dropped. Back up first regardless.
- **Existing API keys keep working.** Keys are matched by hash, and the `oq_`/`ons_` prefix is never validated. Only newly created keys use the `ons_` prefix.
- **You will be signed out once.** The session cookie was renamed, so open `/setup` and sign in with Microsoft again.
- **Update `APP_URL`** to your new address if you also changed your domain, then update the redirect URI in your Microsoft Entra app registration to match. OAuth fails until those two agree.
- **Docker self-hosters:** `.env.example` now uses `onenote_system` for the PostgreSQL database and role. Keep your existing `DATABASE_URL` as-is unless you intend to migrate the database itself.

## Beginner deployment

1. Open the [Vercel deployment flow](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDudeThatsErin%2Fonenote-system&project-name=onenote-system&repository-name=onenote-system).
2. Let Vercel create your copy of this repository and make the first deployment.
3. Install [Neon from the Vercel Marketplace](https://vercel.com/marketplace/neon) for that project. It supplies `DATABASE_URL`.
4. Add `APP_URL` and a random `APP_ENCRYPTION_KEY` in Vercel Environment Variables.
5. Redeploy, open `/setup` on your copy, and follow the Microsoft walkthrough.
6. Create an API key and follow the `/shortcuts` guide. Discord users can continue to Setup Step 6.

The site documentation explains what each service is, why it is required, and each exact screen to use.

## Environment variables

| Name | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Neon/Supabase/PostgreSQL connection string |
| `APP_URL` | Yes | Public HTTPS origin, with no trailing slash |
| `APP_ENCRYPTION_KEY` | Yes | Encrypts Microsoft credentials and signs sessions |
| `POSTGRES_PASSWORD` | Docker only | Password for the bundled PostgreSQL container |
| `CRON_SECRET` | No | Protects the currently empty maintenance cron endpoint |

Generate encryption keys with `openssl rand -base64 32`. Never commit `.env`, database URLs, Microsoft secrets, API keys, or tokens.

## Self-host with Docker

```bash
git clone https://github.com/DudeThatsErin/onenote-system.git
cd onenote-system
cp .env.example .env
# Replace both CHANGE_ME values and configure APP_URL and APP_ENCRYPTION_KEY.
docker compose up -d --build
```

Put the app behind HTTPS before completing Microsoft OAuth. Back up the PostgreSQL volume and `.env` securely.

## Capture API

```http
POST /api/capture
Authorization: Bearer ons_YOUR_PRIVATE_KEY
Content-Type: application/json

{
  "title": "Article",
  "content": "Text to save",
  "url": "https://example.com"
}
```

A successful request returns `201 Created` with the created page ID, title, and OneNote web URL.

## Append API

```http
POST /api/append
Authorization: Bearer ons_YOUR_PRIVATE_KEY
Content-Type: application/json

{
  "pageTitle": "Quick Inbox",
  "content": "Text to add",
  "url": "https://example.com"
}
```

Use either `pageTitle` to find an exact title in the configured default section or `pageId` to identify a page directly. A successful request returns `200 OK` after Microsoft Graph appends the content.

## Discord

Setup Step 6 stores the Discord application ID, public key, encrypted bot token, and optional test server ID. It provides the exact interactions endpoint, registers the `/onenote` command through Discord API v10, and can remove the command again. Incoming requests must have a current timestamp and a valid Ed25519 signature before the app responds to PING or handles a command.

`/onenote create` creates a page in the configured default section. `/onenote append` finds an exact page title in that section and appends text. Results are ephemeral Discord responses.

## Privacy and security

The site stores its last-viewed setup step and light/dark preference in browser `localStorage`. Microsoft client secrets and OAuth tokens are encrypted with AES-256-GCM in the deployment's database. Capture API keys are stored as SHA-256 hashes. Captured note content is sent to Microsoft during the request and is not intentionally retained in the OneNote System database.

Each deployment currently has one Microsoft app registration configuration and can connect multiple Microsoft users to it. Treat a deployment as a trusted private installation until setup ownership controls and account-management UI are expanded.

## Development

```bash
npm install
npm run dev
npm run lint
npm run build
```

## License

[MIT](LICENSE)
