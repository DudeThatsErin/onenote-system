# OneNote Queue

OneNote Queue is an open-source, self-hostable capture API and setup dashboard for Microsoft OneNote. Deploy your own copy, connect Microsoft, choose a destination section, then create OneNote pages from Apple Shortcuts or any HTTPS client.

The public guide is available at [onenotequeue.erinskidds.com](https://onenotequeue.erinskidds.com/).

## What works today

- Guided Neon/PostgreSQL and Microsoft Entra setup
- Microsoft OAuth with encrypted access and refresh tokens
- Notebook and section picker
- Hashed per-user capture API keys
- `POST /api/capture` for a title, plain-text body, and optional source URL
- Vercel deployment and Docker Compose self-hosting

Append-to-page and Discord interactions are planned but are not operational in the current release. The documentation labels them accordingly.

## Beginner deployment

1. Open the [Vercel deployment flow](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDudeThatsErin%2Fonenote-queue&project-name=onenote-queue&repository-name=onenote-queue).
2. Let Vercel create your copy of this repository and make the first deployment.
3. Install [Neon from the Vercel Marketplace](https://vercel.com/marketplace/neon) for that project. It supplies `DATABASE_URL`.
4. Add `APP_URL` and a random `APP_ENCRYPTION_KEY` in Vercel Environment Variables.
5. Redeploy, open `/setup` on your copy, and follow the Microsoft walkthrough.
6. Create an API key and follow the `/shortcuts` guide.

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
git clone https://github.com/DudeThatsErin/onenote-queue.git
cd onenote-queue
cp .env.example .env
# Replace both CHANGE_ME values and configure APP_URL and APP_ENCRYPTION_KEY.
docker compose up -d --build
```

Put the app behind HTTPS before completing Microsoft OAuth. Back up the PostgreSQL volume and `.env` securely.

## Capture API

```http
POST /api/capture
Authorization: Bearer oq_YOUR_PRIVATE_KEY
Content-Type: application/json

{
  "title": "Article",
  "content": "Text to save",
  "url": "https://example.com"
}
```

A successful request returns `201 Created` with the created page ID, title, and OneNote web URL.

## Privacy and security

The setup wizard stores only its last-viewed step number in browser `localStorage`. Microsoft client secrets and OAuth tokens are encrypted with AES-256-GCM in the deployment's database. Capture API keys are stored as SHA-256 hashes. Captured note content is sent to Microsoft during the request and is not intentionally retained in the OneNote Queue database.

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
