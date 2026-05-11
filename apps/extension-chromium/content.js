/**
 * Content script: canal con el background + autofill básico de usuario (texto plano).
 * La contraseña sigue cifrada en servidor; no se descifra aquí sin clave de cofre.
 */

function isVisible(el) {
  if (!(el instanceof HTMLElement)) return false;
  const s = globalThis.getComputedStyle(el);
  if (s.visibility === 'hidden' || s.display === 'none') return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
}

function findUsernameField() {
  const pwd = document.querySelector('input[type="password"]');
  const form = pwd?.closest?.('form');
  const scope = form || document;
  const selectors = [
    'input[autocomplete="username"]',
    'input[autocomplete="email"]',
    'input[type="email"]',
    'input[name*="user" i]',
    'input[name*="login" i]',
    'input[name*="email" i]',
    'input[id*="user" i]',
    'input[id*="email" i]',
    'input[type="text"]',
    'input[type="tel"]',
  ];
  for (const sel of selectors) {
    const nodes = scope.querySelectorAll(sel);
    for (const el of nodes) {
      if (el.type === 'password') continue;
      if (isVisible(el)) return el;
    }
  }
  return null;
}

const PASSTORE_WEB_JWT_KEY = 'passtore.jwt';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'PASSTORE_READ_WEB_JWT') {
    try {
      const jwt = sessionStorage.getItem(PASSTORE_WEB_JWT_KEY);
      sendResponse({ jwt: jwt && jwt.trim() ? jwt : null });
    } catch {
      sendResponse({ jwt: null });
    }
    return true;
  }

  if (message?.type === 'PAGE_PING') {
    sendResponse({
      type: 'PAGE_PONG',
      nonce: message.nonce,
      frameOrigin: location.origin,
    });
    return true;
  }

  if (message?.type === 'PASSTORE_AUTOFILL' && message.loginUsername != null) {
    const el = findUsernameField();
    if (!el) {
      sendResponse({
        ok: false,
        error: 'No se encontró un campo de usuario visible.',
      });
      return true;
    }
    el.focus();
    el.value = String(message.loginUsername);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    sendResponse({ ok: true });
    return true;
  }

  return false;
});
