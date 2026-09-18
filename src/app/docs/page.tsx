import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

const DEPLOY_URL = 'https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FDudeThatsErin%2Fonenote-system&project-name=onenote-system&repository-name=onenote-system';

const ENVIRONMENT = `# Required: generate a new random value for each installation
APP_ENCRYPTION_KEY=PASTE_A_RANDOM_32_BYTE_KEY

# Required: the public address of this installation, with no trailing slash
APP_URL=https://YOUR-PROJECT.vercel.app

# Required: added automatically by the Vercel + Neon integration
DATABASE_URL=postgresql://...

# Optional: protects the currently empty maintenance cron endpoint
CRON_SECRET=PASTE_ANOTHER_LONG_RANDOM_VALUE`;

const CURL = `curl -X POST "https://YOUR-DOMAIN/api/capture" \\
  -H "Authorization: Bearer ons_YOUR_PRIVATE_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{
    "title": "Saved from OneNote System",
    "content": "This becomes the body of a new OneNote page.",
    "url": "https://example.com/source"
  }'`;

const APPEND_CURL = `curl -X POST "https://YOUR-DOMAIN/api/append" \\
  -H "Authorization: Bearer ons_YOUR_PRIVATE_KEY" \\
  -H "Content-Type: application/json" \\
  --data '{
    "pageTitle": "Quick Inbox",
    "content": "This text is added to the existing page.",
    "url": "https://example.com/source"
  }'`;

const SELF_HOST = `git clone https://github.com/DudeThatsErin/onenote-system.git
cd onenote-system
cp .env.example .env
# Edit .env before continuing.
docker compose up -d --build`;

export default function DocsPage() {
  return <main>
    <SiteHeader />
    <section className="doc-hero">
      <p className="eyebrow">Documentation</p>
      <h1>Build and understand your OneNote System</h1>
      <p className="lead">Start with the beginner deployment path, then use this page as the reference for Microsoft permissions, settings, the OneNote APIs, privacy, updates, and common errors.</p>
    </section>

    <nav className="toc" aria-label="Documentation sections">
      <a href="#start">Start here</a>
      <a href="#vercel">Vercel deployment</a>
      <a href="#database">Neon database</a>
      <a href="#environment">Private settings</a>
      <a href="#microsoft">Microsoft app</a>
      <a href="#connect">Connect OneNote</a>
      <a href="#shortcuts">Shortcuts</a>
      <a href="#terminal">Terminal</a>
      <a href="#api">OneNote APIs</a>
      <a href="#security">Security</a>
      <a href="#self-hosting">Self-hosting</a>
      <a href="#updates">Updates</a>
      <a href="#advanced-discord">Discord</a>
      <a href="#troubleshooting">Troubleshooting</a>
    </nav>

    <article className="documentation">
      <section id="start">
        <h2>Start here: what you are creating</h2>
        <p>You are not creating an account on a shared OneNote System service. You are making your own copy of the project in accounts you control:</p>
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
        <p><strong>What Vercel is:</strong> Vercel runs the OneNote System website and API for you. When a Shortcut sends a note, Vercel receives the request and runs the code. Your personal computer does not need to stay on.</p>
        <ol className="steps compact-steps">
          <li><h3>Create or sign in to GitHub</h3><p>Use <a href="https://github.com/signup" target="_blank" rel="noreferrer">GitHub&apos;s sign-up page ↗</a>. GitHub stores your copy of the source code. Keep the repository private if you ever add personal changes, and never commit secret values.</p></li>
          <li><h3>Open the deployment link</h3><p><a className="button" href={DEPLOY_URL} target="_blank" rel="noreferrer">Deploy OneNote System on Vercel ↗</a></p><p>Vercel will ask you to sign in. Choosing <strong>Continue with GitHub</strong> is easiest because Vercel needs permission to create and deploy your copy.</p></li>
          <li><h3>Create the Git repository</h3><p>On the “Create Git Repository” screen, keep the name <code>onenote-system</code> or choose another name. This new repository belongs to your GitHub account; it is not the original project.</p></li>
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
          <li><h3>Add the integration</h3><p>Choose <strong>Add Integration</strong>. Select your Vercel account and the OneNote System project you created above. Continue to Neon and create an account if asked.</p></li>
          <li><h3>Create the database</h3><p>Use a recognizable project name such as <code>onenote-system</code>. Use the region closest to you. Keep the generated database and role defaults unless you know you need something different.</p></li>
          <li><h3>Confirm the project connection</h3><p>Neon/Vercel should add an environment variable named <code>DATABASE_URL</code> to the OneNote System project. You do not need to open or copy its value.</p></li>
          <li><h3>Redeploy</h3><p>In Vercel, open your OneNote System project, then <strong>Deployments</strong>. Open the <strong>⋯</strong> menu beside the newest deployment and choose <strong>Redeploy</strong>. Existing deployments cannot see settings added afterward.</p></li>
        </ol>
        <div className="callout warning"><p><strong>Never share DATABASE_URL.</strong> Despite its name, it contains the database hostname, username, and password. Neon&apos;s official <a href="https://neon.com/docs/guides/vercel-manual" target="_blank" rel="noreferrer">manual Vercel connection guide ↗</a> is available if the Marketplace integration does not add it automatically.</p></div>
      </section>

      <section id="environment">
        <h2>Part 3: add the private application settings</h2>
        <p>An <strong>environment variable</strong> is a private setting Vercel gives to the running app without placing it in GitHub. Open your Vercel project, then <strong>Settings → Environment Variables</strong>.</p>
        <div className="table-wrap"><table><thead><tr><th>Name</th><th>Required?</th><th>What to enter</th></tr></thead><tbody>
          <tr><td><code>APP_ENCRYPTION_KEY</code></td><td>Yes</td><td>A new random secret used to encrypt Microsoft credentials and sign login cookies. Generate it once and do not change it casually.</td></tr>
          <tr><td><code>APP_URL</code></td><td>Yes</td><td>Your complete production URL, such as <code>https://onenote-system-abc.vercel.app</code>, with no trailing slash.</td></tr>
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
          <li><h3>Name it and choose account access</h3><p>Name it <code>OneNote System</code>. Choose <strong>Accounts in any organizational directory and personal Microsoft accounts</strong> if you want the deployment to accept either work/school or personal Microsoft accounts.</p></li>
          <li><h3>Add the Web redirect URI</h3><p>For platform, choose <strong>Web</strong>. Enter <code>https://YOUR-VERCEL-DOMAIN/api/auth/microsoft/callback</code>. Replace only <code>YOUR-VERCEL-DOMAIN</code>. Example: <code>https://my-queue.vercel.app/api/auth/microsoft/callback</code>.</p></li>
          <li><h3>Copy the Application (client) ID</h3><p>After registration, the Overview screen shows an <strong>Application (client) ID</strong>. Copy the long identifier. Do not copy the Object ID or Directory ID.</p></li>
          <li><h3>Create a client secret</h3><p>Open <strong>Certificates &amp; secrets → Client secrets → New client secret</strong>. Name it <code>OneNote System</code>, choose an expiration, and create it. Copy the secret&apos;s <strong>Value</strong> immediately. Do not copy the Secret ID. Microsoft will never display the Value again.</p></li>
          <li><h3>Add Microsoft Graph permissions</h3><p>Open <strong>API permissions → Add a permission → Microsoft Graph → Delegated permissions</strong>. Add <code>User.Read</code>, <code>Notes.ReadWrite</code>, and <code>Tasks.ReadWrite</code>. <code>offline_access</code> is requested during Microsoft sign-in so the connection can refresh without asking you every hour.</p><p><code>Tasks.ReadWrite</code> is what powers Microsoft To Do. Leave it out if you only want OneNote pages — everything else still works. If you add it to an existing deployment, reconnect Microsoft afterwards: a permission added later does not upgrade a connection that was already approved.</p></li>
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
        <p>The Shortcut needs two values: your deployment URL and the <code>ons_</code> API key from Setup Step 5. It does not need your Microsoft client secret, Microsoft password, database URL, or encryption key.</p>
        <p><Link className="button" href="/shortcuts">Open the complete Shortcuts guide →</Link></p>
        <p>The Shortcuts page identifies which iCloud download links are still missing, explains every configuration answer, and includes a complete manual Quick Inbox build that works without a download.</p>
      </section>

      <section id="terminal">
        <h2>Part 7: use OneNote from a terminal</h2>
        <p>The <code>onenotesystem</code> command is the official command-line client. It takes the same two values a Shortcut does — your deployment URL and an <code>ons_</code> API key — and calls the same two endpoints, so pages created from a shell and pages created from a phone are identical.</p>
        <pre><code>dotnet tool install --global OneNoteSystem.Cli
onenotesystem configure
onenotesystem capture &quot;Standup notes&quot; --content &quot;Shipped the CLI&quot;</code></pre>
        <p>It exists for the machines OneNote will not run on: Linux desktops, servers you only reach over SSH, and work computers where the OneNote app cannot be installed. It needs the .NET 8 SDK and has no other dependencies.</p>
        <p><Link className="button" href="/terminal">Open the complete terminal guide →</Link></p>
      </section>

      <section id="api">
        <h2>OneNote API reference</h2>
        <p>The API can create a page in the signed-in user&apos;s default section or append plain text to an existing page.</p>
        <div className="table-wrap"><table><thead><tr><th>Method</th><th>Path</th><th>Authentication</th><th>Success</th></tr></thead><tbody>
          <tr><td><code>POST</code></td><td><code>/api/capture</code></td><td><code>Authorization: Bearer ons_…</code></td><td><code>201 Created</code></td></tr>
          <tr><td><code>POST</code></td><td><code>/api/append</code></td><td><code>Authorization: Bearer ons_…</code></td><td><code>200 OK</code></td></tr>
        </tbody></table></div>
        <h3>Create a page: <code>POST /api/capture</code></h3>
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
    "title": "Saved from OneNote System",
    "webUrl": "https://…"
  }
}`}</code></pre>
        <h3>Append to a page: <code>POST /api/append</code></h3>
        <div className="table-wrap"><table><thead><tr><th>JSON field</th><th>Required?</th><th>Limit and behavior</th></tr></thead><tbody>
          <tr><td><code>pageTitle</code></td><td>One target required</td><td>Exact title of a page in the default section, up to 200 characters. Duplicate titles return <code>409</code>.</td></tr>
          <tr><td><code>pageId</code></td><td>One target required</td><td>Microsoft Graph page ID. Use this instead of <code>pageTitle</code> to identify a page exactly or target another section.</td></tr>
          <tr><td><code>content</code></td><td>Yes</td><td>Non-empty plain text, up to 100,000 characters. New lines become line breaks.</td></tr>
          <tr><td><code>url</code></td><td>No</td><td>Appended as a source link only when it begins with <code>http://</code> or <code>https://</code>.</td></tr>
        </tbody></table></div>
        <h3>Example append request</h3>
        <pre><code>{APPEND_CURL}</code></pre>
        <h3>Example append response</h3>
        <pre><code>{`{
  "ok": true,
  "page": {
    "id": "…",
    "title": "Quick Inbox",
    "webUrl": "https://…"
  }
}`}</code></pre>
        <p>Error responses use <code>{'{ "error": "Explanation" }'}</code>. A <code>400</code> means the JSON or fields are invalid; <code>401</code> means the API key is missing/incorrect; <code>404</code> means the requested page title was not found; <code>409</code> means a default section is missing or a title is ambiguous; <code>500</code> means the database or Microsoft request failed.</p>
      </section>

      <section id="security">
        <h3 id="todo-api">Microsoft To Do</h3>
        <p>Available when the connection has approved <code>Tasks.ReadWrite</code>. All four use the same <code>ons_</code> API key as the OneNote endpoints.</p>
        <div className="table-wrap"><table><thead><tr><th>Request</th><th>Does</th></tr></thead><tbody>
          <tr><td><code>GET /api/todo/lists</code></td><td>Your To Do lists, default first</td></tr>
          <tr><td><code>GET /api/todo</code></td><td>Open tasks. <code>?list=</code>, <code>?all=true</code>, <code>?top=</code></td></tr>
          <tr><td><code>POST /api/todo</code></td><td>Create a task from <code>title</code>, and optional <code>note</code>, <code>list</code>, <code>dueDate</code>, <code>reminder</code>, <code>timeZone</code></td></tr>
          <tr><td><code>POST /api/todo/complete</code></td><td>Mark a task done by <code>id</code></td></tr>
        </tbody></table></div>
        <p>Send <code>timeZone</code> as an IANA name such as <code>America/Chicago</code>. A bare <code>dueDate</code> of <code>2026-09-15</code> is anchored to midnight in that zone, so the task stays on the day you meant rather than shifting for anyone west of UTC.</p>

        <h2>Security and data storage</h2>
        <div className="table-wrap"><table><thead><tr><th>Information</th><th>Where it is stored</th><th>Protection</th></tr></thead><tbody>
          <tr><td>Setup step number</td><td>Your browser&apos;s <code>localStorage</code></td><td>Not sensitive; used only to reopen the last viewed step</td></tr>
          <tr><td>Light/dark preference</td><td>Your browser&apos;s <code>localStorage</code></td><td>Not sensitive; used to restore the selected theme before the page appears</td></tr>
          <tr><td>Login session</td><td>HttpOnly cookie</td><td>Signed; JavaScript cannot read it; Secure in production</td></tr>
          <tr><td>Microsoft client secret</td><td>Your database</td><td>AES-256-GCM encrypted using <code>APP_ENCRYPTION_KEY</code></td></tr>
          <tr><td>Microsoft access/refresh tokens</td><td>Your database</td><td>AES-256-GCM encrypted</td></tr>
          <tr><td>Discord bot token</td><td>Your database</td><td>AES-256-GCM encrypted; never returned to the browser after saving</td></tr>
          <tr><td>Discord public key and application IDs</td><td>Your database</td><td>Not secrets; used to verify and route signed interactions</td></tr>
          <tr><td>Shortcut API keys</td><td>Your database</td><td>One-way SHA-256 hash; original shown once</td></tr>
          <tr><td>Captured note text</td><td>Sent to Microsoft during the request</td><td>Not intentionally retained by the OneNote System database</td></tr>
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
        <h2>Discord integration</h2>
        <p>Setup Step 6 connects a Discord application to the same Microsoft account and default OneNote section used by this installation. It registers one <code>/onenote</code> command with two actions:</p>
        <ul>
          <li><code>/onenote create</code> creates a page from a title, optional text, and optional source URL.</li>
          <li><code>/onenote append</code> adds text and an optional source URL to an exact page title in the default section.</li>
        </ul>
        <h3>Discord application setup</h3>
        <ol className="steps compact-steps">
          <li><h3>Create the application</h3><p>Open the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord Developer Portal ↗</a>, create an application, and copy the Application ID and Public Key from General Information.</p></li>
          <li><h3>Create the bot token</h3><p>Open Bot, reset the token, and save it in Setup Step 6. OneNote System encrypts it. The token is used only when registering or removing the slash command; interaction responses use Discord&apos;s signed webhook flow.</p></li>
          <li><h3>Save the interaction endpoint</h3><p>Save the Discord fields in OneNote System first. Copy the exact URL ending in <code>/api/discord/interactions</code> into General Information → Interactions Endpoint URL. Discord sends a signed PING and the endpoint returns PONG during validation.</p></li>
          <li><h3>List who may use the command</h3><p>Enter your own Discord user ID in <strong>Allowed Discord user IDs</strong>, and anyone else you trust, separated by commas. The command writes into <em>your</em> OneNote, so seeing it in a server is not permission to use it — only the accounts listed here can run it. Leaving the field blank allows nobody. To find your ID, turn on Developer Mode in Discord&apos;s Advanced settings, right-click your name, and choose <strong>Copy User ID</strong>.</p></li>
          <li><h3>Install and register the command</h3><p>Use the installation link to authorize the <code>applications.commands</code> scope. Then choose <strong>Save and register /onenote</strong>. A test server ID creates a guild command that updates immediately; leaving it blank creates a global command.</p></li>
          <li><h3>Test both actions</h3><p>Run <code>/onenote create</code>, then run <code>/onenote append</code> with that page&apos;s exact title. Discord shows a private result and links to the OneNote page when Microsoft supplies a web URL.</p></li>
        </ol>
        <p>The endpoint validates the raw request body with Discord&apos;s Ed25519 signature headers, acknowledges commands within Discord&apos;s three-second window, completes Microsoft Graph work in the background, and edits the private response afterward. See Discord&apos;s official <a href="https://docs.discord.com/developers/interactions/overview" target="_blank" rel="noreferrer">interaction security guide ↗</a> and <a href="https://docs.discord.com/developers/interactions/application-commands" target="_blank" rel="noreferrer">application command reference ↗</a>.</p>
        <div className="callout warning"><p>Every Discord account on your allowed list can write to your selected OneNote section. Keep that list as short as you actually need, and remove people when they no longer need access. If the bot token leaks, reset it in Discord and save the replacement in Setup Step 6.</p></div>
      </section>

      <section id="troubleshooting">
        <h2>Troubleshooting</h2>
        <div className="troubleshooting">
          <details><summary>Setup says DATABASE_URL is not configured</summary><p>The Neon integration was not connected to this Vercel project, or the app was not redeployed after it was connected. Check <strong>Vercel → Project → Settings → Environment Variables</strong> for <code>DATABASE_URL</code>, then redeploy.</p></details>
          <details><summary>Microsoft says the redirect URI does not match</summary><p>Compare the URI in Entra with <code>APP_URL</code> plus <code>/api/auth/microsoft/callback</code>. They must match exactly, including <code>https</code>, subdomain, path, and absence of a trailing slash.</p></details>
          <details><summary>To Do commands say access has not been approved</summary><p>The connection was approved before <code>Tasks.ReadWrite</code> was added. Add that delegated permission in your Microsoft app registration, then reconnect Microsoft in setup. OneNote keeps working the whole time.</p></details>
          <details><summary>Microsoft sign-in works but notebooks do not load</summary><p>Confirm that the app registration has delegated <code>Notes.ReadWrite</code> permission and that you approved it. Reconnect the Microsoft account after changing permissions.</p></details>
          <details><summary>APP_ENCRYPTION_KEY is not configured</summary><p>Add a strong random value in Vercel Environment Variables and redeploy. Do not change an existing key after credentials are stored; old encrypted values cannot be decrypted with a new key.</p></details>
          <details><summary>The Shortcut receives Unauthorized</summary><p>Confirm the header is exactly <code>Authorization: Bearer ons_…</code>. There must be one space after <code>Bearer</code>. The key must come from the same deployment receiving the request.</p></details>
          <details><summary>The Shortcut says no default section is selected</summary><p>Open Setup Step 4 on the same deployment and choose a notebook and section while signed in with Microsoft.</p></details>
          <details><summary>A secret expired</summary><p>Create a new Microsoft client secret Value in Entra, save it through Setup Step 2, then reconnect Microsoft. Microsoft recommends rotating credentials and client secrets have limited lifetimes.</p></details>
          <details><summary>Discord rejects the Interactions Endpoint URL</summary><p>Save the Application ID and Public Key in Setup Step 6 before pasting the endpoint into Discord. Confirm the URL uses HTTPS and ends exactly in <code>/api/discord/interactions</code>. A wrong public key causes the required signature check to return <code>401</code>.</p></details>
          <details><summary>The /onenote command does not appear</summary><p>Use a test server ID for immediate testing, confirm the application was installed with the <code>applications.commands</code> scope, and choose <strong>Save and register /onenote</strong> again. Global command changes can take longer to propagate through Discord.</p></details>
          <details><summary>Where can I report a reproducible bug?</summary><p>Remove every secret and personal note from screenshots/logs, then open a <a href="https://github.com/DudeThatsErin/onenote-system/issues" target="_blank" rel="noreferrer">GitHub issue ↗</a> with the deployment type, route, status code, and exact non-secret error.</p></details>
        </div>
      </section>
    </article>

    <SiteFooter />
  </main>;
}
