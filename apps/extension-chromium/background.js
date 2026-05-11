/**
 * MV3 service worker: bridge PING + auth (JWT web en local, JWT temporal en session).
 * Autofill: prioriza JWT de sesión web → POST /temporary-auth/extension-autofill;
 * si no, JWT temporal → POST /temporary-auth/deliver.
 */
const STORAGE_API_BASE = 'passtore.apiBaseUrl';
const STORAGE_WEB_APP_URL = 'passtore.webAppUrl';
const STORAGE_TEMP_JWT = 'passtore.tempJwt';
const STORAGE_USER_ACCESS = 'passtore.userAccessToken';
const STORAGE_LAST_PAIRING = 'passtore.lastPairing';

const DEFAULT_WEB_APP = 'http://localhost:5173';

function normalizeBaseUrl(base) {
  const t = String(base ?? '').trim();
  return t.replace(/\/$/, '') || 'http://localhost:3000';
}

function normalizeWebAppUrl(base) {
  const t = String(base ?? '').trim().replace(/\/$/, '');
  return t || DEFAULT_WEB_APP;
}

function apiUrl(base, path) {
  const b = normalizeBaseUrl(base);
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

function sameOrigin(tabUrl, webAppBase) {
  try {
    const a = new URL(tabUrl);
    const b = new URL(
      webAppBase.includes('://') ? webAppBase : `https://${webAppBase}`,
    );
    return a.origin === b.origin;
  } catch {
    return false;
  }
}

async function readApiBase() {
  const got = await chrome.storage.sync.get(STORAGE_API_BASE);
  return normalizeBaseUrl(got[STORAGE_API_BASE]);
}

async function readWebAppUrl() {
  const got = await chrome.storage.sync.get(STORAGE_WEB_APP_URL);
  const raw = got[STORAGE_WEB_APP_URL];
  if (raw != null && String(raw).trim()) {
    return normalizeWebAppUrl(raw);
  }
  return DEFAULT_WEB_APP;
}

async function readTempJwt() {
  const s = await chrome.storage.session.get(STORAGE_TEMP_JWT);
  return s[STORAGE_TEMP_JWT] ?? null;
}

async function readUserAccessToken() {
  const got = await chrome.storage.local.get(STORAGE_USER_ACCESS);
  const t = got[STORAGE_USER_ACCESS];
  return typeof t === 'string' && t.trim() ? t : null;
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
        const webAppUrl = await readWebAppUrl();
        const sess = await chrome.storage.session.get(STORAGE_TEMP_JWT);
        const tempJwt = sess[STORAGE_TEMP_JWT] ?? null;
        const userJwt = await readUserAccessToken();
        const local = await chrome.storage.local.get(STORAGE_LAST_PAIRING);
        const lastPairing = local[STORAGE_LAST_PAIRING] ?? null;
        sendResponse({
          ok: true,
          apiBaseUrl,
          webAppUrl,
          tempJwtPresent: Boolean(tempJwt),
          userJwtPresent: Boolean(userJwt),
          lastPairing,
        });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'AUTH_SET_WEB_APP_URL') {
    void (async () => {
      try {
        const v = normalizeWebAppUrl(message.webAppUrl);
        await chrome.storage.sync.set({ [STORAGE_WEB_APP_URL]: v });
        sendResponse({ ok: true, webAppUrl: v });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'AUTH_CLEAR_USER_JWT') {
    void (async () => {
      try {
        await chrome.storage.local.remove(STORAGE_USER_ACCESS);
        sendResponse({ ok: true });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'AUTH_SYNC_JWT_FROM_WEB_TABS') {
    void (async () => {
      try {
        const webBase = await readWebAppUrl();
        const tabs = await chrome.tabs.query({});
        for (const tab of tabs) {
          if (tab.id == null || !tab.url || !/^https?:/i.test(tab.url)) {
            continue;
          }
          if (!sameOrigin(tab.url, webBase)) {
            continue;
          }
          try {
            const r = await chrome.tabs.sendMessage(tab.id, {
              type: 'PASSTORE_READ_WEB_JWT',
            });
            if (r?.jwt && typeof r.jwt === 'string' && r.jwt.trim()) {
              await chrome.storage.local.set({
                [STORAGE_USER_ACCESS]: r.jwt.trim(),
              });
              sendResponse({ ok: true, tabId: tab.id });
              return;
            }
          } catch {
            /* content script no inyectado o página interna */
          }
        }
        sendResponse({
          ok: false,
          error:
            'No se encontró JWT en ninguna pestaña de la app web. Abre Passtore en el navegador, inicia sesión y vuelve a pulsar sincronizar.',
        });
      } catch (e) {
        sendResponse({ ok: false, error: String(e) });
      }
    })();
    return true;
  }

  if (message?.type === 'AUTH_OPEN_WEB_LOGIN') {
    void (async () => {
      try {
        const webBase = await readWebAppUrl();
        const u = new URL('/login', webBase.endsWith('/') ? webBase : `${webBase}/`);
        u.searchParams.set('extension', '1');
        await chrome.tabs.create({ url: u.href });
        sendResponse({ ok: true, url: u.href });
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
        const purpose = message.purpose || 'autofill';
        const userToken = await readUserAccessToken();
        const tempToken = await readTempJwt();

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

        if (userToken && purpose === 'autofill') {
          const url = apiUrl(base, '/temporary-auth/extension-autofill');
          const data = await fetchJson(url, {
            method: 'POST',
            body: JSON.stringify({
              credentialId: message.credentialId,
              requestedOrigin,
            }),
            headers: { Authorization: `Bearer ${userToken}` },
          });
          if (data.needsApproval) {
            sendResponse({
              ok: false,
              error:
                'La sesión web no usa aprobación diferida en extension-autofill; revisa propósito o política.',
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
            authMode: 'web',
          });
          return;
        }

        if (!tempToken) {
          sendResponse({
            ok: false,
            error:
              purpose !== 'autofill'
                ? 'copy/reveal requieren sesión temporal emparejada, o usa autofill con sesión web.'
                : 'Sin sesión: sincroniza desde la web o empareja sesión temporal.',
          });
          return;
        }

        const url = apiUrl(base, '/temporary-auth/deliver');
        const body = {
          credentialId: message.credentialId,
          requestedOrigin,
          purpose,
        };
        const data = await fetchJson(url, {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { Authorization: `Bearer ${tempToken}` },
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
          authMode: 'temporary',
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
