import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  useApproveTemporaryDeliveryMutation,
  useApproveTemporaryPairingMutation,
  useDeliverTemporaryCredentialMutation,
  useInitTemporaryPairingMutation,
  usePollTemporaryDeliveryQuery,
  usePollTemporaryPairingQuery,
  useRegisteredDevicesQuery,
} from '@/api/passtoreApi';
import { useAuthStore } from '@/store/authStore';
import type {
  TemporaryAuthContextType,
  TemporaryCredentialRequestPurpose,
} from '@passtore/core';
import {
  clearTemporaryJwt,
  getTemporaryJwt,
  setTemporaryJwt,
} from '@/lib/temporaryAuthStorage';

function copyText(text: string) {
  void navigator.clipboard.writeText(text).then(
    () => alert('Copiado al portapapeles.'),
    () => alert('No se pudo copiar.'),
  );
}

const CONTEXTS: { value: TemporaryAuthContextType; label: string }[] = [
  { value: 'web', label: 'Web' },
  { value: 'browser', label: 'Navegador' },
  { value: 'extension', label: 'Extensión' },
  { value: 'autofill', label: 'Autofill' },
  { value: 'desktop', label: 'Escritorio' },
];

const PURPOSES: { value: TemporaryCredentialRequestPurpose; label: string }[] = [
  { value: 'autofill', label: 'Autofill' },
  { value: 'copy', label: 'Copiar (puede requerir aprobación)' },
  { value: 'reveal', label: 'Revelar (puede requerir aprobación)' },
];

export function TempAuthPairPage() {
  const userToken = useAuthStore((s) => s.accessToken);
  const [deviceName, setDeviceName] = useState('Este navegador');
  const [allowedOrigin, setAllowedOrigin] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return 'https://example.com';
  });
  const [contextType, setContextType] = useState<TemporaryAuthContextType>('web');
  const [pairing, setPairing] = useState<{
    sessionId: string;
    pairingCode: string;
    deepLink: string;
    pairingExpiresAt: string;
    qrPayload: { v: number; sid: string; code: string };
  } | null>(null);
  const [tempSaved, setTempSaved] = useState(() => !!getTemporaryJwt());
  const [devicePublicId, setDevicePublicId] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [deliveryOrigin, setDeliveryOrigin] = useState(() =>
    typeof window !== 'undefined' ? window.location.origin : '',
  );
  const [purpose, setPurpose] =
    useState<TemporaryCredentialRequestPurpose>('autofill');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);
  const [pairingPollDone, setPairingPollDone] = useState(false);
  const [searchParams] = useSearchParams();
  const appliedDeepLinkRef = useRef(false);

  useEffect(() => {
    if (appliedDeepLinkRef.current) return;
    const sid = searchParams.get('sid');
    const code = searchParams.get('code');
    if (!sid || !code) return;
    appliedDeepLinkRef.current = true;
    setPairing({
      sessionId: sid,
      pairingCode: code,
      deepLink: `passtore://temp-auth/pairing?sid=${encodeURIComponent(sid)}&code=${encodeURIComponent(code)}`,
      pairingExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      qrPayload: { v: 1, sid, code },
    });
    setPairingPollDone(false);
    setTempSaved(false);
  }, [searchParams]);

  const [initPair, { isLoading: initLoading }] = useInitTemporaryPairingMutation();
  const [approvePair, { isLoading: approveLoading }] =
    useApproveTemporaryPairingMutation();
  const [deliver, { isLoading: deliverLoading }] =
    useDeliverTemporaryCredentialMutation();
  const [approveDelivery, { isLoading: approveDelLoading }] =
    useApproveTemporaryDeliveryMutation();

  const { data: devices } = useRegisteredDevicesQuery(undefined, {
    skip: !userToken,
  });

  useEffect(() => {
    if (devices?.length && !devicePublicId) {
      setDevicePublicId(devices[0].devicePublicId);
    }
  }, [devices, devicePublicId]);

  const pollArgs = useMemo(
    () =>
      pairing
        ? { sessionId: pairing.sessionId, pairingCode: pairing.pairingCode }
        : { sessionId: '', pairingCode: '' },
    [pairing],
  );

  const { data: pollPair, error: pollPairError } = usePollTemporaryPairingQuery(
    pollArgs,
    {
      skip: !pairing?.sessionId || pairingPollDone,
      pollingInterval: 2500,
    },
  );

  useEffect(() => {
    if (
      pollPair?.status === 'active' &&
      pollPair.temporaryAccessToken
    ) {
      if (!tempSaved) {
        setTemporaryJwt(pollPair.temporaryAccessToken);
        setTempSaved(true);
      }
      setPairingPollDone(true);
    }
  }, [pollPair, tempSaved]);

  const deliveryPollArgs = pendingRequestId
    ? { requestId: pendingRequestId }
    : { requestId: '' };

  const hasTempToken = tempSaved || !!getTemporaryJwt();

  const { data: pollDel } = usePollTemporaryDeliveryQuery(deliveryPollArgs, {
    skip: !pendingRequestId || !hasTempToken,
    pollingInterval: pendingRequestId ? 2000 : 0,
  });

  useEffect(() => {
    if (!pollDel || !pendingRequestId) return;
    if (pollDel.status === 'ready') {
      setDeliveryNote(
        `Entrega lista: ${'credential' in pollDel ? pollDel.credential.alias : ''} (${'credential' in pollDel ? pollDel.credential.platformName : ''}). El ciphertext no se muestra en pantalla.`,
      );
      setPendingRequestId(null);
    } else if (pollDel.status === 'already_delivered') {
      setDeliveryNote('Esta entrega ya se consumió.');
      setPendingRequestId(null);
    } else if (pollDel.status === 'expired' || pollDel.status === 'rejected') {
      setDeliveryNote(`Estado: ${pollDel.status}`);
      setPendingRequestId(null);
    }
  }, [pollDel, pendingRequestId]);

  const startPairing = async () => {
    setDeliveryNote(null);
    try {
      const res = await initPair({
        requestingDeviceName: deviceName.trim(),
        contextType,
        allowedOrigin: allowedOrigin.trim(),
      }).unwrap();
      setPairing({
        sessionId: res.sessionId,
        pairingCode: res.pairingCode,
        deepLink: res.deepLink,
        pairingExpiresAt: res.pairingExpiresAt,
        qrPayload: res.qrPayload,
      });
      setTempSaved(false);
      setPairingPollDone(false);
    } catch (e) {
      console.error(e);
      alert('No se pudo iniciar el emparejamiento.');
    }
  };

  const approveFromWeb = async () => {
    if (!pairing || !devicePublicId.trim()) {
      alert('Selecciona un dispositivo registrado.');
      return;
    }
    try {
      await approvePair({
        sessionId: pairing.sessionId,
        body: {
          pairingCode: pairing.pairingCode,
          devicePublicId: devicePublicId.trim(),
        },
      }).unwrap();
      alert(
        'Emparejamiento aprobado desde esta cuenta. El cliente puede seguir haciendo poll hasta recibir el JWT temporal.',
      );
    } catch (e) {
      console.error(e);
      alert('No se pudo aprobar (código, dispositivo o sesión inválidos).');
    }
  };

  const requestDelivery = async () => {
    setDeliveryNote(null);
    const cid = credentialId.trim();
    if (!cid) {
      alert('Indica el UUID de la credencial.');
      return;
    }
    try {
      const res = await deliver({
        credentialId: cid,
        requestedOrigin: deliveryOrigin.trim() || window.location.origin,
        purpose,
      }).unwrap();
      if (res.needsApproval) {
        setPendingRequestId(res.requestId);
        setDeliveryNote(
          `Pendiente de aprobación en el dispositivo principal. Request: ${res.requestId}`,
        );
      } else {
        setDeliveryNote(
          `Autofill directo: ${res.credential.alias} (${res.credential.platformName}). Ciphertext recibido en cliente (no mostrado).`,
        );
      }
    } catch (e) {
      console.error(e);
      alert('No se pudo solicitar la entrega (origen, permisos o cuota).');
    }
  };

  const primaryApproveDelivery = async () => {
    if (!pendingRequestId) return;
    try {
      await approveDelivery(pendingRequestId).unwrap();
      setDeliveryNote(
        (n) =>
          (n ? `${n}\n` : '') +
          'Aprobación registrada; el cliente temporal puede seguir haciendo poll.',
      );
    } catch (e) {
      console.error(e);
      alert('No se pudo aprobar la entrega (¿ya aprobada o expirada?).');
    }
  };

  const forgetTemp = () => {
    clearTemporaryJwt();
    setTempSaved(false);
    setPairingPollDone(false);
    setPendingRequestId(null);
    setDeliveryNote(null);
  };

  const pollErr =
    pollPairError && 'status' in pollPairError
      ? String(pollPairError.status)
      : null;

  return (
    <div className="page page-wide">
      <header className="header-row">
        <div>
          <Link to="/welcome" className="muted" style={{ fontSize: '0.9rem' }}>
            ← Volver
          </Link>
          <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem' }}>
            Cliente temporal
          </h1>
          <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Inicia el emparejamiento desde este navegador y aprueba en tu app o
            cuenta principal. El JWT temporal se guarda solo en esta pestaña (
            <code>sessionStorage</code>).
          </p>
        </div>
      </header>

      <div className="card stack" style={{ marginTop: '1rem' }}>
        <strong>1. Iniciar solicitud</strong>
        <label className="stack" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Nombre del dispositivo cliente
          </span>
          <input
            className="input"
            value={deviceName}
            onChange={(e) => setDeviceName(e.target.value)}
          />
        </label>
        <label className="stack" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Origen permitido (p. ej. {window.location.origin})
          </span>
          <input
            className="input"
            value={allowedOrigin}
            onChange={(e) => setAllowedOrigin(e.target.value)}
          />
        </label>
        <label className="stack" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Contexto
          </span>
          <select
            className="input"
            value={contextType}
            onChange={(e) =>
              setContextType(e.target.value as TemporaryAuthContextType)
            }>
            {CONTEXTS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={initLoading}
          onClick={startPairing}>
          {initLoading ? 'Iniciando…' : 'Generar código de emparejamiento'}
        </button>
      </div>

      {pairing && (
        <div className="card stack" style={{ marginTop: '1rem' }}>
          <strong>2. Código y enlaces</strong>
          <p className="muted" style={{ fontSize: '0.9rem', margin: 0 }}>
            Caduca el emparejamiento:{' '}
            {new Date(pairing.pairingExpiresAt).toLocaleString()}
          </p>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              Session ID
            </div>
            <code style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {pairing.sessionId}
            </code>
          </div>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              Código (pairing)
            </div>
            <div style={{ fontWeight: 700, letterSpacing: '0.05em' }}>
              {pairing.pairingCode}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
              onClick={() => copyText(pairing.deepLink)}>
              Copiar deep link
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
              onClick={() =>
                copyText(JSON.stringify(pairing.qrPayload, null, 0))
              }>
              Copiar qrPayload JSON
            </button>
          </div>
          <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
            Estado poll:{' '}
            <strong>{pollPair?.status ?? '…'}</strong>
            {pollPair?.status === 'active' && tempSaved && (
              <> · JWT temporal guardado en esta pestaña.</>
            )}
          </p>
          {pollErr && (
            <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>
              Error de poll ({pollErr}). Revisa el código de emparejamiento.
            </p>
          )}
        </div>
      )}

      {userToken && pairing && (
        <div className="card stack" style={{ marginTop: '1rem' }}>
          <strong>Aprobar desde esta sesión (cuenta principal en web)</strong>
          <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
            Usa un dispositivo ya registrado en tu cuenta. En producción suele
            hacerse desde la app móvil con biometría.
          </p>
          {devices && devices.length > 0 ? (
            <label className="stack" style={{ gap: '0.35rem' }}>
              <span className="muted" style={{ fontSize: '0.85rem' }}>
                Dispositivo registrado (devicePublicId)
              </span>
              <select
                className="input"
                value={devicePublicId}
                onChange={(e) => setDevicePublicId(e.target.value)}>
                {devices.map((d) => (
                  <option key={d.id} value={d.devicePublicId}>
                    {d.name ?? d.devicePublicId.slice(0, 8)}…
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="muted" style={{ fontSize: '0.9rem' }}>
              No hay dispositivos registrados para esta cuenta. Usa la app o el
              flujo de sync para registrar uno.
            </p>
          )}
          <button
            type="button"
            className="btn btn-primary"
            disabled={approveLoading || !devices?.length}
            onClick={approveFromWeb}>
            {approveLoading ? 'Aprobando…' : 'Aprobar emparejamiento'}
          </button>
        </div>
      )}

      {!userToken && (
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
          <Link to="/login">Inicia sesión</Link> en esta pestaña si quieres
          aprobar el emparejamiento desde el navegador (requiere dispositivo
          registrado).
        </p>
      )}

      <div className="card stack" style={{ marginTop: '1rem' }}>
        <strong>3. JWT temporal en esta pestaña</strong>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
          {tempSaved || getTemporaryJwt()
            ? 'Hay un token temporal guardado. Las llamadas a deliver/poll lo usarán automáticamente.'
            : 'Cuando el estado del poll sea activo, el token se guardará solo.'}
        </p>
        <button
          type="button"
          className="btn btn-ghost"
          style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
          onClick={forgetTemp}
          disabled={!getTemporaryJwt() && !tempSaved}>
          Olvidar JWT temporal
        </button>
      </div>

      <div className="card stack" style={{ marginTop: '1rem' }}>
        <strong>4. Probar entrega de credencial (opcional)</strong>
        <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
          Requiere JWT temporal y un UUID de credencial existente del usuario.
          Copy/reveal pueden crear una solicitud pendiente.
        </p>
        <label className="stack" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            credentialId (UUID)
          </span>
          <input
            className="input"
            value={credentialId}
            onChange={(e) => setCredentialId(e.target.value)}
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          />
        </label>
        <label className="stack" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Origen solicitado
          </span>
          <input
            className="input"
            value={deliveryOrigin}
            onChange={(e) => setDeliveryOrigin(e.target.value)}
          />
        </label>
        <label className="stack" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            Propósito
          </span>
          <select
            className="input"
            value={purpose}
            onChange={(e) =>
              setPurpose(e.target.value as TemporaryCredentialRequestPurpose)
            }>
            {PURPOSES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-primary"
          disabled={deliverLoading || !(tempSaved || getTemporaryJwt())}
          onClick={requestDelivery}>
          {deliverLoading ? 'Solicitando…' : 'Solicitar entrega'}
        </button>
        {userToken && pendingRequestId && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
            disabled={approveDelLoading}
            onClick={primaryApproveDelivery}>
            {approveDelLoading
              ? 'Aprobando…'
              : 'Aprobar entrega desde esta cuenta (principal)'}
          </button>
        )}
        {deliveryNote && (
          <p style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
            {deliveryNote}
          </p>
        )}
      </div>

      <p style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
        <Link to="/security/temp-sessions">Gestionar sesiones temporales</Link>
        {' · '}
        <Link to="/home">Inicio</Link>
      </p>
    </div>
  );
}
