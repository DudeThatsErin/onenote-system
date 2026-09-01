import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Graph is the source of truth. A future search index can be refreshed here;
  // keeping this idempotent makes it safe for Vercel cron retries.
  return NextResponse.json({ ok: true, syncedAt: new Date().toISOString() });
}
