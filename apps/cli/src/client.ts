import type { SyncPullApiResponse } from '@passtore/core';

async function readBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function httpError(res: Response, body: unknown): Error {
  const msg =
    typeof body === 'object' && body !== null && 'message' in body
      ? String((body as { message?: unknown }).message)
      : typeof body === 'string'
        ? body
        : res.statusText;
  return new Error(`HTTP ${res.status}: ${msg}`);
}

export async function apiGetJson(
  baseUrl: string,
  token: string,
  path: string,
): Promise<unknown> {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await readBody(res);
  if (!res.ok) {
    throw httpError(res, body);
  }
  return body;
}

export async function apiPostJson(
  baseUrl: string,
  token: string,
  path: string,
  jsonBody: unknown,
): Promise<unknown> {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonBody),
  });
  const body = await readBody(res);
  if (!res.ok) {
    throw httpError(res, body);
  }
  return body;
}

export async function apiPatchJson(
  baseUrl: string,
  token: string,
  path: string,
  jsonBody: unknown,
): Promise<unknown> {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jsonBody),
  });
  const body = await readBody(res);
  if (!res.ok) {
    throw httpError(res, body);
  }
  return body;
}

export async function apiDelete(
  baseUrl: string,
  token: string,
  path: string,
): Promise<void> {
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await readBody(res);
  if (!res.ok) {
    throw httpError(res, body);
  }
}

export async function pullSyncPage(
  baseUrl: string,
  token: string,
  cursor: string | undefined,
  limit: number,
): Promise<SyncPullApiResponse> {
  const qs = new URLSearchParams();
  if (cursor) qs.set('cursor', cursor);
  qs.set('limit', String(limit));
  const data = await apiGetJson(
    baseUrl,
    token,
    `/sync/events?${qs.toString()}`,
  );
  return data as SyncPullApiResponse;
}
