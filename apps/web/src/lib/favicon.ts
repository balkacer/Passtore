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

/** Hostname for DuckDuckGo icons fallback (same parsing as resolveFaviconUrl). */
export function resolveHostnameForFavicon(rawUrl?: string | null): string | null {
  if (!rawUrl?.trim()) {
    return null;
  }
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return u.hostname || null;
  } catch {
    return null;
  }
}

export function duckDuckGoFaviconUrl(hostname: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(hostname)}.ico`;
}
