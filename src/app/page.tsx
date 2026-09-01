import Link from 'next/link';
import SiteFooter from '@/components/SiteFooter';
import SiteHeader from '@/components/SiteHeader';

const FLOW = `Your iPhone, iPad, Mac, or app
             │
             │  sends title + text + optional source URL
             ▼
Your private OneNote Queue API
             │
             │  uses your encrypted Microsoft connection
             ▼
The OneNote section you chose`;

export default function Home() {
  return <main>
    <SiteHeader />

    <section className="hero">
      <p className="eyebrow">Your deployment · your database · your Microsoft account</p>
      <h1>Send anything to your OneNote inbox.</h1>
      <p className="lead">OneNote Queue gives Shortcuts, Discord, and other apps one private address for creating pages in the OneNote section you choose. You host it yourself, so there is no shared OneNote Queue account and no stranger&apos;s database holding your credentials.</p>
      <div className="actions">
        <Link className="button" href="/setup">Start the guided setup →</Link>
        <a className="button secondary" href="#how-it-works">See how it works</a>
      </div>
      <p className="fine-print">Free and open source · Designed for Vercel or your own server · No subscription to OneNote Queue</p>
    </section>

    <section className="block" id="how-it-works">
      <p className="eyebrow">The simple version</p>
      <h2>How it works</h2>
      <p className="lede">Microsoft already provides the secure OneNote API. OneNote Queue connects your own tools to that API without putting a Microsoft password inside a Shortcut.</p>
      <pre className="flow"><code>{FLOW}</code></pre>
      <div className="grid three">
        <article><span className="card-number">1</span><h3>You deploy your copy</h3><p>Vercel runs the website and API. Neon gives it a small private database. Self-hosters can use Docker and PostgreSQL instead.</p></article>
        <article><span className="card-number">2</span><h3>You connect Microsoft</h3><p>You create a Microsoft app, approve access to your account, and choose the notebook section that should receive captures.</p></article>
        <article><span className="card-number">3</span><h3>You capture</h3><p>A Shortcut sends text to your private endpoint. OneNote Queue immediately creates a real page in your selected OneNote section.</p></article>
      </div>
    </section>

    <section className="block">
      <p className="eyebrow">Use it from anywhere</p>
      <h2>What you can send</h2>
      <p className="lede">Use a small, reliable note format: title, plain text, and an optional source link. Create a new page or append to one that already exists.</p>
      <div className="grid three">
        <article><h3>Share Sheet captures</h3><p>Send selected text, a link, or content from another app through the iPhone, iPad, or Mac Share Sheet.</p></article>
        <article><h3>Quick inbox notes</h3><p>Run a Shortcut, type a thought, and drop it into the same OneNote inbox without opening OneNote first.</p></article>
        <article><h3>Other automations</h3><p>Use the documented HTTPS endpoint from automation tools, scripts, webhooks, or an optional future Discord adapter.</p></article>
      </div>
      <p><Link className="text-link" href="/shortcuts">See the Shortcut choices and exact setup instructions →</Link></p>
    </section>

    <section className="block">
      <p className="eyebrow">No coding experience required</p>
      <h2>What setup actually involves</h2>
      <p className="lede">You will create three free accounts or resources that each do one specific job. The wizard explains every screen and every value.</p>
      <ol className="steps">
        <li><h3>Put your own copy on Vercel</h3><p>Vercel is the computer on the internet that keeps your OneNote Queue URL available even when your phone and home computer are asleep.</p></li>
        <li><h3>Add a Neon database</h3><p>Neon stores encrypted connection details and your selected OneNote section. It does not store copies of your OneNote pages.</p></li>
        <li><h3>Register a Microsoft app</h3><p>This gives Microsoft a named, revocable connection between your deployment and your account. You stay in control of its permissions.</p></li>
        <li><h3>Connect OneNote and choose a section</h3><p>Sign in on Microsoft&apos;s own page, then select where new captures should land.</p></li>
        <li><h3>Create an API key and install a Shortcut</h3><p>The API key works like a password for the Shortcut. Store it only in the Shortcut and your password manager.</p></li>
      </ol>
      <p><Link className="button" href="/setup">Walk me through it</Link></p>
    </section>

    <section className="block split">
      <div>
        <p className="eyebrow">Choose your hosting</p>
        <h2>Vercel is easiest. Self-hosting gives you full control.</h2>
      </div>
      <div className="grid two">
        <article><h3>Vercel + Neon <span className="pill">Recommended</span></h3><p>There is no server for you to maintain. Connect the GitHub repository, add Neon, add two private settings, and deploy.</p><p><Link href="/docs#vercel">Beginner Vercel instructions →</Link></p></article>
        <article><h3>Your own server</h3><p>Run the same open-source app with Docker and PostgreSQL. You are responsible for HTTPS, updates, backups, and uptime.</p><p><Link href="/docs#self-hosting">Self-hosting instructions →</Link></p></article>
      </div>
    </section>

    <section className="block">
      <p className="eyebrow">Privacy by ownership</p>
      <h2>Where your information goes</h2>
      <div className="grid two">
        <article><h3>Your browser</h3><p>The setup page remembers only which numbered step you last viewed. It does not place Microsoft tokens, client secrets, API keys, or note text in browser storage.</p></article>
        <article><h3>Your database</h3><p>Microsoft access tokens and the Microsoft client secret are encrypted. API keys are stored as one-way hashes, so the original key cannot be read back.</p></article>
        <article><h3>Microsoft</h3><p>Your note content is sent through Microsoft Graph to create a page in your account. Microsoft and OneNote remain the source of truth.</p></article>
        <article><h3>This public website</h3><p>The project author does not receive your credentials or note contents when you deploy your own copy. Your installation talks to services in your accounts.</p></article>
      </div>
      <p><Link href="/docs#security">Read the full security model →</Link></p>
    </section>

    <section className="block">
      <p className="eyebrow">Common questions</p>
      <h2>Before you start</h2>
      <div className="grid two">
        <article><h3>Do I need to leave a computer running?</h3><p>No when you use Vercel. Yes when you self-host on a computer in your home.</p></article>
        <article><h3>Do I give this site my Microsoft password?</h3><p>No. You sign in on Microsoft&apos;s page. OneNote Queue receives revocable access tokens, never your password.</p></article>
        <article><h3>Does it modify existing pages?</h3><p>Yes. The capture endpoint creates new pages, and the append endpoint adds plain text and an optional source link to an existing page.</p></article>
        <article><h3>Is Discord ready?</h3><p>The core database, Microsoft connection, section picker, API keys, and capture endpoint are available. The Discord interaction adapter is still under development.</p></article>
      </div>
    </section>

    <section className="closing">
      <h2>Ready to build your private OneNote inbox?</h2>
      <p>The setup wizard keeps your place and explains why each service is needed.</p>
      <Link className="button" href="/setup">Start setup →</Link>
    </section>

    <SiteFooter />
  </main>;
}
