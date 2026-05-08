/**
 * Resolve a favicon URL for display. Falls back to Google's favicon helper.
 */
export function resolveFaviconUrl(rawUrl?: string | null): string | null {
  if (!rawUrl?.trim()) {
    return null;
  }
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    const host = u.hostname;
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(host)}`;
  } catch {
    return null;
  }
}
