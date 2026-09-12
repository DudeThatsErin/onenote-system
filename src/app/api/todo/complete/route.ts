import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, markApiKeyUsed } from '@/lib/apiKey';
import { TodoError, completeTask } from '@/lib/todo';

export const runtime = 'nodejs';

/** POST /api/todo/complete — mark a task done. */
export async function POST(req: NextRequest) {
  try {
    const key = await authenticateApiKey(req.headers.get('authorization'));
    if (!key) return NextResponse.json({ error: 'Use Authorization: Bearer YOUR_API_KEY.' }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      const parsed: unknown = await req.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return NextResponse.json({ error: 'Send a JSON object as the request body.' }, { status: 400 });
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: 'Send a valid JSON request body.' }, { status: 400 });
    }

    const id = typeof body.id === 'string' ? body.id : '';
    if (!id.trim()) return NextResponse.json({ error: 'id is required.' }, { status: 400 });

    const task = await completeTask(key.userId, {
      id,
      listName: typeof body.list === 'string' ? body.list : '',
    });
    await markApiKeyUsed(key.id);
    return NextResponse.json({ ok: true, task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Completing the task failed.' },
      { status: error instanceof TodoError ? error.status : 500 },
    );
  }
}
