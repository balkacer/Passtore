import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { getApiBaseUrl } from '@/lib/config';

type ApiFetchOptions = RequestInit & {
  /** When set, sends `Authorization: Bearer …`. When omitted, no auth header. */
  bearerToken?: string | null;
};

export async function apiFetchJson<T>(
  path: string,
  init?: ApiFetchOptions,
): Promise<{ data: T } | { error: FetchBaseQueryError }> {
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const { bearerToken, headers: initHeaders, ...rest } = init ?? {};
  const headers = new Headers(initHeaders);
  headers.set('Content-Type', 'application/json');
  if (bearerToken) {
    headers.set('Authorization', `Bearer ${bearerToken}`);
  }
  const res = await fetch(url, {
    ...rest,
    headers,
  });
  const text = await res.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!res.ok) {
    return {
      error: {
        status: res.status,
        data: parsed,
      },
    };
  }
  return { data: parsed as T };
}
