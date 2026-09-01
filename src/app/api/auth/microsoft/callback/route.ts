import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encrypt } from '@/lib/crypto';
import { ensureSchema, db } from '@/lib/db';
import { exchangeCode } from '@/lib/graph';
import { setSession } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');
  const expected = (await cookies()).get('onenote_queue_oauth_state')?.value;
  if (!code || !state || !expected || state.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(state), Buffer.from(expected))) return NextResponse.redirect(new URL('/?error=Microsoft%20authorization%20could%20not%20be%20verified.', req.url));
  try {
    await ensureSchema();
    const tokens = await exchangeCode(code);
    const me = await fetch('https://graph.microsoft.com/v1.0/me?$select=id,displayName,mail,userPrincipalName', { headers: { authorization: `Bearer ${tokens.access_token}` } }).then(async (res) => ({ ok: res.ok, data: await res.json() }));
    if (!me.ok || !me.data.id) throw new Error('Microsoft account details could not be read.');
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const sql = db();
    const rows = await sql`INSERT INTO oq_users (id, microsoft_id, email, display_name, access_token_enc, refresh_token_enc, expires_at) VALUES (${id}, ${me.data.id}, ${me.data.mail || me.data.userPrincipalName || null}, ${me.data.displayName || null}, ${encrypt(tokens.access_token)}, ${encrypt(tokens.refresh_token)}, ${expiresAt}) ON CONFLICT (microsoft_id) DO UPDATE SET email=excluded.email, display_name=excluded.display_name, access_token_enc=excluded.access_token_enc, refresh_token_enc=excluded.refresh_token_enc, expires_at=excluded.expires_at, updated_at=now() RETURNING id`;
    await setSession(rows[0].id as string);
    const response = NextResponse.redirect(new URL('/setup?connected=1', req.url));
    response.cookies.delete('onenote_queue_oauth_state');
    return response;
  } catch (error) { return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error instanceof Error ? error.message : 'Microsoft setup failed')}`, req.url)); }
}
