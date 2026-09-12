import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, markApiKeyUsed } from '@/lib/apiKey';
import { TodoError, createTask, listTasks } from '@/lib/todo';

export const runtime = 'nodejs';

function failure(error: unknown) {
  const status = error instanceof TodoError ? error.status : 500;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'The To Do request failed.' },
    { status },
  );
}

/** GET /api/todo — open tasks in a To Do list. */
export async function GET(req: NextRequest) {
  try {
    const key = await authenticateApiKey(req.headers.get('authorization'));
    if (!key) return NextResponse.json({ error: 'Use Authorization: Bearer YOUR_API_KEY.' }, { status: 401 });

    const params = req.nextUrl.searchParams;
    const result = await listTasks(key.userId, {
      listName: params.get('list') ?? '',
      includeCompleted: params.get('all') === 'true',
      top: Number(params.get('top')) || 25,
    });
    await markApiKeyUsed(key.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return failure(error);
  }
}

/** POST /api/todo — create a task. */
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

    const str = (field: string) => (typeof body[field] === 'string' ? (body[field] as string) : '');

    const task = await createTask(key.userId, {
      title: str('title'),
      note: str('note'),
      listName: str('list'),
      dueDate: str('dueDate') || null,
      reminder: str('reminder') || null,
      timeZone: str('timeZone') || 'UTC',
    });
    await markApiKeyUsed(key.id);
    return NextResponse.json({ ok: true, task }, { status: 201 });
  } catch (error) {
    return failure(error);
  }
}
