import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, markApiKeyUsed } from '@/lib/apiKey';
import { MAX_NOTE_CONTENT_LENGTH } from '@/lib/onenoteContent';
import { createOneNotePage, sourceUrl } from '@/lib/onenote';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const key = await authenticateApiKey(req.headers.get('authorization'));
    if (!key) return NextResponse.json({ error: 'Use Authorization: Bearer YOUR_API_KEY.' }, { status: 401 });
    if (!key.defaultSectionId) return NextResponse.json({ error: 'This account has no default OneNote section yet.' }, { status: 409 });
    const body = await req.json();
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : 'Untitled capture';
    const content = typeof body.content === 'string' ? body.content.slice(0, MAX_NOTE_CONTENT_LENGTH) : '';
    const page = await createOneNotePage(key.userId, key.defaultSectionId, title, content, sourceUrl(body.url));
    await markApiKeyUsed(key.id);
    return NextResponse.json({ ok: true, page }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Capture failed.' }, { status: 500 }); }
}
