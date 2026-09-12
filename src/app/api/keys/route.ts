import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { hash, randomToken } from '@/lib/crypto';
import { db } from '@/lib/db';
export const runtime = 'nodejs';
export async function POST(req: NextRequest) { try { const user = await requireUser(); const { label = 'Shortcut' } = await req.json().catch(() => ({})); const token = `ons_${randomToken(32)}`; await db()`INSERT INTO ons_api_keys (id, user_id, label, token_hash) VALUES (${crypto.randomUUID()}, ${user.id}, ${String(label).slice(0, 80)}, ${hash(token)})`; return NextResponse.json({ key: token }); } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Request failed' }, { status: 401 }); } }
