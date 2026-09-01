export const MAX_NOTE_CONTENT_LENGTH = 100_000;

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function plainTextHtml(content: string, sourceUrl: string | null = null) {
  const text = content
    ? `<p>${escapeHtml(content).replace(/\r?\n/g, '<br>')}</p>`
    : '';
  const source = sourceUrl
    ? `<p>Source: <a href="${escapeHtml(sourceUrl)}">${escapeHtml(sourceUrl)}</a></p>`
    : '';

  return `${text}${source}`;
}
