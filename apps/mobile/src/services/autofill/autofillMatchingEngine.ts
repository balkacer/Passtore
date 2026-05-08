/**
 * Pure ranking logic for autofill — runs on decrypted metadata only after unlock.
 * See docs/AUTOFILL_PLATFORM_ARCHITECTURE.md
 */
import type { CredentialIndexRow } from '@passtore/core';

export interface FillContext {
  /** e.g. https://accounts.google.com */
  origin?: string | null;
  /** Android package name */
  packageName?: string | null;
  /** iOS bundle id */
  bundleId?: string | null;
}

export interface RankedCredential {
  credentialId: string;
  score: number;
  reasons: string[];
}

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

/** Score candidates for autofill; higher is better. */
export function rankCredentialsForFill(
  rows: CredentialIndexRow[],
  ctx: FillContext,
): RankedCredential[] {
  const targetOrigin = ctx.origin ? normalizeOrigin(ctx.origin) : null;
  const ranked: RankedCredential[] = [];

  for (const row of rows) {
    let score = 0;
    const reasons: string[] = [];

    if (targetOrigin && row.normalizedOrigin) {
      if (row.normalizedOrigin === targetOrigin) {
        score += 100;
        reasons.push('origin-exact');
      } else {
        try {
          const want = new URL(targetOrigin).hostname;
          const have = new URL(row.normalizedOrigin).hostname;
          if (want === have || want.endsWith(`.${have}`) || have.endsWith(`.${want}`)) {
            score += 40;
            reasons.push('origin-partial');
          }
        } catch {
          /* ignore malformed stored origins */
        }
      }
    }

    // Future: packageName / bundleId maps in metadata
    score += Math.min(10, Math.floor(Date.parse(row.updatedAt) / 1e11));

    ranked.push({ credentialId: row.id, score, reasons });
  }

  return ranked.sort((a, b) => b.score - a.score);
}
