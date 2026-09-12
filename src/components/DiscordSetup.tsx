'use client';

import { FormEvent, useEffect, useState } from 'react';

type DiscordStatus = {
  configured?: boolean;
  applicationId?: string;
  publicKey?: string;
  testGuildId?: string;
  allowedUserIds?: string;
  hasBotToken?: boolean;
  registered?: boolean;
  registeredScope?: string | null;
  registeredAt?: string | null;
  error?: string;
};

async function responseData(response: Response): Promise<DiscordStatus> {
  const responseText = await response.text();
  try {
    return JSON.parse(responseText) as DiscordStatus;
  } catch {
    return { error: 'The server returned ' + response.status + ' instead of JSON.' };
  }
}

export default function DiscordSetup() {
  const [applicationId, setApplicationId] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [botToken, setBotToken] = useState('');
  const [testGuildId, setTestGuildId] = useState('');
  const [allowedUserIds, setAllowedUserIds] = useState('');
  const [endpoint, setEndpoint] = useState('/api/discord/interactions');
  const [status, setStatus] = useState<DiscordStatus>({});
  const [message, setMessage] = useState('Loading Discord settings…');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    const response = await fetch('/api/discord/config', { cache: 'no-store' });
    const data = await responseData(response);
    if (!response.ok) throw new Error(data.error || 'Could not load Discord settings.');
    setStatus(data);
    setApplicationId(data.applicationId || '');
    setPublicKey(data.publicKey || '');
    setTestGuildId(data.testGuildId || '');
    setAllowedUserIds(data.allowedUserIds || '');
    setMessage(data.registered
      ? 'The /onenote command is registered ' + (data.registeredScope === 'global' ? 'globally.' : 'in your test server.')
      : data.configured ? 'Discord settings are saved. Register the /onenote command next.' : 'Add your Discord application details below.');
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setEndpoint(window.location.origin + '/api/discord/interactions');
      loadStatus().catch((reason) => {
        setError(reason instanceof Error ? reason.message : 'Could not load Discord settings.');
        setMessage('Discord setup needs attention.');
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const save = async () => {
    const response = await fetch('/api/discord/config', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ applicationId, publicKey, botToken, testGuildId, allowedUserIds }),
    });
    const data = await responseData(response);
    if (!response.ok) throw new Error(data.error || 'Could not save Discord settings.');
    setBotToken('');
  };

  const saveSettings = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await save();
      await loadStatus();
      setMessage('Discord settings saved securely. Paste the interaction URL into Discord, then register the command.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save Discord settings.');
    } finally {
      setBusy(false);
    }
  };

  const register = async () => {
    setBusy(true);
    setError('');
    try {
      await save();
      const response = await fetch('/api/discord/commands', { method: 'POST' });
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.error || 'Could not register the Discord command.');
      await loadStatus();
      setMessage('The /onenote create and /onenote append actions are registered and ready to use.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not register the Discord command.');
    } finally {
      setBusy(false);
    }
  };

  const unregister = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/discord/commands', { method: 'DELETE' });
      const data = await responseData(response);
      if (!response.ok) throw new Error(data.error || 'Could not remove the Discord command.');
      await loadStatus();
      setMessage('The /onenote command was removed from Discord. Your saved settings remain available.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not remove the Discord command.');
    } finally {
      setBusy(false);
    }
  };

  const copyEndpoint = async () => {
    await navigator.clipboard.writeText(endpoint);
    setMessage('Discord interaction URL copied.');
  };

  const installUrl = applicationId
    ? 'https://discord.com/oauth2/authorize?client_id=' + encodeURIComponent(applicationId) + '&scope=applications.commands'
    : '';

  return <>
    <p className="availability">Available</p>
    <h2>6. Connect Discord</h2>
    <p>Discord can create a new page or append text to an exact page title through the <code>/onenote</code> command. Replies are private to the person running the command, and note text is sent directly to Microsoft instead of being stored by OneNote System.</p>

    <div className="callout"><p>{message}</p></div>
    {error && <p className="error" role="alert">{error}</p>}

    <ol>
      <li>Open the <a href="https://discord.com/developers/applications" target="_blank" rel="noreferrer">Discord Developer Portal ↗</a>, create an application, and open <strong>General Information</strong>.</li>
      <li>Copy its <strong>Application ID</strong> and <strong>Public Key</strong> into the matching fields below.</li>
      <li>Open <strong>Bot</strong>, choose <strong>Reset Token</strong>, and paste the new token below. The token is encrypted before storage and is never shown again.</li>
      <li>Save these settings. Then copy the interaction URL below into <strong>General Information → Interactions Endpoint URL</strong> and save it in Discord.</li>
      <li>Install the application with the <code>applications.commands</code> scope. If you entered a test server ID, choose that server during installation.</li>
      <li>Register the command. A test-server command appears immediately; without a server ID, it is registered globally. Then run <code>/onenote create</code> or <code>/onenote append</code>.</li>
    </ol>

    <form onSubmit={saveSettings}>
      <label>Application ID<span className="field-help">General Information → Application ID.</span><input inputMode="numeric" autoComplete="off" value={applicationId} onChange={(event) => setApplicationId(event.target.value)} /></label>
      <label>Public Key<span className="field-help">General Information → Public Key. This is a 64-character hexadecimal value.</span><input autoCapitalize="none" autoComplete="off" spellCheck={false} value={publicKey} onChange={(event) => setPublicKey(event.target.value)} /></label>
      <label>Bot token<span className="field-help">Required for command registration. Leave blank later to keep the encrypted token already saved.</span><input type="password" autoComplete="new-password" value={botToken} onChange={(event) => setBotToken(event.target.value)} placeholder={status.hasBotToken ? 'Saved securely — leave blank to keep it' : ''} /></label>
      <label>Allowed Discord user IDs <span className="field-help">Only these Discord accounts may run <code>/onenote</code>. The command writes into <em>your</em> OneNote, so anyone listed here can add pages to your notebook. Separate several IDs with commas. Leave blank to allow nobody. To find your ID, enable Developer Mode in Discord, then right-click your name and choose Copy User ID.</span><input inputMode="numeric" autoComplete="off" placeholder="123456789012345678" value={allowedUserIds} onChange={(event) => setAllowedUserIds(event.target.value)} /></label>

      <label>Test server (Guild) ID <span className="optional">Optional</span><span className="field-help">Use a server ID while testing for immediate updates. Leave blank to register the command globally.</span><input inputMode="numeric" autoComplete="off" value={testGuildId} onChange={(event) => setTestGuildId(event.target.value)} /></label>
      <label>Interactions Endpoint URL<span className="field-help">Paste this exact URL into Discord after saving the fields above.</span><span className="copy-field"><input readOnly value={endpoint} /><button className="button secondary" type="button" onClick={copyEndpoint}>Copy</button></span></label>

      <div className="actions discord-actions">
        <button className="button secondary" type="submit" disabled={busy}>{busy ? 'Working…' : 'Save settings'}</button>
        {installUrl && <a className="button secondary" href={installUrl} target="_blank" rel="noreferrer">Install in Discord ↗</a>}
        <button className="button" type="button" disabled={busy} onClick={register}>{busy ? 'Working…' : 'Save and register /onenote'}</button>
      </div>
    </form>

    {status.registered && <div className="discord-registration">
      <p><strong>Registered:</strong> {status.registeredScope === 'global' ? 'Global command' : 'Test server ' + status.registeredScope?.replace('guild:', '')}{status.registeredAt ? ' · ' + new Date(status.registeredAt).toLocaleString() : ''}</p>
      <button className="button secondary" type="button" disabled={busy} onClick={unregister}>Remove /onenote command</button>
    </div>}

    <div className="callout warning"><p>The bot token controls your Discord application. Keep it out of GitHub, screenshots, browser extensions, and messages. If it leaks, reset it in Discord and save the replacement here.</p></div>
  </>;
}
