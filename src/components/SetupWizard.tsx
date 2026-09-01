'use client';

import { useEffect, useState } from 'react';

const STEPS = ['Database', 'Microsoft app', 'Connect account', 'Default section', 'API key', 'Discord (advanced)'];
type NamedItem = { id: string; displayName: string };

export default function SetupWizard({ compact = false }: { compact?: boolean }) {
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState('Checking setup…');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [discord, setDiscord] = useState({ applicationId: '', publicKey: '', botToken: '', testGuildId: '' });
  const [notebooks, setNotebooks] = useState<NamedItem[]>([]);
  const [sections, setSections] = useState<NamedItem[]>([]);
  const [notebook, setNotebook] = useState('');

  useEffect(() => {
    const saved = Number(localStorage.getItem('onenote-queue-setup-step') || 0);
    setStep(Number.isFinite(saved) ? saved : 0);
    fetch('/api/setup').then((response) => response.json()).then((data) => setStatus(data.databaseReady === false ? data.error : data.configured ? (data.signedIn ? 'Microsoft account connected.' : 'Microsoft app saved. Connect your account next.') : 'Database connected. Add your Microsoft app.')).catch(() => setStatus('Could not contact the setup API.'));
  }, []);

  const advance = (value: number) => { setStep(value); localStorage.setItem('onenote-queue-setup-step', String(value)); };
  const saveMicrosoft = async () => { setError(''); const response = await fetch('/api/setup', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId, clientSecret }) }); const data = await response.json(); if (!response.ok) return setError(data.error); setStatus('Microsoft app saved securely.'); advance(2); };
  const createKey = async () => { const response = await fetch('/api/keys', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ label: 'My first Shortcut' }) }); const data = await response.json(); if (!response.ok) return setError(data.error); setKey(data.key); advance(5); };
  const saveDiscord = async () => { const response = await fetch('/api/discord/config', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(discord) }); const data = await response.json(); if (!response.ok) return setError(data.error); setStatus('Discord configuration saved. Follow the command-registration guide in Docs.'); };
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
        <h2>1. Give OneNote Queue a safe place to remember your setup</h2>
        <p>OneNote Queue needs a small database: a private, organized storage space for the settings that make your installation work. It keeps your encrypted Microsoft connection, the OneNote section you choose, and a secure record of your API keys. It does <strong>not</strong> copy your OneNote pages into this database.</p>
        <p><strong>Neon</strong> is a managed PostgreSQL database. In plain English: Neon runs and maintains this private storage space for you, so you do not have to install, secure, update, or back up database software yourself. <strong>Vercel</strong> is where the OneNote Queue website and API run. Connecting Neon to Vercel lets the app use the database automatically.</p>
        <h3>The easiest path: Vercel + Neon</h3>
        <ol>
          <li>Open the <a href="https://vercel.com/marketplace/neon" target="_blank" rel="noreferrer">Neon listing in the Vercel Marketplace ↗</a>.</li>
          <li>Sign in to Vercel or create a free account. Choose the same Vercel project where you deployed <strong>your own copy</strong> of OneNote Queue.</li>
          <li>Click <strong>Add Integration</strong>, then follow Neon&apos;s prompts to create a project and database. The free plan is fine for trying OneNote Queue.</li>
          <li>When Vercel says the integration has been added, go back to your Vercel project. Open <strong>Deployments</strong>, use the <strong>⋯</strong> menu on the newest deployment, and select <strong>Redeploy</strong>.</li>
          <li>Wait for the redeploy to finish, return here, and refresh this page. The warning above should change to “Database connected.”</li>
        </ol>
        <p>The Vercel integration adds the private <code>DATABASE_URL</code> setting for you. Do not copy, paste, or share that value. It is the address and password for your database.</p>
        <p>If you are running this on your own server instead of Vercel, use any PostgreSQL provider and put its connection string in the server&apos;s <code>DATABASE_URL</code> environment variable. The <a href="/docs#database">self-hosting database instructions</a> explain that route.</p>
      </>}
      {step === 1 && <><h2>2. Add your Microsoft app</h2><p>Follow the exact Microsoft Entra steps in the docs. Your redirect URI is <code>{typeof window === 'undefined' ? '' : `${window.location.origin}/api/auth/microsoft/callback`}</code>.</p><label>Application (client) ID<input value={clientId} onChange={(e) => setClientId(e.target.value)} /></label><label>Client secret value<input type="password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} /></label><button className="button" onClick={saveMicrosoft}>Save Microsoft app</button></>}
      {step === 2 && <><h2>3. Connect your Microsoft account</h2><p>This opens Microsoft&apos;s consent screen. The app requests access only to the account you choose.</p><a className="button" href="/api/auth/microsoft/start">Connect Microsoft</a></>}
      {step === 3 && <><h2>4. Choose your default section</h2><p>Load your notebooks, choose one, then select the section where Shortcut captures should land.</p><button className="button" onClick={loadNotebooks}>Load notebooks</button>{notebooks.length > 0 && <label>Notebook<select value={notebook} onChange={(e) => chooseNotebook(e.target.value)}><option value="">Choose a notebook</option>{notebooks.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>}{sections.length > 0 && <label>Section<select defaultValue="" onChange={(e) => chooseSection(e.target.value)}><option value="">Choose a section</option>{sections.map((item) => <option key={item.id} value={item.id}>{item.displayName}</option>)}</select></label>}</>}
      {step === 4 && <><h2>5. Create a Shortcut API key</h2><p>Create this after choosing a default section. It is shown once; put it in your Shortcut&apos;s Authorization header.</p><button className="button" onClick={createKey}>Create API key</button>{key && <pre>{key}</pre>}</>}
      {step === 5 && <><h2>6. Discord is optional</h2><p>Required: Application ID and Public Key. Optional: test Guild ID for fast command testing. Bot token is only for the self-hosted gateway-bot mode, never Vercel.</p><label>Discord Application ID<input value={discord.applicationId} onChange={(e) => setDiscord({ ...discord, applicationId: e.target.value })} /></label><label>Discord Public Key<input value={discord.publicKey} onChange={(e) => setDiscord({ ...discord, publicKey: e.target.value })} /></label><label>Test Guild ID (optional)<input value={discord.testGuildId} onChange={(e) => setDiscord({ ...discord, testGuildId: e.target.value })} /></label><label>Bot token (self-host gateway mode only)<input type="password" value={discord.botToken} onChange={(e) => setDiscord({ ...discord, botToken: e.target.value })} /></label><button className="button" onClick={saveDiscord}>Save advanced setup</button><p><a href="/docs#advanced-discord">Open Discord instructions</a></p></>}
    </div>
  </section>;
}
