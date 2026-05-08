/**
 * MV3 service worker: bridge PING + temporary-auth API (fetch desde el SW).
 * JWT temporal en chrome.storage.session (se pierde al cerrar el navegador).
 */
const STORAGE_API_BASE = 'passtore.apiBaseUrl';
const STORAGE_TEMP_JWT = 'passtore.tempJwt';
const STORAGE_LAST_PAIRING = 'passtore.lastPairing';

function normalizeBaseUrl(base) {
  const t = String(base ?? '').trim();
  return t.replace(/\/$/, '') || 'http://localhost:3000';
}

function apiUrl(base, path) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

async function readApiBase() {
  const got = await chrome.storage.sync.get(STORAGE_API_BASE);
  return normalizeBaseUrl(got[STORAGE_API_BASE]);
}

async function readTempJwt() {
  const s = await chrome.storage.session.get(STORAGE_TEMP_JWT);
  return s[STORAGE_TEMP_JWT] ?? null;
}

async function fetchJson(url, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body != null) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(url, { ...options, headers });
  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : typeof body === 'string'
          ? body
          : JSON.stringify(body);
    const err = new Error(msg || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PING') {
    sendResponse({ type: 'PONG', nonce: message.nonce });
    return true;
  }

  if (message?.type === 'TEMP_AUTH_GET_STATE') {
    void (async () => {
      try {
        const apiBaseUrl = await readApiBase();
        const sess = await chrome.storage.session.get(STORAGE_TEMP_JWT);
        const tempJwt = sess[STORAGE_TEMP_JWT] ?? null;
        const local = await chrome.storage.local.get(STORAGE_LAST_PAIRING);
        const lastPairing = local[STORAGE_LAST_PAIRING] ?? null;
        sendResponse({
          ok: true,
          apiBaseUrl,
          tempJwtPresent: Boolean(tempJwt),
          lastPairing,
        });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'TEMP_AUTH_SET_API_BASE') {
    void (async () => {
      try {
        const v = normalizeBaseUrl(message.apiBaseUrl);
        await chrome.storage.sync.set({ [STORAGE_API_BASE]: v });
        sendResponse({ ok: true, apiBaseUrl: v });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'TEMP_AUTH_INIT_PAIRING') {
    void (async () => {
      try {
        const base = await readApiBase();
        const url = apiUrl(base, '/temporary-auth/pairing/init');
        const data = await fetchJson(url, {
          method: 'POST',
          body: JSON.stringify(message.body),
        });
        await chrome.storage.local.set({
          [STORAGE_LAST_PAIRING]: {
            sessionId: data.sessionId,
            pairingCode: data.pairingCode,
            deepLink: data.deepLink,
            qrPayload: data.qrPayload,
            pairingExpiresAt: data.pairingExpiresAt,
          },
        });
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({
          ok: false,
          error: e.message,
          status: e.status,
          body: e.body,
        });
      }
    })();
    return true;
  }

  if (message?.type === 'TEMP_AUTH_POLL_PAIRING') {
    void (async () => {
      try {
        const base = await readApiBase();
        const { sessionId, pairingCode } = message;
        const q = `?code=${encodeURIComponent(pairingCode)}`;
        const url = apiUrl(
          base,
          `/temporary-auth/pairing/${sessionId}/status${q}`,
        );
        const data = await fetchJson(url, { method: 'GET' });
        if (
          data.status === 'active' &&
          data.temporaryAccessToken &&
          typeof data.temporaryAccessToken === 'string'
        ) {
          await chrome.storage.session.set({
            [STORAGE_TEMP_JWT]: data.temporaryAccessToken,
          });
        }
        sendResponse({ ok: true, data });
      } catch (e) {
        sendResponse({
          ok: false,
          error: e.message,
          status: e.status,
          body: e.body,
        });
      }
    })();
    return true;
  }

  if (message?.type === 'TEMP_AUTH_CLEAR_JWT') {
    void (async () => {
      try {
        await chrome.storage.session.remove(STORAGE_TEMP_JWT);
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'TEMP_AUTH_AUTOFILL_ACTIVE_TAB') {
    void (async () => {
      try {
        const token = await readTempJwt();
        if (!token) {
          sendResponse({ ok: false, error: 'Sin JWT temporal. Empareja antes.' });
          return;
        }
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (tab?.id == null || !tab.url || !/^https?:/i.test(tab.url)) {
          sendResponse({
            ok: false,
            error: 'Abre una pestaña http(s) en la página de login.',
          });
          return;
        }
        const requestedOrigin = new URL(tab.url).origin;
        const base = await readApiBase();
        const url = apiUrl(base, '/temporary-auth/deliver');
        const body = {
          credentialId: message.credentialId,
          requestedOrigin,
          purpose: message.purpose || 'autofill',
        };
        const data = await fetchJson(url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.needsApproval) {
          sendResponse({
            ok: true,
            needsApproval: true,
            data,
            tabId: tab.id,
          });
          return;
        }
        const cred = data.credential;
        if (!cred?.loginUsername) {
          sendResponse({ ok: false, error: 'Respuesta sin loginUsername' });
          return;
        }
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'PASSTORE_AUTOFILL',
            loginUsername: cred.loginUsername,
          });
        } catch {
          sendResponse({
            ok: true,
            filled: true,
            alias: cred.alias,
            platformName: cred.platformName,
            warn: 'Recarga la pestaña para inyectar el content script.',
          });
          return;
        }
        sendResponse({
          ok: true,
          filled: true,
          alias: cred.alias,
          platformName: cred.platformName,
        });
      } catch (e) {
        sendResponse({
          ok: false,
          error: e.message,
          status: e.status,
          body: e.body,
        });
      }
    })();
    return true;
  }

  if (message?.type === 'TEMP_AUTH_POLL_DELIVERY') {
    void (async () => {
      try {
        const token = await readTempJwt();
        if (!token) {
          sendResponse({ ok: false, error: 'Sin JWT temporal' });
          return;
        }
        const base = await readApiBase();
        const requestId = message.requestId;
        const pollUrl = apiUrl(
          base,
          `/temporary-auth/deliveries/${requestId}/poll`,
        );
        const pollData = await fetchJson(pollUrl, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (pollData.status === 'ready' && pollData.credential) {
          const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });
          if (tab?.id != null) {
            try {
              await chrome.tabs.sendMessage(tab.id, {
                type: 'PASSTORE_AUTOFILL',
                loginUsername: pollData.credential.loginUsername,
              });
            } catch {
              /* content script no inyectado */
            }
          }
        }
        sendResponse({ ok: true, data: pollData });
      } catch (e) {
        sendResponse({
          ok: false,
          error: e.message,
          status: e.status,
          body: e.body,
        });
      }
    })();
    return true;
  }

  return false;
});
