import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hash } from '@/lib/crypto';
import { graph } from '@/lib/graph';
export const runtime = 'nodejs';

function escapeHtml(value: string) { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return NextResponse.json({ error: 'Use Authorization: Bearer YOUR_API_KEY.' }, { status: 401 });
  try {
    const sql = db();
    const keys = await sql`SELECT k.id, k.user_id, u.default_section_id FROM oq_api_keys k JOIN oq_users u ON u.id=k.user_id WHERE k.token_hash=${hash(token)}`;
    const key = keys[0];
    if (!key?.default_section_id) return NextResponse.json({ error: 'This account has no default OneNote section yet.' }, { status: 409 });
    const body = await req.json();
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim().slice(0, 200) : 'Untitled capture';
    const content = typeof body.content === 'string' ? body.content.slice(0, 100_000) : '';
    const sourceUrl = typeof body.url === 'string' && /^https?:\/\//.test(body.url) ? body.url : null;
    const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${content ? `<p>${escapeHtml(content).replace(/\n/g, '<br>')}</p>` : ''}${sourceUrl ? `<p>Source: <a href="${escapeHtml(sourceUrl)}">${escapeHtml(sourceUrl)}</a></p>` : ''}</body></html>`;
    const result = await graph(key.user_id as string, `/me/onenote/sections/${encodeURIComponent(key.default_section_id as string)}/pages`, { method: 'POST', headers: { 'content-type': 'text/html' }, body: html });
    await sql`UPDATE oq_api_keys SET last_used_at=now() WHERE id=${key.id}`;
    const page = await result.json();
    return NextResponse.json({ ok: true, page: { id: page.id, title: page.title, webUrl: page.links?.oneNoteWebUrl?.href } }, { status: 201 });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : 'Capture failed.' }, { status: 500 }); }
}
