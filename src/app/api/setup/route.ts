import { NextRequest, NextResponse } from 'next/server';
import { encrypt } from '@/lib/crypto';
import { currentUser } from '@/lib/auth';
import { db, ensureSchema } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET() {
  try {
    await ensureSchema();
    const rows = await db()`SELECT client_id FROM oq_config WHERE id=1`;
    const user = await currentUser();
    return NextResponse.json({ configured: Boolean(rows[0]?.client_id), signedIn: Boolean(user), user });
  } catch (error) {
    return NextResponse.json({ configured: false, databaseReady: false, error: error instanceof Error ? error.message : 'Setup unavailable' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureSchema();
    const existing = await db()`SELECT client_id FROM oq_config WHERE id=1`;
    const user = await currentUser();
    if (existing[0]?.client_id && !user) return NextResponse.json({ error: 'Sign in to change the Microsoft app configuration.' }, { status: 401 });
    const { clientId, clientSecret } = await req.json();
    if (typeof clientId !== 'string' || typeof clientSecret !== 'string' || !clientId.trim() || !clientSecret.trim()) return NextResponse.json({ error: 'Client ID and client secret are required.' }, { status: 400 });
    await db()`INSERT INTO oq_config (id, client_id, client_secret_enc, configured_at) VALUES (1, ${clientId.trim()}, ${encrypt(clientSecret.trim())}, now()) ON CONFLICT (id) DO UPDATE SET client_id=excluded.client_id, client_secret_enc=excluded.client_secret_enc, configured_at=now()`;
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save configuration.' }, { status: 500 }); }
}
