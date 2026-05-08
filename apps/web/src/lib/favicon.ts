export function resolveFaviconUrl(rawUrl?: string | null): string | null {
  if (!rawUrl?.trim()) {
    return null;
  }
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return `https://www.google.com/s2/favicons?sz=64&domain=${encodeURIComponent(u.hostname)}`;
  } catch {
    return null;
  }
}
