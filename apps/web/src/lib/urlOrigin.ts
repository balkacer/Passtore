/** Normalize URL-like input to origin (scheme + host + port). */
export function normalizeOrigin(input: string | null | undefined): string | null {
  if (!input || !input.trim()) {
    return null;
  }
  const raw = input.trim();
  try {
    const u = new URL(raw.includes('://') ? raw : `https://${raw}`);
    return u.origin;
  } catch {
    return null;
  }
}
