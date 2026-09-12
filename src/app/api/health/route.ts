import { NextResponse } from 'next/server';
import { ensureSchema } from '@/lib/db';
export const runtime = 'nodejs';
export async function GET() { try { await ensureSchema(); return NextResponse.json({ ok: true, service: 'onenote-system' }); } catch (error) { return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'Database unavailable' }, { status: 503 }); } }
