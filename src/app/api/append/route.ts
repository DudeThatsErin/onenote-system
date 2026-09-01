import { NextRequest, NextResponse } from 'next/server';
import { authenticateApiKey, markApiKeyUsed } from '@/lib/apiKey';
import { graph } from '@/lib/graph';
import { MAX_NOTE_CONTENT_LENGTH, plainTextHtml } from '@/lib/onenoteContent';

export const runtime = 'nodejs';

type OneNotePage = {
  id: string;
  title?: string;
  links?: { oneNoteWebUrl?: { href?: string } };
};

function validSourceUrl(value: unknown) {
  return typeof value === 'string' && /^https?:\/\//.test(value) ? value : null;
}

async function pageByTitle(userId: string, sectionId: string, title: string) {
  const escapedTitle = title.replace(/'/g, "''");
  const query = new URLSearchParams({
    '$filter': `title eq '${escapedTitle}'`,
    '$select': 'id,title,links',
    '$top': '2',
  });
  const response = await graph(
    userId,
    `/me/onenote/sections/${encodeURIComponent(sectionId)}/pages?${query.toString()}`,
    { headers: { accept: 'application/json' } },
  );
  const data = await response.json() as { value?: OneNotePage[] };
  return data.value ?? [];
}

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

    let page: OneNotePage = { id: requestedPageId };
    if (!requestedPageId) {
      if (!key.defaultSectionId) {
        return NextResponse.json({ error: 'A default OneNote section is required when using pageTitle.' }, { status: 409 });
      }
      const matches = await pageByTitle(key.userId, key.defaultSectionId, requestedPageTitle);
      if (!matches.length) {
        return NextResponse.json({ error: `No page titled "${requestedPageTitle}" was found in the default section.` }, { status: 404 });
      }
      if (matches.length > 1) {
        return NextResponse.json({ error: `More than one page is titled "${requestedPageTitle}". Use pageId to choose the exact page.` }, { status: 409 });
      }
      page = matches[0];
    }

    const sourceUrl = validSourceUrl(body.url);
    const appendHtml = `<div>${plainTextHtml(content, sourceUrl)}</div>`;
    await graph(key.userId, `/me/onenote/pages/${encodeURIComponent(page.id)}/content`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify([{ target: 'body', action: 'append', content: appendHtml }]),
    });
    await markApiKeyUsed(key.id);

    return NextResponse.json({
      ok: true,
      page: {
        id: page.id,
        title: page.title ?? (requestedPageTitle || undefined),
        webUrl: page.links?.oneNoteWebUrl?.href,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Append failed.' }, { status: 500 });
  }
}
