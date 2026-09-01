import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

const REQUEST = `POST https://YOUR-ONENOTE-QUEUE-DOMAIN/api/capture
Authorization: Bearer oq_YOUR_PRIVATE_KEY
Content-Type: application/json

{
  "title": "Page title",
  "content": "The text to save",
  "url": "https://optional-source.example"
}`;

export default function ShortcutsPage() {
  return <main>
    <SiteHeader />
    <section className="doc-hero">
      <p className="eyebrow">Apple Shortcuts</p>
      <h1>Capture to OneNote from iPhone, iPad, or Mac</h1>
      <p className="lead">A Shortcut is the small automation that collects text on your device and sends it to your private OneNote Queue address. Your API key stays inside the Shortcut; your Microsoft password does not.</p>
    </section>

    <nav className="toc" aria-label="On this page">
      <a href="#downloads">Shortcut choices</a>
      <a href="#before">Before installing</a>
      <a href="#configure">Configure a Shortcut</a>
      <a href="#build">Build one manually</a>
      <a href="#troubleshooting">Troubleshooting</a>
    </nav>

    <article className="documentation">
      <section id="downloads">
        <h2>Choose the Shortcut you want</h2>
        <p>These are the four Shortcut links planned for the project. The iCloud download URLs have not been supplied yet, so this page does not pretend that unavailable downloads work. The manual instructions below let you build the Quick Inbox version now.</p>
        <div className="grid two shortcut-grid">
          <article><p className="availability">iCloud link needed</p><h3>Capture to OneNote</h3><p>Ask for a page title and note text, then create a new page in your default section.</p><span className="button disabled" aria-disabled="true">Download not published</span></article>
          <article><p className="availability">iCloud link needed</p><h3>Share Sheet to OneNote</h3><p>Receive text or a URL from another app&apos;s Share button and create a sourced OneNote page.</p><span className="button disabled" aria-disabled="true">Download not published</span></article>
          <article><p className="availability">iCloud link needed</p><h3>Quick Inbox</h3><p>Type a fast thought from the Home Screen, Action Button, widget, menu bar, or Siri.</p><span className="button disabled" aria-disabled="true">Download not published</span></article>
          <article><p className="availability planned">Planned API feature</p><h3>Append to OneNote</h3><p>Add text to an existing page. The current API creates pages only, so this Shortcut will be published after append support exists.</p><span className="button disabled" aria-disabled="true">Not available yet</span></article>
        </div>
        <div className="callout"><p><strong>Links still needed from Erin:</strong> Capture to OneNote, Share Sheet to OneNote, and Quick Inbox. Append should wait until the backend can append safely.</p></div>
      </section>

      <section id="before">
        <h2>Before you install or build a Shortcut</h2>
        <ol className="steps compact-steps">
          <li><h3>Finish Steps 1–4 of setup</h3><p>Your database must be connected, Microsoft must be connected, and a default OneNote section must be selected.</p></li>
          <li><h3>Create your Shortcut API key in Step 5</h3><p>The key begins with <code>oq_</code> and is displayed only once. Save it in your password manager before leaving the page.</p></li>
          <li><h3>Know your deployment address</h3><p>This is the public address of <em>your copy</em> of OneNote Queue, such as <code>https://my-onenote-queue.vercel.app</code>. It is not <code>onenotequeue.erinskidds.com</code> unless that is the installation you control.</p></li>
          <li><h3>Open Apple&apos;s Shortcuts app</h3><p>Shortcuts is included on current iPhone, iPad, and Mac systems. Apple&apos;s <a href="https://support.apple.com/guide/shortcuts/welcome/ios" target="_blank" rel="noreferrer">Shortcuts User Guide ↗</a> explains the editor and running shortcuts.</p></li>
        </ol>
      </section>

      <section id="configure">
        <h2>How to configure a downloaded Shortcut</h2>
        <p>When the iCloud links are published, opening one will show Apple&apos;s preview before anything is added. Review its actions, choose <strong>Add Shortcut</strong>, then answer its setup questions:</p>
        <div className="table-wrap"><table><thead><tr><th>Question</th><th>What to enter</th><th>Example</th></tr></thead><tbody>
          <tr><td>OneNote Queue URL</td><td>Your deployment address, with <strong>no slash at the end</strong></td><td><code>https://my-queue.vercel.app</code></td></tr>
          <tr><td>API key</td><td>The complete key created in Setup Step 5</td><td><code>oq_…</code></td></tr>
          <tr><td>Default page title</td><td>Optional title to use when the Shortcut does not ask</td><td><code>Quick Inbox</code></td></tr>
        </tbody></table></div>
        <div className="callout warning"><p><strong>Treat the API key like a password.</strong> Do not put it in the URL, a screenshot, a shared Shortcut, GitHub, or a support message. If you share your customized Shortcut, remove the key first.</p></div>
      </section>

      <section id="build">
        <h2>Build the Quick Inbox Shortcut manually</h2>
        <p>You can use this today while the downloadable iCloud links are being prepared. Apple occasionally changes labels in the Shortcuts editor, but the actions and values remain the same.</p>
        <ol className="steps compact-steps">
          <li><h3>Create a blank Shortcut</h3><p>Open <strong>Shortcuts</strong>, press <strong>+</strong>, choose <strong>New Shortcut</strong>, and name it <code>Quick Inbox to OneNote</code>.</p></li>
          <li><h3>Ask for the page title</h3><p>Add <strong>Ask for Input</strong>. Set the prompt to <code>OneNote page title</code> and leave the input type as Text. Rename its result variable to <code>Page Title</code> if you want the later actions to be easier to read.</p></li>
          <li><h3>Ask for the note</h3><p>Add a second <strong>Ask for Input</strong>. Set its prompt to <code>What do you want to save?</code>. Its output is the note text.</p></li>
          <li><h3>Add your API address</h3><p>Add the <strong>URL</strong> action. Enter your deployment address followed by <code>/api/capture</code>. For example: <code>https://my-queue.vercel.app/api/capture</code>.</p></li>
          <li><h3>Send the request</h3><p>Add <strong>Get Contents of URL</strong>. Expand its options and set <strong>Method</strong> to <strong>POST</strong>. Under Headers add <code>Authorization</code> with the value <code>Bearer YOUR_API_KEY</code>. Keep the space after <code>Bearer</code>.</p></li>
          <li><h3>Add the JSON fields</h3><p>Set <strong>Request Body</strong> to <strong>JSON</strong>. Add a Text field named <code>title</code> and insert the first Ask for Input variable. Add a Text field named <code>content</code> and insert the second Ask for Input variable. The field names must be lowercase exactly as shown.</p></li>
          <li><h3>Show the result and test</h3><p>Add <strong>Show Result</strong> using the result of Get Contents of URL. Run the Shortcut. A successful request returns <code>&quot;ok&quot;: true</code>, and the new page should appear in the OneNote section chosen during setup.</p></li>
        </ol>
        <p>Apple also provides an official guide to <a href="https://support.apple.com/guide/shortcuts/use-web-apis-apd2d448b2de/ios" target="_blank" rel="noreferrer">using web APIs in Shortcuts ↗</a>.</p>

        <h3>What the Shortcut sends</h3>
        <pre><code>{REQUEST}</code></pre>
        <p>The <code>title</code> field is optional and defaults to “Untitled capture.” The <code>content</code> field accepts plain text. The optional <code>url</code> field must start with <code>http://</code> or <code>https://</code>.</p>
      </section>

      <section id="troubleshooting">
        <h2>Shortcut troubleshooting</h2>
        <div className="grid two">
          <article><h3>“Unauthorized” or status 401</h3><p>Check that the header is named <code>Authorization</code>, its value starts with <code>Bearer </code>, and the entire <code>oq_</code> key follows it. Create a new key if the original was lost.</p></article>
          <article><h3>“No default OneNote section” or status 409</h3><p>Return to Setup Step 4, load your notebooks, and select the section where new pages should go.</p></article>
          <article><h3>The request cannot connect</h3><p>Open your deployment URL in Safari. If the site does not load, fix the Vercel deployment or self-hosted server before changing the Shortcut.</p></article>
          <article><h3>The page contains the wrong text</h3><p>Open the JSON body and make sure <code>title</code> uses the first input and <code>content</code> uses the second. Shortcut variables can be reassigned accidentally while editing.</p></article>
        </div>
        <p>For server and Microsoft errors, continue with the <Link href="/docs#troubleshooting">full troubleshooting guide →</Link></p>
      </section>
    </article>

    <SiteFooter />
  </main>;
}
