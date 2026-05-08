/** @type {ReturnType<typeof setInterval> | null} */
let pollTimer = null;

/** @type {ReturnType<typeof setInterval> | null} */
let deliveryPollTimer = null;

/** @type {{ deepLink?: string; qrPayload?: unknown } | null} */
let copySnapshot = null;

/** @type {string | null} */
let pendingApprovalLink = null;

function setPollStatus(text) {
  const el = document.getElementById('poll-status');
  if (el) el.textContent = text;
}

function setBridgeOut(text) {
  const el = document.getElementById('bridge-out');
  if (el) el.textContent = text;
}

function stopPoll() {
  if (pollTimer != null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function setAutofillStatus(text) {
  const el = document.getElementById('autofill-status');
  if (el) el.textContent = text;
}

function stopDeliveryPoll() {
  if (deliveryPollTimer != null) {
    clearInterval(deliveryPollTimer);
    deliveryPollTimer = null;
  }
}

const DELIVERY_POLL_MAX = 120;

function startDeliveryPoll(requestId) {
  stopDeliveryPoll();
  let n = 0;
  setAutofillStatus(
    'Polling entrega cada 2,5 s… Aprueba en el dispositivo principal si hace falta.',
  );
  deliveryPollTimer = setInterval(async () => {
    n += 1;
    if (n > DELIVERY_POLL_MAX) {
      stopDeliveryPoll();
      setAutofillStatus('Tiempo de espera agotado (poll).');
      return;
    }
    const r = await chrome.runtime.sendMessage({
      type: 'TEMP_AUTH_POLL_DELIVERY',
      requestId,
    });
    if (!r.ok) {
      setAutofillStatus(`Poll: ${r.error}${r.status != null ? ` (${r.status})` : ''}`);
      stopDeliveryPoll();
      return;
    }
    const st = r.data.status;
    if (st === 'pending') {
      setAutofillStatus(`Pendiente de aprobación… (${n}/${DELIVERY_POLL_MAX})`);
      return;
    }
    if (st === 'ready') {
      stopDeliveryPoll();
      setAutofillStatus(
        'Listo: usuario rellenado en la pestaña si había campo visible.',
      );
      return;
    }
    if (st === 'already_delivered') {
      stopDeliveryPoll();
      setAutofillStatus('Entrega ya consumida.');
      return;
    }
    if (st === 'expired' || st === 'rejected') {
      stopDeliveryPoll();
      setAutofillStatus(`Entrega: ${st}`);
      return;
    }
    stopDeliveryPoll();
    setAutofillStatus(`Estado: ${String(st)}`);
  }, 2500);
}

function updateJwtPill(tempJwtPresent) {
  const el = document.getElementById('jwt-pill');
  if (!el) return;
  el.textContent = tempJwtPresent
    ? 'JWT temporal: guardado (chrome.storage.session)'
    : 'JWT temporal: no';
  el.className = `pill ${tempJwtPresent ? 'ok' : 'warn'}`;
}

function setCopyButtonsEnabled(enabled) {
  document.getElementById('btn-copy-deeplink').disabled = !enabled;
  document.getElementById('btn-copy-qr').disabled = !enabled;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    setPollStatus('Copiado al portapapeles.');
  } catch {
    setPollStatus('No se pudo copiar.');
  }
}

async function loadState() {
  const r = await chrome.runtime.sendMessage({ type: 'TEMP_AUTH_GET_STATE' });
  if (!r.ok) {
    setPollStatus(`Estado: ${r.error}`);
    return;
  }
  const baseEl = document.getElementById('api-base-url');
  if (baseEl) baseEl.value = r.apiBaseUrl ?? '';
  updateJwtPill(Boolean(r.tempJwtPresent));
  if (r.lastPairing?.deepLink && r.lastPairing?.qrPayload) {
    copySnapshot = {
      deepLink: r.lastPairing.deepLink,
      qrPayload: r.lastPairing.qrPayload,
    };
    setCopyButtonsEnabled(true);
  }
}

async function fillAllowedOriginFromTab() {
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    const u = tab?.url;
    if (!u || !/^https?:/i.test(u)) return;
    const origin = new URL(u).origin;
    const input = document.getElementById('allowed-origin');
    if (input && !input.value.trim()) {
      input.value = origin;
    }
  } catch {
    /* ignore */
  }
}

function startPoll(sessionId, pairingCode) {
  stopPoll();
  setPollStatus('Polling cada 2,5 s…');
  pollTimer = setInterval(async () => {
    const r = await chrome.runtime.sendMessage({
      type: 'TEMP_AUTH_POLL_PAIRING',
      sessionId,
      pairingCode,
    });
    if (!r.ok) {
      setPollStatus(`Poll error: ${r.error}${r.status != null ? ` (${r.status})` : ''}`);
      stopPoll();
      return;
    }
    const d = r.data;
    setPollStatus(`Estado: ${d.status}`);
    if (d.status === 'active' && d.temporaryAccessToken) {
      stopPoll();
      setPollStatus('Sesión activa: JWT temporal guardado.');
      await loadState();
      return;
    }
    if (d.status === 'revoked' || d.status === 'expired') {
      stopPoll();
    }
  }, 2500);
}

document.addEventListener('DOMContentLoaded', async () => {
  await fillAllowedOriginFromTab();
  await loadState();
});

document.getElementById('btn-save-api')?.addEventListener('click', async () => {
  const raw = document.getElementById('api-base-url')?.value ?? '';
  const r = await chrome.runtime.sendMessage({
    type: 'TEMP_AUTH_SET_API_BASE',
    apiBaseUrl: raw,
  });
  setPollStatus(r.ok ? `API base: ${r.apiBaseUrl}` : `Error: ${r.error}`);
  await loadState();
});

document.getElementById('btn-init-pairing')?.addEventListener('click', async () => {
  stopPoll();
  stopDeliveryPoll();
  copySnapshot = null;
  setCopyButtonsEnabled(false);
  const requestingDeviceName =
    document.getElementById('device-name')?.value?.trim() ||
    'Passtore extension';
  const allowedOrigin =
    document.getElementById('allowed-origin')?.value?.trim() || '';
  if (!allowedOrigin) {
    setPollStatus('Indica el origen permitido.');
    return;
  }
  const contextType = document.getElementById('context-type')?.value || 'extension';
  const r = await chrome.runtime.sendMessage({
    type: 'TEMP_AUTH_INIT_PAIRING',
    body: {
      requestingDeviceName,
      contextType,
      allowedOrigin,
    },
  });
  if (!r.ok) {
    setPollStatus(
      `Init falló: ${r.error}${r.status != null ? ` (${r.status})` : ''}`,
    );
    return;
  }
  const data = r.data;
  copySnapshot = { deepLink: data.deepLink, qrPayload: data.qrPayload };
  setCopyButtonsEnabled(true);
  setPollStatus(
    `Sesión ${data.sessionId.slice(0, 8)}… — poll hasta activo.`,
  );
  startPoll(data.sessionId, data.pairingCode);
});

document.getElementById('btn-copy-deeplink')?.addEventListener('click', () => {
  if (copySnapshot?.deepLink) void copyText(copySnapshot.deepLink);
});

document.getElementById('btn-copy-qr')?.addEventListener('click', () => {
  if (copySnapshot?.qrPayload != null) {
    void copyText(JSON.stringify(copySnapshot.qrPayload));
  }
});

document.getElementById('btn-clear-jwt')?.addEventListener('click', async () => {
  stopPoll();
  stopDeliveryPoll();
  const r = await chrome.runtime.sendMessage({
    type: 'TEMP_AUTH_CLEAR_JWT',
  });
  setPollStatus(r.ok ? 'JWT temporal borrado.' : `Error: ${r.error}`);
  await loadState();
});

document.getElementById('ping-bg')?.addEventListener('click', async () => {
  const nonce = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  try {
    const reply = await chrome.runtime.sendMessage({ type: 'PING', nonce });
    setBridgeOut(JSON.stringify(reply, null, 2));
  } catch (e) {
    setBridgeOut(String(e));
  }
});

document.getElementById('btn-autofill')?.addEventListener('click', async () => {
  stopDeliveryPoll();
  pendingApprovalLink = null;
  const approvalBtn = document.getElementById('btn-copy-approval');
  if (approvalBtn) {
    approvalBtn.disabled = true;
    approvalBtn.onclick = null;
  }
  const credentialId =
    document.getElementById('credential-id')?.value?.trim() ?? '';
  if (!credentialId) {
    setAutofillStatus('Indica el UUID de la credencial.');
    return;
  }
  const purpose =
    document.getElementById('deliver-purpose')?.value || 'autofill';
  const r = await chrome.runtime.sendMessage({
    type: 'TEMP_AUTH_AUTOFILL_ACTIVE_TAB',
    credentialId,
    purpose,
  });
  if (!r.ok) {
    setAutofillStatus(
      `Error: ${r.error}${r.status != null ? ` (${r.status})` : ''}`,
    );
    return;
  }
  if (r.filled) {
    setAutofillStatus(
      `${r.warn ? `${r.warn} ` : ''}Usuario rellenado · ${r.alias ?? '?'} (${r.platformName ?? '—'})`,
    );
    return;
  }
  if (r.needsApproval && r.data?.requestId) {
    pendingApprovalLink = r.data.approvalDeepLink ?? '';
    if (approvalBtn) {
      approvalBtn.disabled = !pendingApprovalLink;
      approvalBtn.onclick = async () => {
        if (pendingApprovalLink) {
          try {
            await navigator.clipboard.writeText(pendingApprovalLink);
            setAutofillStatus('Enlace de aprobación copiado.');
          } catch {
            setAutofillStatus('No se pudo copiar el enlace.');
          }
        }
      };
    }
    setAutofillStatus(
      `Pendiente de aprobación · requestId ${r.data.requestId}`,
    );
    startDeliveryPoll(r.data.requestId);
    return;
  }
  setAutofillStatus('Respuesta inesperada del servidor.');
});

document.getElementById('ping-tab')?.addEventListener('click', async () => {
  const nonce = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (tab?.id == null) {
      setBridgeOut('No hay pestaña activa.');
      return;
    }
    const reply = await chrome.tabs.sendMessage(tab.id, {
      type: 'PAGE_PING',
      nonce,
    });
    setBridgeOut(JSON.stringify(reply, null, 2));
  } catch (e) {
    setBridgeOut(String(e));
  }
});
