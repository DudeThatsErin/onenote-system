import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, markApiKeyUsed } from '@/lib/apiKey';
import { graph } from '@/lib/graph';
import { escapeHtml, MAX_NOTE_CONTENT_LENGTH, plainTextHtml } from '@/lib/onenoteContent';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const key = await authenticateApiKey(req.headers.get('authorization'));
    if (!key) return NextResponse.json({ error: 'Use Authorization: Bearer YOUR_API_KEY.' }, { status: 401 });
    if (!key.defaultSectionId) return NextResponse.json({ error: 'This account has no default OneNote section yet.' }, { status: 409 });
    const body = await req.json();
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : 'Untitled capture';
    const content = typeof body.content === 'string' ? body.content.slice(0, MAX_NOTE_CONTENT_LENGTH) : '';
    const sourceUrl = typeof body.url === 'string' && /^https?:\/\//.test(body.url) ? body.url : null;
    const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${plainTextHtml(content, sourceUrl)}</body></html>`;
    const result = await graph(key.userId, `/me/onenote/sections/${encodeURIComponent(key.defaultSectionId)}/pages`, { method: 'POST', headers: { 'content-type': 'text/html' }, body: html });
    await markApiKeyUsed(key.id);
    const page = await result.json();
    return NextResponse.json({ ok: true, page: { id: page.id, title: page.title, webUrl: page.links?.oneNoteWebUrl?.href } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Capture failed.' }, { status: 500 }); }
}
