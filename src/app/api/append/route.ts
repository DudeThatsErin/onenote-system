import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, markApiKeyUsed } from '@/lib/apiKey';
import { MAX_NOTE_CONTENT_LENGTH } from '@/lib/onenoteContent';
import { appendToOneNotePage, OneNoteRequestError, sourceUrl } from '@/lib/onenote';

export const runtime = 'nodejs';

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

    const content = typeof body.content === 'string' ? body.content : '';
    if (!content.trim()) return NextResponse.json({ error: 'content is required and cannot be empty.' }, { status: 400 });
    if (content.length > MAX_NOTE_CONTENT_LENGTH) {
      return NextResponse.json({ error: `content cannot exceed ${MAX_NOTE_CONTENT_LENGTH.toLocaleString('en-US')} characters.` }, { status: 400 });
    }

    const requestedPageId = typeof body.pageId === 'string' ? body.pageId.trim() : '';
    const requestedPageTitle = typeof body.pageTitle === 'string' ? body.pageTitle.trim() : '';
    if (!requestedPageId && !requestedPageTitle) {
      return NextResponse.json({ error: 'Provide pageId or pageTitle.' }, { status: 400 });
    }
    if (requestedPageId.length > 2_000) return NextResponse.json({ error: 'pageId is too long.' }, { status: 400 });
    if (requestedPageTitle.length > 200) return NextResponse.json({ error: 'pageTitle cannot exceed 200 characters.' }, { status: 400 });

    const page = await appendToOneNotePage({
      userId: key.userId,
      sectionId: key.defaultSectionId,
      pageId: requestedPageId || undefined,
      pageTitle: requestedPageTitle || undefined,
      content,
      url: sourceUrl(body.url),
    });
    await markApiKeyUsed(key.id);

    return NextResponse.json({ ok: true, page });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Append failed.' },
      { status: error instanceof OneNoteRequestError ? error.status : 500 },
    );
  }
}
