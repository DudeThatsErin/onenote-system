import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

const DEPLOY_URL = 'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDudeThatsErin%2Fonenote-queue&project-name=onenote-queue&repository-name=onenote-queue';

const ENVIRONMENT = `# Required: generate a new random value for each installation
APP_ENCRYPTION_KEY=PASTE_A_RANDOM_32_BYTE_KEY

# Required: the public address of this installation, with no trailing slash
APP_URL=https://YOUR-PROJECT.vercel.app

# Required: added automatically by the Vercel + Neon integration
DATABASE_URL=postgresql://...

# Optional: protects the currently empty maintenance cron endpoint
CRON_SECRET=PASTE_ANOTHER_LONG_RANDOM_VALUE`;

const CURL = `curl -X POST "https://YOUR-DOMAIN/api/capture" \\
  -H "Authorization: Bearer oq_YOUR_PRIVATE_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{
    "title": "Saved from OneNote Queue",
    "content": "This becomes the body of a new OneNote page.",
    "url": "https://example.com/source"
  }'`;

const SELF_HOST = `git clone https://github.com/DudeThatsErin/onenote-queue.git
cd onenote-queue
cp .env.example .env
# Edit .env before continuing.
docker compose up -d --build`;

export default function DocsPage() {
  return <main>
    <SiteHeader />
    <section className="doc-hero">
      <p className="eyebrow">Documentation</p>
      <h1>Build and understand your OneNote Queue</h1>
      <p className="lead">Start with the beginner deployment path, then use this page as the reference for Microsoft permissions, settings, the capture API, privacy, updates, and common errors.</p>
    </section>

    <nav className="toc" aria-label="Documentation sections">
      <a href="#start">Start here</a>
      <a href="#vercel">Vercel deployment</a>
      <a href="#database">Neon database</a>
      <a href="#environment">Private settings</a>
      <a href="#microsoft">Microsoft app</a>
      <a href="#connect">Connect OneNote</a>
      <a href="#shortcuts">Shortcuts</a>
      <a href="#api">Capture API</a>
      <a href="#security">Security</a>
      <a href="#self-hosting">Self-hosting</a>
      <a href="#updates">Updates</a>
      <a href="#advanced-discord">Discord</a>
      <a href="#troubleshooting">Troubleshooting</a>
    </nav>

    <article className="documentation">
      <section id="start">
        <h2>Start here: what you are creating</h2>
        <p>You are not creating an account on a shared OneNote Queue service. You are making your own copy of the project in accounts you control:</p>
        <div className="table-wrap"><table><thead><tr><th>Part</th><th>What it does</th><th>Who controls it</th></tr></thead><tbody>
          <tr><td><strong>GitHub repository</strong></td><td>Holds the open-source code and sends updates to Vercel</td><td>You</td></tr>
          <tr><td><strong>Vercel project</strong></td><td>Runs the website and private capture API on the internet</td><td>You</td></tr>
          <tr><td><strong>Neon database</strong></td><td>Stores encrypted Microsoft credentials, your chosen section, and hashed API keys</td><td>You</td></tr>
          <tr><td><strong>Microsoft app registration</strong></td><td>Lets your deployment ask Microsoft for limited, revocable OneNote access</td><td>You</td></tr>
          <tr><td><strong>Shortcut</strong></td><td>Sends title and text from your device to your deployment</td><td>You</td></tr>
        </tbody></table></div>
        <p>Expect the first setup to take roughly 20–40 minutes because both Vercel and Microsoft require several confirmation screens. You do not need to write code, but you do need to copy values exactly.</p>
      </section>

      <section id="vercel">
        <h2>Part 1: deploy your copy to Vercel</h2>
        <p><strong>What Vercel is:</strong> Vercel runs the OneNote Queue website and API for you. When a Shortcut sends a note, Vercel receives the request and runs the code. Your personal computer does not need to stay on.</p>
        <ol className="steps compact-steps">
          <li><h3>Create or sign in to GitHub</h3><p>Use <a href="https://github.com/signup" target="_blank" rel="noreferrer">GitHub&apos;s sign-up page ↗</a>. GitHub stores your copy of the source code. Keep the repository private if you ever add personal changes, and never commit secret values.</p></li>
          <li><h3>Open the deployment link</h3><p><a className="button" href={DEPLOY_URL} target="_blank" rel="noreferrer">Deploy OneNote Queue on Vercel ↗</a></p><p>Vercel will ask you to sign in. Choosing <strong>Continue with GitHub</strong> is easiest because Vercel needs permission to create and deploy your copy.</p></li>
          <li><h3>Create the Git repository</h3><p>On the “Create Git Repository” screen, keep the name <code>onenote-queue</code> or choose another name. This new repository belongs to your GitHub account; it is not the original project.</p></li>
          <li><h3>Create the first deployment</h3><p>Choose <strong>Deploy</strong>. The first deployment may show setup errors because the database and private settings do not exist yet. That is expected. Wait until Vercel gives you a project URL ending in <code>.vercel.app</code>, then copy that complete URL.</p></li>
        </ol>
        <p>Vercel can automatically deploy later changes pushed to the connected GitHub repository. See Vercel&apos;s official <a href="https://vercel.com/docs/git" target="_blank" rel="noreferrer">Git deployment documentation ↗</a> for how that relationship works.</p>
      </section>

      <section id="database">
        <h2>Part 2: add a Neon database</h2>
        <p><strong>What Neon is:</strong> Neon is a company that runs PostgreSQL databases. PostgreSQL is the database software; Neon operates it, secures the database server, and gives your Vercel project a private connection address. For light personal use, its free tier is usually enough, subject to Neon&apos;s current limits.</p>
        <p><strong>Why this is required:</strong> Vercel functions do not keep permanent files between requests. The database remembers your encrypted Microsoft connection, default section, and API keys after each request ends.</p>
        <ol className="steps compact-steps">
          <li><h3>Open Neon inside the Vercel Marketplace</h3><p>Visit the <a href="https://vercel.com/marketplace/neon" target="_blank" rel="noreferrer">official Neon Marketplace listing ↗</a> while signed in to Vercel.</p></li>
          <li><h3>Add the integration</h3><p>Choose <strong>Add Integration</strong>. Select your Vercel account and the OneNote Queue project you created above. Continue to Neon and create an account if asked.</p></li>
          <li><h3>Create the database</h3><p>Use a recognizable project name such as <code>onenote-queue</code>. Use the region closest to you. Keep the generated database and role defaults unless you know you need something different.</p></li>
          <li><h3>Confirm the project connection</h3><p>Neon/Vercel should add an environment variable named <code>DATABASE_URL</code> to the OneNote Queue project. You do not need to open or copy its value.</p></li>
          <li><h3>Redeploy</h3><p>In Vercel, open your OneNote Queue project, then <strong>Deployments</strong>. Open the <strong>⋯</strong> menu beside the newest deployment and choose <strong>Redeploy</strong>. Existing deployments cannot see settings added afterward.</p></li>
        </ol>
        <div className="callout warning"><p><strong>Never share DATABASE_URL.</strong> Despite its name, it contains the database hostname, username, and password. Neon&apos;s official <a href="https://neon.com/docs/guides/vercel-manual" target="_blank" rel="noreferrer">manual Vercel connection guide ↗</a> is available if the Marketplace integration does not add it automatically.</p></div>
      </section>

      <section id="environment">
        <h2>Part 3: add the private application settings</h2>
        <p>An <strong>environment variable</strong> is a private setting Vercel gives to the running app without placing it in GitHub. Open your Vercel project, then <strong>Settings → Environment Variables</strong>.</p>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Required?</th><th>What to enter</th></tr></thead><tbody>
          <tr><td><code>APP_ENCRYPTION_KEY</code></td><td>Yes</td><td>A new random secret used to encrypt Microsoft credentials and sign login cookies. Generate it once and do not change it casually.</td></tr>
          <tr><td><code>APP_URL</code></td><td>Yes</td><td>Your complete production URL, such as <code>https://onenote-queue-abc.vercel.app</code>, with no trailing slash.</td></tr>
          <tr><td><code>DATABASE_URL</code></td><td>Yes</td><td>Neon should add this automatically. Do not replace it with the words shown in the example.</td></tr>
          <tr><td><code>CRON_SECRET</code></td><td>No</td><td>A separate random secret. The current maintenance endpoint performs no synchronization work, so this can be omitted.</td></tr>
        </tbody></table></div>
        <h3>Generate the encryption key</h3>
        <p>If you have a Mac, open <strong>Terminal</strong>, run <code>openssl rand -base64 32</code>, and copy the result. On Windows, use a trusted password manager&apos;s password generator to create at least 43 random letters, numbers, and symbols. Do not use a normal password, your name, or the example text.</p>
        <pre><code>{ENVIRONMENT}</code></pre>
        <p>Apply each variable to <strong>Production</strong>, <strong>Preview</strong>, and <strong>Development</strong> if Vercel asks. Save, then redeploy again. Vercel documents these settings in its <a href="https://vercel.com/docs/environment-variables" target="_blank" rel="noreferrer">environment variable guide ↗</a>.</p>
      </section>

      <section id="microsoft">
        <h2>Part 4: create your Microsoft app registration</h2>
        <p><strong>What you are doing:</strong> Microsoft will not let an unknown website read or write OneNote. An app registration gives your deployment an identity, a list of permitted actions, and a callback address. You can remove the registration later to revoke the connection.</p>
        <div className="callout"><p>Keep your Vercel project URL nearby. The callback address must match exactly. A missing letter, extra slash, or <code>http</code> instead of <code>https</code> will stop sign-in.</p></div>
        <ol className="steps compact-steps">
          <li><h3>Open Microsoft Entra</h3><p>Go to the <a href="https://entra.microsoft.com/" target="_blank" rel="noreferrer">Microsoft Entra admin center ↗</a> and sign in with the Microsoft account that owns the OneNote notebooks. Personal Microsoft accounts may be redirected through an account/tenant setup screen.</p></li>
          <li><h3>Start an app registration</h3><p>Open <strong>Identity → Applications → App registrations</strong>, then choose <strong>New registration</strong>. Microsoft&apos;s official <a href="https://learn.microsoft.com/en-us/graph/auth-register-app-v2" target="_blank" rel="noreferrer">app registration guide ↗</a> includes screenshots and definitions.</p></li>
          <li><h3>Name it and choose account access</h3><p>Name it <code>OneNote Queue</code>. Choose <strong>Accounts in any organizational directory and personal Microsoft accounts</strong> if you want the deployment to accept either work/school or personal Microsoft accounts.</p></li>
          <li><h3>Add the Web redirect URI</h3><p>For platform, choose <strong>Web</strong>. Enter <code>https://YOUR-VERCEL-DOMAIN/api/auth/microsoft/callback</code>. Replace only <code>YOUR-VERCEL-DOMAIN</code>. Example: <code>https://my-queue.vercel.app/api/auth/microsoft/callback</code>.</p></li>
          <li><h3>Copy the Application (client) ID</h3><p>After registration, the Overview screen shows an <strong>Application (client) ID</strong>. Copy the long identifier. Do not copy the Object ID or Directory ID.</p></li>
          <li><h3>Create a client secret</h3><p>Open <strong>Certificates &amp; secrets → Client secrets → New client secret</strong>. Name it <code>OneNote Queue</code>, choose an expiration, and create it. Copy the secret&apos;s <strong>Value</strong> immediately. Do not copy the Secret ID. Microsoft will never display the Value again.</p></li>
          <li><h3>Add Microsoft Graph permissions</h3><p>Open <strong>API permissions → Add a permission → Microsoft Graph → Delegated permissions</strong>. Add <code>User.Read</code> and <code>Notes.ReadWrite</code>. <code>offline_access</code> is requested during Microsoft sign-in so the connection can refresh without asking you every hour.</p></li>
        </ol>
        <p>Microsoft&apos;s Graph documentation confirms that creating OneNote pages uses delegated OneNote permissions and that page content is sent as HTML. See <a href="https://learn.microsoft.com/en-us/graph/api/onenote-post-pages?view=graph-rest-1.0" target="_blank" rel="noreferrer">Create OneNote pages ↗</a>.</p>
      </section>

      <section id="connect">
        <h2>Part 5: connect Microsoft and select a section</h2>
        <ol className="steps compact-steps">
          <li><h3>Open your deployment&apos;s setup page</h3><p>Use <code>https://YOUR-VERCEL-DOMAIN/setup</code>. Do this on your deployed copy, not this project&apos;s public information site.</p></li>
          <li><h3>Save the Microsoft app values</h3><p>In Setup Step 2, paste the Application (client) ID and the client secret <strong>Value</strong>. The server encrypts the secret before storing it.</p></li>
          <li><h3>Connect your account</h3><p>Setup Step 3 sends you to Microsoft. Verify that the browser address is a Microsoft domain, read the requested access, and approve it.</p></li>
          <li><h3>Choose the destination</h3><p>In Setup Step 4, load notebooks, choose a notebook, and select the section that should behave as your capture inbox.</p></li>
          <li><h3>Create a Shortcut API key</h3><p>Setup Step 5 displays the key exactly once. Save it in your password manager. The database stores only a hash and cannot show the original later.</p></li>
        </ol>
      </section>

      <section id="shortcuts">
        <h2>Part 6: install or build a Shortcut</h2>
        <p>The Shortcut needs two values: your deployment URL and the <code>oq_</code> API key from Setup Step 5. It does not need your Microsoft client secret, Microsoft password, database URL, or encryption key.</p>
        <p><Link className="button" href="/shortcuts">Open the complete Shortcuts guide →</Link></p>
        <p>The Shortcuts page identifies which iCloud download links are still missing, explains every configuration answer, and includes a complete manual Quick Inbox build that works without a download.</p>
      </section>

      <section id="api">
        <h2>Capture API reference</h2>
        <p>The current release has one public capture operation. It creates a new page in the signed-in user&apos;s default OneNote section.</p>
        <div className="table-wrap"><table><thead><tr><th>Method</th><th>Path</th><th>Authentication</th><th>Success</th></tr></thead><tbody>
          <tr><td><code>POST</code></td><td><code>/api/capture</code></td><td><code>Authorization: Bearer oq_…</code></td><td><code>201 Created</code></td></tr>
        </tbody></table></div>
        <div className="table-wrap"><table><thead><tr><th>JSON field</th><th>Required?</th><th>Limit and behavior</th></tr></thead><tbody>
          <tr><td><code>title</code></td><td>No</td><td>Plain text, trimmed to 200 characters. Defaults to “Untitled capture.”</td></tr>
          <tr><td><code>content</code></td><td>No</td><td>Plain text, up to 100,000 characters. New lines become line breaks.</td></tr>
          <tr><td><code>url</code></td><td>No</td><td>Included as a source link only when it begins with <code>http://</code> or <code>https://</code>.</td></tr>
        </tbody></table></div>
        <h3>Example request</h3>
        <pre><code>{CURL}</code></pre>
        <h3>Example success response</h3>
        <pre><code>{`{
  "ok": true,
  "page": {
    "id": "…",
    "title": "Saved from OneNote Queue",
    "webUrl": "https://…"
  }
}`}</code></pre>
        <p>Error responses use <code>{'{ "error": "Explanation" }'}</code>. A <code>401</code> usually means a missing/incorrect key; <code>409</code> means no default section has been chosen; <code>500</code> means the database or Microsoft request failed.</p>
      </section>

      <section id="security">
        <h2>Security and data storage</h2>
        <div className="table-wrap"><table><thead><tr><th>Information</th><th>Where it is stored</th><th>Protection</th></tr></thead><tbody>
          <tr><td>Setup step number</td><td>Your browser&apos;s <code>localStorage</code></td><td>Not sensitive; used only to reopen the last viewed step</td></tr>
          <tr><td>Login session</td><td>HttpOnly cookie</td><td>Signed; JavaScript cannot read it; Secure in production</td></tr>
          <tr><td>Microsoft client secret</td><td>Your database</td><td>AES-256-GCM encrypted using <code>APP_ENCRYPTION_KEY</code></td></tr>
          <tr><td>Microsoft access/refresh tokens</td><td>Your database</td><td>AES-256-GCM encrypted</td></tr>
          <tr><td>Shortcut API keys</td><td>Your database</td><td>One-way SHA-256 hash; original shown once</td></tr>
          <tr><td>Captured note text</td><td>Sent to Microsoft during the request</td><td>Not intentionally retained by the OneNote Queue database</td></tr>
        </tbody></table></div>
        <p>Keep <code>APP_ENCRYPTION_KEY</code>, <code>DATABASE_URL</code>, Microsoft client secrets, refresh tokens, API keys, and Discord bot tokens out of GitHub and screenshots. If an API key leaks, create a replacement. Key revocation UI is not yet included, so database/manual administration is currently required to remove an old key.</p>
        <p>This software is provided under the MIT License without warranty. Review the source and provider terms before using it for sensitive or regulated information.</p>
      </section>

      <section id="self-hosting">
        <h2>Self-host with Docker</h2>
        <p>This route is for people comfortable maintaining a Linux server. You need Docker, Docker Compose, a domain name, HTTPS, backups, and a plan for applying updates.</p>
        <ol className="steps compact-steps">
          <li><h3>Clone the repository</h3><pre><code>{SELF_HOST}</code></pre><p>Do not run the final command until the environment file and database password are changed.</p></li>
          <li><h3>Set a strong PostgreSQL password</h3><p>Edit <code>docker-compose.yml</code> or supply the documented Compose variable. The password in the example is not safe for a public server.</p></li>
          <li><h3>Complete <code>.env</code></h3><p>Set <code>APP_URL</code> to your HTTPS domain, generate <code>APP_ENCRYPTION_KEY</code>, and set <code>DATABASE_URL</code> to the PostgreSQL container connection string.</p></li>
          <li><h3>Start the containers</h3><p>Run <code>docker compose up -d --build</code>, inspect <code>docker compose logs -f app</code>, and verify <code>https://YOUR-DOMAIN/api/health</code>.</p></li>
          <li><h3>Put it behind HTTPS</h3><p>Use Nginx, Caddy, Traefik, or another reverse proxy. Microsoft OAuth requires an exact, stable HTTPS callback address in production.</p></li>
          <li><h3>Back up PostgreSQL</h3><p>The database contains the encrypted connection and configuration. Losing the database means reconnecting accounts and generating new API keys.</p></li>
        </ol>
      </section>

      <section id="updates">
        <h2>Update an installation</h2>
        <h3>Vercel</h3>
        <p>Your deployed GitHub repository is a separate copy. GitHub does not automatically pull changes from the original project. Use GitHub&apos;s “Sync fork” feature if your repository is a fork, review changes, then let Vercel deploy the updated branch. Back up the database before a release that changes its schema.</p>
        <h3>Self-hosted</h3>
        <pre><code>{`git pull --ff-only
docker compose build --pull
docker compose up -d
docker compose logs --tail=100 app`}</code></pre>
        <p>Read release notes first and preserve your <code>.env</code> and PostgreSQL volume.</p>
      </section>

      <section id="advanced-discord">
        <h2>Advanced Discord integration</h2>
        <div className="callout warning"><p><strong>Status: not operational in this release.</strong> The setup screen can describe and reserve Discord configuration, but the HTTP interaction handler and command registration are not implemented yet. Do not create a production Discord app or paste a bot token until the adapter is released.</p></div>
        <p>The planned Vercel-compatible approach uses Discord HTTP interactions, which do not require an always-running bot process. It will require a Discord Application ID, Public Key, and an Interactions Endpoint URL ending in <code>/api/discord/interactions</code>. Every request must pass Discord&apos;s Ed25519 signature check and PING validation before Discord accepts the endpoint.</p>
        <p>See Discord&apos;s official <a href="https://docs.discord.com/developers/interactions/overview" target="_blank" rel="noreferrer">Interactions overview ↗</a>. A bot token will be necessary only if a future self-hosted gateway mode is added; it must never appear in a browser, Shortcut, repository, or public environment variable.</p>
      </section>

      <section id="troubleshooting">
        <h2>Troubleshooting</h2>
        <div className="troubleshooting">
          <details><summary>Setup says DATABASE_URL is not configured</summary><p>The Neon integration was not connected to this Vercel project, or the app was not redeployed after it was connected. Check <strong>Vercel → Project → Settings → Environment Variables</strong> for <code>DATABASE_URL</code>, then redeploy.</p></details>
          <details><summary>Microsoft says the redirect URI does not match</summary><p>Compare the URI in Entra with <code>APP_URL</code> plus <code>/api/auth/microsoft/callback</code>. They must match exactly, including <code>https</code>, subdomain, path, and absence of a trailing slash.</p></details>
          <details><summary>Microsoft sign-in works but notebooks do not load</summary><p>Confirm that the app registration has delegated <code>Notes.ReadWrite</code> permission and that you approved it. Reconnect the Microsoft account after changing permissions.</p></details>
          <details><summary>APP_ENCRYPTION_KEY is not configured</summary><p>Add a strong random value in Vercel Environment Variables and redeploy. Do not change an existing key after credentials are stored; old encrypted values cannot be decrypted with a new key.</p></details>
          <details><summary>The Shortcut receives Unauthorized</summary><p>Confirm the header is exactly <code>Authorization: Bearer oq_…</code>. There must be one space after <code>Bearer</code>. The key must come from the same deployment receiving the request.</p></details>
          <details><summary>The Shortcut says no default section is selected</summary><p>Open Setup Step 4 on the same deployment and choose a notebook and section while signed in with Microsoft.</p></details>
          <details><summary>A secret expired</summary><p>Create a new Microsoft client secret Value in Entra, save it through Setup Step 2, then reconnect Microsoft. Microsoft recommends rotating credentials and client secrets have limited lifetimes.</p></details>
          <details><summary>Where can I report a reproducible bug?</summary><p>Remove every secret and personal note from screenshots/logs, then open a <a href="https://github.com/DudeThatsErin/onenote-queue/issues" target="_blank" rel="noreferrer">GitHub issue ↗</a> with the deployment type, route, status code, and exact non-secret error.</p></details>
        </div>
      </section>
    </article>

    <SiteFooter />
  </main>;
}
