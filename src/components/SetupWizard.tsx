'use client';

import { useEffect, useState } from 'react';
import DiscordSetup from '@/components/DiscordSetup';

const STEPS = ['Database', 'Microsoft app', 'Connect account', 'Default section', 'API key', 'Discord'];
type NamedItem = { id: string; displayName: string };

export default function SetupWizard({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('Checking setup…');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [notebooks, setNotebooks] = useState<NamedItem[]>([]);
  const [sections, setSections] = useState<NamedItem[]>([]);
  const [notebook, setNotebook] = useState('');

  useEffect(() => {
    const saved = Number(localStorage.getItem('onenote-system-setup-step') || 0);
    const timer = window.setTimeout(() => setStep(Number.isFinite(saved) && saved >= 0 && saved < STEPS.length ? saved : 0), 0);
    fetch('/api/setup').then((response) => response.json()).then((data) => setStatus(data.databaseReady === false ? data.error : data.configured ? (data.signedIn ? 'Microsoft account connected.' : 'Microsoft app saved. Connect your account next.') : 'Database connected. Add your Microsoft app.')).catch(() => setStatus('Could not contact the setup API.'));
    return () => window.clearTimeout(timer);
  }, []);

  const advance = (value: number) => { setStep(value); localStorage.setItem('onenote-system-setup-step', String(value)); };
  const saveMicrosoft = async () => { setError(''); const response = await fetch('/api/setup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId, clientSecret }) }); const data = await response.json(); if (!response.ok) return setError(data.error); setStatus('Microsoft app saved securely.'); advance(2); };
  const createKey = async () => { setError(''); const response = await fetch('/api/keys', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: 'My first Shortcut' }) }); const data = await response.json(); if (!response.ok) return setError(data.error); setKey(data.key); setStatus('API key created. Save it now; it cannot be shown again.'); };
  const copyKey = async () => { await navigator.clipboard.writeText(key); setStatus('API key copied. Save it in your password manager before continuing.'); };
  const loadNotebooks = async () => { setError(''); const response = await fetch('/api/onenote/notebooks'); const data = await response.json(); if (!response.ok) return setError(data.error); setNotebooks(data.value || []); };
  const chooseNotebook = async (id: string) => { setNotebook(id); setSections([]); const response = await fetch(`/api/onenote/sections?notebook=${encodeURIComponent(id)}`); const data = await response.json(); if (!response.ok) return setError(data.error); setSections(data.value || []); };
  const chooseSection = async (sectionId: string) => { const response = await fetch('/api/onenote/default-section', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sectionId }) }); const data = await response.json(); if (!response.ok) return setError(data.error); setStatus('Default section saved.'); advance(4); };

  if (compact) return <section className="setup-card"><h2>Ready to connect?</h2><p>{status}</p><a className="button" href="/setup">Open guided setup</a></section>;

  return <section className="setup">
    <aside>{STEPS.map((name, index) => <button key={name} className={index === step ? 'active' : ''} onClick={() => advance(index)}>{index + 1}. {name}</button>)}</aside>
    <div className="setup-panel">
      <p className="status">{status}</p>
      {error && <p className="error">{error}</p>}
      {step === 0 && <>
        <h2>1. Give OneNote System a safe place to remember your setup</h2>
        <p>OneNote System needs a small database: a private, organized storage space for the settings that make your installation work. It keeps your encrypted Microsoft connection, the OneNote section you choose, and a secure record of your API keys. It does <strong>not</strong> copy your OneNote pages into this database.</p>
        <p><strong>Neon</strong> is a managed PostgreSQL database. In plain English: Neon runs and maintains this private storage space for you, so you do not have to install, secure, update, or back up database software yourself. <strong>Vercel</strong> is where the OneNote System website and API run. Connecting Neon to Vercel lets the app use the database automatically.</p>
        <h3>The easiest path: Vercel + Neon</h3>
        <ol>
          <li>Open the <a href="https://vercel.com/marketplace/neon" target="_blank" rel="noreferrer">Neon listing in the Vercel Marketplace ↗</a>.</li>
          <li>Sign in to Vercel or create a free account. Choose the same Vercel project where you deployed <strong>your own copy</strong> of OneNote System.</li>
          <li>Click <strong>Add Integration</strong>, then follow Neon&apos;s prompts to create a project and database. The free plan is fine for trying OneNote System.</li>
          <li>When Vercel says the integration has been added, go back to your Vercel project. Open <strong>Deployments</strong>, use the <strong>⋯</strong> menu on the newest deployment, and select <strong>Redeploy</strong>.</li>
          <li>Wait for the redeploy to finish, return here, and refresh this page. The warning above should change to “Database connected.”</li>
        </ol>
        <p>The Vercel integration adds the private <code>DATABASE_URL</code> setting for you. Do not copy, paste, or share that value. It is the address and password for your database.</p>
        <p>If you are running this on your own server instead of Vercel, use any PostgreSQL provider and put its connection string in the server&apos;s <code>DATABASE_URL</code> environment variable. The <a href="/docs#database">self-hosting database instructions</a> explain that route.</p>
      </>}
      {step === 1 && <>
        <h2>2. Give your deployment permission to talk to Microsoft</h2>
        <p>Microsoft needs to know which website is asking for OneNote access. You will create an <strong>app registration</strong> in Microsoft Entra. It is a revocable identity for your deployment—not a program you install on your computer.</p>
        <div className="callout"><p>Follow the <a href="/docs#microsoft">complete Microsoft Entra walkthrough</a> in another tab. It explains every menu, the account type, permissions, client ID, client secret, and the difference between a secret Value and Secret ID.</p></div>
        <h3>Your exact redirect URI</h3>
        <p>Choose the <strong>Web</strong> platform in Microsoft and paste this address exactly:</p>
        <pre><code>{typeof window === 'undefined' ? '' : `${window.location.origin}/api/auth/microsoft/callback`}</code></pre>
        <p>A redirect URI is the safe return address Microsoft uses after you approve access. Even one extra slash will cause sign-in to fail.</p>
        <label>Application (client) ID<span className="field-help">From the app registration Overview page. It is a long identifier containing letters, numbers, and hyphens.</span><input autoComplete="off" value={clientId} onChange={(event) => setClientId(event.target.value)} /></label>
        <label>Client secret Value<span className="field-help">From Certificates &amp; secrets. Paste the Value shown once—not the Secret ID.</span><input type="password" autoComplete="new-password" value={clientSecret} onChange={(event) => setClientSecret(event.target.value)} /></label>
        <div className="callout warning"><p>The client secret is a password for this app registration. OneNote System sends it to this server over HTTPS, encrypts it, and stores it in your database. Never put it in GitHub, a Shortcut, or a screenshot.</p></div>
        <button className="button" onClick={saveMicrosoft}>Save Microsoft app securely</button>
      </>}
      {step === 2 && <>
        <h2>3. Sign in to the Microsoft account that owns your notebooks</h2>
        <p>The button below opens Microsoft&apos;s own sign-in and consent page. OneNote System never sees your Microsoft password.</p>
        <p>Microsoft will ask whether this app may read your profile and read/write OneNote. Read/write access is needed to list your notebooks and sections and create captured pages. Offline access lets the encrypted connection refresh without making you sign in every hour.</p>
        <ol><li>Choose the account containing the OneNote notebooks you want.</li><li>Read Microsoft&apos;s permission screen and approve it.</li><li>Microsoft returns you here. The status at the top should say the account is connected.</li></ol>
        <div className="actions"><a className="button" href="/api/auth/microsoft/start">Continue to Microsoft →</a><a className="button secondary" href="/docs#connect">Read connection details</a></div>
      </>}
      {step === 3 && <>
        <h2>4. Choose where new pages should go</h2>
        <p>A OneNote <strong>notebook</strong> contains <strong>sections</strong>, and sections contain pages. This step chooses one section as your capture inbox. You can create a section named “Inbox” in OneNote first, or use an existing section.</p>
        <ol><li>Choose <strong>Load my notebooks</strong>.</li><li>Select the notebook that contains your destination section.</li><li>Select the section. It saves immediately and moves you to Step 5.</li></ol>
        <button className="button" onClick={loadNotebooks}>Load my notebooks</button>
        {notebooks.length > 0 && <label>Notebook<span className="field-help">Only notebooks visible to the connected Microsoft account appear.</span><select value={notebook} onChange={(event) => chooseNotebook(event.target.value)}><option value="">Choose a notebook</option>{notebooks.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>}
        {sections.length > 0 && <label>Destination section<span className="field-help">Every Shortcut using this account&apos;s API key creates pages here.</span><select defaultValue="" onChange={(event) => chooseSection(event.target.value)}><option value="">Choose a section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>}
      </>}
      {step === 4 && <>
        <h2>5. Create the private key your Shortcut will use</h2>
        <p>An API key is a password for sending new pages through your deployment. It does not reveal your Microsoft password, but anyone who has it can create pages in your selected section.</p>
        {!key && <><ol><li>Create the key below.</li><li>Copy it into your password manager immediately.</li><li>Open the Shortcuts guide and put the key only in the Shortcut&apos;s Authorization header.</li></ol><button className="button" onClick={createKey}>Create my first Shortcut API key</button></>}
        {key && <div className="key-result" role="status"><p><strong>This is the only time the complete key will be shown.</strong></p><pre><code>{key}</code></pre><div className="actions"><button className="button" onClick={copyKey}>Copy API key</button><a className="button secondary" href="/shortcuts">Open Shortcut instructions →</a></div></div>}
        <div className="callout warning"><p>Do not put this key in a URL, GitHub, screenshots, or support messages. The server stores only a one-way hash, so it cannot recover a lost key. If you lose it, create another.</p></div>
      </>}
      {step === 5 && <>
        <DiscordSetup />
      </>}
    </div>
  </section>;
}
