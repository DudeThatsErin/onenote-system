import type { Metadata } from 'next';
import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Terminal',
  description:
    'Install the onenotesystem command from npm and create or update OneNote pages from any shell, including Linux and work machines where OneNote cannot be installed.',
};

const INSTALL = `npm install -g onenotesystem`;

const HELP = `onenotesystem --help              # commands, configuration, exit codes
onenotesystem capture --help      # every flag capture accepts, with examples
onenotesystem help append         # the same, spelled the other way`;

const CONFIGURE = `$ onenotesystem configure
OneNote System deployment URL: https://my-onenote-system.vercel.app
API key (input hidden):
Checking the deployment...
Reached onenote-system.
Saved configuration to /home/you/.config/onenotesystem/config.json`;

const DOCTOR = `$ onenotesystem doctor
Deployment URL: https://my-onenote-system.vercel.app  (from config file)
API key:        set (from config file)
Default page:   Quick Inbox  (from config file)
Service:        onenote-system
Database:       reachable
Key:            accepted`;

const CAPTURE = `# A page with just a title
onenotesystem capture "Standup notes"

# A page with a body
onenotesystem capture "Standup notes" --content "Shipped the CLI"

# A page from a file, with a source link
onenotesystem capture "Article" --file notes.md --url https://example.com/article

# A page from whatever another command printed
git log -1 --stat | onenotesystem capture "Today's commit" --stdin`;

const APPEND = `# Add to a page by its exact title
onenotesystem append "Ask about the Q3 budget" --page-title "Quick Inbox"

# Add to a page by ID, from any section
onenotesystem append "Deploy finished" --page-id "1-abc123!..."

# Add whatever another command printed
dmesg | tail -20 | onenotesystem append --stdin --page-title "Server log"

# Set a default page once, then leave the flag off
onenotesystem configure --default-page "Quick Inbox"
onenotesystem append "A thought"`;

const SCRIPTING = `#!/usr/bin/env bash
# Log a failed nightly build to OneNote without opening a browser.
if ! make nightly > build.log 2>&1; then
  onenotesystem capture "Nightly build failed $(date -I)" --file build.log
fi`;

const BRANCHING = `if ! onenotesystem append "$LINE" --page-title "Log"; then
  case $? in
    2) echo "Key expired; run onenotesystem configure" ;;
    4) echo "Offline; queueing locally" ;;
  esac
fi`;

export default function TerminalPage() {
  return <main>
    <SiteHeader />

    <section className="doc-hero">
      <p className="eyebrow">Command line</p>
      <h1>Use OneNote from a terminal</h1>
      <p className="lead">
        <code>onenotesystem</code> is the official command-line client. It sends the same two requests the Apple
        Shortcuts send, to the same deployment, so a page created from a Linux server and a page created from your
        iPhone are identical. It is built for the machines OneNote will not run on.
      </p>
    </section>

    <nav className="toc" aria-label="On this page">
      <a href="#why">Why use it</a>
      <a href="#install">Install</a>
      <a href="#configure">Configure</a>
      <a href="#capture">Create a page</a>
      <a href="#append">Append to a page</a>
      <a href="#scripting">Scripting</a>
      <a href="#security">Security</a>
      <a href="#troubleshooting">Troubleshooting</a>
    </nav>

    <article className="documentation">
      <section id="why">
        <h2>Why a terminal client</h2>
        <p>Microsoft does not ship OneNote for Linux, and many workplaces will not let you install it at all. The web app covers reading, but it is a poor fit for the thing people actually want from a shell: capturing what just happened without leaving the shell.</p>
        <div className="grid two">
          <article><h3>Linux desktops</h3><p>The one supported way to put a page in your own OneNote notebook from Ubuntu, Fedora, Arch, or anything else, without a browser.</p></article>
          <article><h3>Servers over SSH</h3><p>Pipe a log, a diff, or a failing test into a OneNote page from a machine that has no graphical session at all.</p></article>
          <article><h3>Locked-down work machines</h3><p>If you can install a Node package, you can capture notes. There is nothing to install with administrator rights and no browser extension.</p></article>
          <article><h3>Scripts and cron</h3><p>Stable exit codes and <code>--json</code> output make it safe to call from automation that has to react when something fails.</p></article>
        </div>
      </section>

      <section id="install">
        <h2>Install</h2>
        <p>The client is published to npm as <a href="https://www.npmjs.com/package/onenotesystem" target="_blank" rel="noreferrer">onenotesystem ↗</a>, and its source is at <a href="https://github.com/DudeThatsErin/onenote-terminal" target="_blank" rel="noreferrer">onenote-terminal ↗</a>. It needs Node.js 18.17 or newer and has no other dependencies.</p>
        <pre><code>{INSTALL}</code></pre>
        <p>That installs two commands: <code>onenotesystem</code> and the shorter alias <code>ons</code>. To try it without installing anything, run <code>npx onenotesystem --help</code>.</p>

        <h3>Getting help</h3>
        <p>Every command documents itself, so you should rarely need this page once it is installed. <code>--help</code> and <code>-h</code> work at the top level and on each command, and <code>help &lt;command&gt;</code> does the same thing.</p>
        <pre><code>{HELP}</code></pre>
        <p>Aliases resolve too, so <code>onenotesystem new -h</code> shows the <code>capture</code> help.</p>
        <div className="callout"><p>The client is not a OneNote account. It talks to <em>your</em> OneNote System deployment, which holds your Microsoft connection. If you have not deployed one yet, <Link href="/setup">start with the guided setup</Link>.</p></div>
      </section>

      <section id="configure">
        <h2>Configure</h2>
        <p>You need your deployment address and an API key from Setup Step 5 — the same key a Shortcut would use. One key can be shared by both, though a separate key per device is easier to revoke.</p>
        <pre><code>{CONFIGURE}</code></pre>
        <p>The key is saved to a file only your user account can read: <code>~/.config/onenotesystem/config.json</code> on Linux and macOS, or <code>%APPDATA%\onenotesystem\config.json</code> on Windows. It is never printed back to the terminal.</p>

        <h3>Configuring without prompts</h3>
        <p>Pass the values as flags when you are setting up a server or a container:</p>
        <pre><code>onenotesystem configure --url https://my-onenote-system.vercel.app --api-key &quot;$KEY&quot; --default-page &quot;Quick Inbox&quot;</code></pre>
        <p>Or skip the file entirely. Environment variables take precedence over it, which is what you want in CI:</p>
        <div className="table-wrap"><table><thead><tr><th>Variable</th><th>Purpose</th></tr></thead><tbody>
          <tr><td><code>ONENOTE_URL</code></td><td>Your deployment address, with no slash at the end</td></tr>
          <tr><td><code>ONENOTE_API_KEY</code></td><td>An API key from Setup Step 5</td></tr>
          <tr><td><code>ONENOTE_DEFAULT_PAGE</code></td><td>Page title <code>append</code> uses when you do not name one</td></tr>
          <tr><td><code>ONENOTE_TIMEOUT_MS</code></td><td>Request timeout, default <code>15000</code></td></tr>
          <tr><td><code>ONENOTE_CONFIG_DIR</code></td><td>Override where the config file lives</td></tr>
        </tbody></table></div>

        <h3>Check that it works</h3>
        <p><code>doctor</code> tests the deployment, its database, and your API key separately, so a failure tells you which one is wrong.</p>
        <pre><code>{DOCTOR}</code></pre>
      </section>

      <section id="capture">
        <h2>Create a page</h2>
        <p><code>capture</code> creates a new page in the OneNote section you chose during setup. It calls <code>POST /api/capture</code> — the same endpoint as the Capture to OneNote Shortcut.</p>
        <pre><code>{CAPTURE}</code></pre>
        <div className="table-wrap"><table><thead><tr><th>Flag</th><th>Meaning</th></tr></thead><tbody>
          <tr><td><code>--title &lt;text&gt;</code></td><td>Title, if you would rather not use positional words</td></tr>
          <tr><td><code>--content &lt;text&gt;</code></td><td>Page body</td></tr>
          <tr><td><code>--file &lt;path&gt;</code></td><td>Read the body from a file</td></tr>
          <tr><td><code>--stdin</code></td><td>Read the body from piped input</td></tr>
          <tr><td><code>--url &lt;link&gt;</code></td><td>Record a source link under the body</td></tr>
          <tr><td><code>--json</code></td><td>Print the deployment&apos;s JSON response instead of a summary</td></tr>
        </tbody></table></div>
        <p>Pages carry a title, plain text, and an optional source link — the same small, reliable format the Shortcuts use. Line breaks are preserved. Markdown is not rendered; it arrives as literal text. Content is limited to 100,000 characters and titles to 200, both checked before anything is uploaded.</p>
      </section>

      <section id="append">
        <h2>Append to a page</h2>
        <p><code>append</code> adds text to a page that already exists — a running inbox, a daily log, a project page. It calls <code>POST /api/append</code>.</p>
        <pre><code>{APPEND}</code></pre>
        <p><code>--page-title</code> must match a page title exactly, and that page must be in your configured default section. If two pages share the title the command stops and asks for <code>--page-id</code>, because quietly appending to the wrong one would be worse than failing. A page ID can reach any section the connected Microsoft account can see.</p>
      </section>

      <section id="scripting">
        <h2>Scripting</h2>
        <p>Progress messages go to stderr and <code>--json</code> goes to stdout alone, so <code>onenotesystem capture … --json | jq</code> always works.</p>
        <pre><code>{SCRIPTING}</code></pre>
        <p>Every command returns a stable exit code, so a script can tell an expired key apart from a dropped connection:</p>
        <div className="table-wrap"><table><thead><tr><th>Code</th><th>Meaning</th></tr></thead><tbody>
          <tr><td><code>0</code></td><td>Success</td></tr>
          <tr><td><code>1</code></td><td>Usage error — bad flags, missing input, failed local validation</td></tr>
          <tr><td><code>2</code></td><td>Unauthorized — the deployment rejected the API key</td></tr>
          <tr><td><code>3</code></td><td>Not found — no page matched the title or ID</td></tr>
          <tr><td><code>4</code></td><td>Network — DNS, TLS, timeout, or connection refused</td></tr>
          <tr><td><code>5</code></td><td>A deployment error the client cannot classify further</td></tr>
          <tr><td><code>6</code></td><td>Not configured — no deployment URL or API key</td></tr>
          <tr><td><code>7</code></td><td>Conflict — no default section, or more than one page has that title</td></tr>
        </tbody></table></div>
        <pre><code>{BRANCHING}</code></pre>
      </section>

      <section id="security">
        <h2>Security</h2>
        <p>Your API key is sent only to the deployment address you configured, as an <code>Authorization: Bearer</code> header. It is never printed, logged, or included in an error message — including the unauthorized one. The config file is written with owner-only permissions.</p>
        <p>Deployment addresses must use HTTPS. Plain <code>http://</code> is accepted only for <code>localhost</code> and <code>127.0.0.1</code>, so a typo cannot quietly send your key over an unencrypted connection.</p>
        <p>Your note content passes through your own deployment to Microsoft Graph and nowhere else. The client has no telemetry and no runtime dependencies.</p>
        <div className="callout warning"><p><strong>On a shared machine, prefer an environment variable to the config file,</strong> and create a key you can revoke for that machine alone. Anyone who can read the file can write to your OneNote section.</p></div>
      </section>

      <section id="troubleshooting">
        <h2>Terminal troubleshooting</h2>
        <div className="grid two">
          <article><h3>Exit code 6, &ldquo;not configured&rdquo;</h3><p>No deployment URL or API key was found. Run <code>onenotesystem configure</code>, or set <code>ONENOTE_URL</code> and <code>ONENOTE_API_KEY</code>.</p></article>
          <article><h3>Exit code 2, &ldquo;unauthorized&rdquo;</h3><p>The key was rejected. Keys are shown only once at creation; if the original was lost, create a new one in Setup Step 5 and run <code>configure</code> again.</p></article>
          <article><h3>Exit code 7, &ldquo;no default OneNote section&rdquo;</h3><p>Return to Setup Step 4, load your notebooks, and choose the section that should receive new pages.</p></article>
          <article><h3>Exit code 3, &ldquo;no page titled …&rdquo;</h3><p>Titles must match exactly, including capitalisation, and the page must be in your default section. Use <code>--page-id</code> to reach a page in another section.</p></article>
          <article><h3>Exit code 4, &ldquo;could not reach&rdquo;</h3><p>Run <code>onenotesystem doctor</code>. If it also fails, open your deployment address in a browser before changing anything about the client.</p></article>
          <article><h3><code>command not found</code> after install</h3><p>npm&apos;s global bin directory is not on your <code>PATH</code>. Run <code>npm config get prefix</code> and add that directory&apos;s <code>bin</code> to your shell profile.</p></article>
        </div>
        <p>For deployment and Microsoft errors, continue with the <Link href="/docs#troubleshooting">full troubleshooting guide →</Link></p>
      </section>
    </article>

    <SiteFooter />
  </main>;
}
