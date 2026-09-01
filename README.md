# OneNote Queue

An open-source, self-hostable capture API and setup dashboard for Microsoft OneNote. Connect your own Microsoft app, select a destination section, then send notes from iOS Shortcuts, Discord, or any HTTPS client.

## Deploy

The beginner path is [Vercel](https://vercel.com/new) + [Neon Postgres](https://vercel.com/marketplace/neon). Add `DATABASE_URL`, `APP_URL`, and a random `APP_ENCRYPTION_KEY`; deploy; then follow the in-app setup guide.

Use `docker compose up -d --build` for self-hosting. Before doing so, set a strong Postgres password and configure `DATABASE_URL` in `.env`.

## Privacy

The setup wizard stores only non-sensitive progress markers in the browser's `localStorage`. OAuth state uses a short-lived, HttpOnly cookie. Client secrets, access tokens, refresh tokens, and capture API keys are never placed in browser storage; they are encrypted/hashed in the deployment's own database.

## Microsoft and Discord setup

The app includes step-by-step Microsoft Entra directions at `/docs`. Discord is optional and is documented as an advanced setup, using signed HTTP interactions for Vercel or an optional persistent bot for self-hosting.

## License

MIT. See [LICENSE](LICENSE).
