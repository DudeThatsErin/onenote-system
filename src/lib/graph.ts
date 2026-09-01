import { decrypt, encrypt } from '@/lib/crypto';
import { db } from '@/lib/db';

const TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const SCOPES = 'offline_access User.Read Notes.ReadWrite';

async function config() {
  const rows = await db()`SELECT client_id, client_secret_enc FROM oq_config WHERE id = 1`;
  if (!rows[0]?.client_id || !rows[0]?.client_secret_enc) throw new Error('Microsoft app is not configured. Complete setup first.');
  return { clientId: rows[0].client_id as string, clientSecret: decrypt(rows[0].client_secret_enc as string) };
}

export function redirectUri() { return `${process.env.APP_URL}/api/auth/microsoft/callback`; }

export async function authorizationUrl(state: string) {
  const { clientId } = await config();
  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${new URLSearchParams({ client_id: clientId, response_type: 'code', redirect_uri: redirectUri(), response_mode: 'query', scope: SCOPES, state }).toString()}`;
}

export async function exchangeCode(code: string) {
  const { clientId, clientSecret } = await config();
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri(), grant_type: 'authorization_code' }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Microsoft token exchange failed.');
  return data as { access_token: string; refresh_token: string; expires_in: number };
}

export async function accessToken(userId: string) {
  const sql = db();
  const users = await sql`SELECT access_token_enc, refresh_token_enc, expires_at FROM oq_users WHERE id = ${userId}`;
  const user = users[0];
  if (!user) throw new Error('Microsoft account not found.');
  if (new Date(user.expires_at as string).getTime() > Date.now() + 60_000) return decrypt(user.access_token_enc as string);
  const { clientId, clientSecret } = await config();
  const res = await fetch(TOKEN_URL, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: decrypt(user.refresh_token_enc as string), grant_type: 'refresh_token' }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_description || 'Microsoft token refresh failed. Reconnect Microsoft.');
  await sql`UPDATE oq_users SET access_token_enc=${encrypt(data.access_token)}, refresh_token_enc=${encrypt(data.refresh_token || decrypt(user.refresh_token_enc as string))}, expires_at=${new Date(Date.now() + data.expires_in * 1000).toISOString()}, updated_at=now() WHERE id=${userId}`;
  return data.access_token as string;
}

export async function graph(userId: string, path: string, init: RequestInit = {}) {
  const token = await accessToken(userId);
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, { ...init, headers: { authorization: `Bearer ${token}`, ...init.headers } });
  if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error?.message || `Microsoft Graph returned ${res.status}`); }
  return res;
}
