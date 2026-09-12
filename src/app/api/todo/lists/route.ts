import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, markApiKeyUsed } from '@/lib/apiKey';
import { TodoError, listTodoLists } from '@/lib/todo';

export const runtime = 'nodejs';

/** GET /api/todo/lists — the To Do lists on the connected account. */
export async function GET(req: NextRequest) {
  try {
    const key = await authenticateApiKey(req.headers.get('authorization'));
    if (!key) return NextResponse.json({ error: 'Use Authorization: Bearer YOUR_API_KEY.' }, { status: 401 });

    const lists = await listTodoLists(key.userId);
    await markApiKeyUsed(key.id);
    return NextResponse.json({ ok: true, lists });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Listing To Do lists failed.' },
      { status: error instanceof TodoError ? error.status : 500 },
    );
  }
}
