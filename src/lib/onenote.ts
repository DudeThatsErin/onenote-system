import { graph } from '@/lib/graph';
import { escapeHtml, plainTextHtml } from '@/lib/onenoteContent';

export type OneNotePage = {
  id: string;
  title?: string;
  links?: { oneNoteWebUrl?: { href?: string } };
};

export type OneNotePageResult = {
  id: string;
  title?: string;
  webUrl?: string;
};

export class OneNoteRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'OneNoteRequestError';
  }
}

export function sourceUrl(value: unknown) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function createOneNotePage(
  userId: string,
  sectionId: string,
  title: string,
  content: string,
  url: string | null,
): Promise<OneNotePageResult> {
  const html = `<!doctype html><html><head><title>${escapeHtml(title)}</title></head><body><h1>${escapeHtml(title)}</h1>${plainTextHtml(content, url)}</body></html>`;
  const response = await graph(
    userId,
    `/me/onenote/sections/${encodeURIComponent(sectionId)}/pages`,
    { method: 'POST', headers: { 'content-type': 'text/html' }, body: html },
  );
  const page = await response.json() as OneNotePage;
  return { id: page.id, title: page.title, webUrl: page.links?.oneNoteWebUrl?.href };
}

async function pagesByTitle(userId: string, sectionId: string, title: string) {
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

export async function appendToOneNotePage({
  userId,
  sectionId,
  pageId,
  pageTitle,
  content,
  url,
}: {
  userId: string;
  sectionId: string | null;
  pageId?: string;
  pageTitle?: string;
  content: string;
  url: string | null;
}): Promise<OneNotePageResult> {
  let page: OneNotePage = { id: pageId ?? '' };

  if (!pageId) {
    if (!sectionId) throw new OneNoteRequestError('A default OneNote section is required when using a page title.', 409);
    const matches = await pagesByTitle(userId, sectionId, pageTitle ?? '');
    if (!matches.length) throw new OneNoteRequestError(`No page titled "${pageTitle}" was found in the default section.`, 404);
    if (matches.length > 1) throw new OneNoteRequestError(`More than one page is titled "${pageTitle}". Use a page ID to choose the exact page.`, 409);
    page = matches[0];
  }

  const appendHtml = `<div>${plainTextHtml(content, url)}</div>`;
  await graph(userId, `/me/onenote/pages/${encodeURIComponent(page.id)}/content`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify([{ target: 'body', action: 'append', content: appendHtml }]),
  });

  return {
    id: page.id,
    title: page.title ?? pageTitle,
    webUrl: page.links?.oneNoteWebUrl?.href,
  };
}
