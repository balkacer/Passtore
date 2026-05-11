import { useEffect, useState, type MouseEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import {
  useCredentialsQuery,
  usePasskeyRegisterOptionsMutation,
  usePasskeyRegisterVerifyMutation,
} from '@/api/passtoreApi';
import { useAuthStore } from '@/store/authStore';
import { logoutSession } from '@/lib/session';
import { SecurityBadge } from '@/components/SecurityBadge';
import { CredentialFavicon } from '@/components/CredentialFavicon';
import { copyCredentialPassword } from '@/lib/credentialClipboard';
import type { CredentialDto } from '@passtore/core';
import { scoreToSecurityIndicator } from '@/lib/passwordStrength';
import { USE_LOCAL_VAULT, USE_SYNC_OUTBOX } from '@/config/featureFlags';
import { runFullVaultSync } from '@/services/sync/syncManualService';

const VIEW_STORAGE_KEY = 'passtore_credentials_view';

type ViewMode = 'list' | 'grid';

function securityOf(c: CredentialDto) {
  if (c.isDuplicate) {
    return 'duplicate' as const;
  }
  if (c.strengthScore != null) {
    return scoreToSecurityIndicator(c.strengthScore, c.isDuplicate);
  }
  return 'strong' as const;
}

function readInitialView(): ViewMode {
  try {
    const v = localStorage.getItem(VIEW_STORAGE_KEY);
    return v === 'grid' ? 'grid' : 'list';
  } catch {
    return 'list';
  }
}

export function HomePage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [dismissExtBanner, setDismissExtBanner] = useState(false);
  const showExtBanner =
    searchParams.get('fromExtension') === '1' && !dismissExtBanner;

  const dismissExtensionBanner = () => {
    setDismissExtBanner(true);
    const next = new URLSearchParams(searchParams);
    next.delete('fromExtension');
    setSearchParams(next, { replace: true });
  };

  const user = useAuthStore((s) => s.user);
  const { data, refetch, isFetching } = useCredentialsQuery();
  const [regOpt, { isLoading: pkRegOpt }] = usePasskeyRegisterOptionsMutation();
  const [regVer, { isLoading: pkRegVer }] = usePasskeyRegisterVerifyMutation();
  const [view, setView] = useState<ViewMode>(readInitialView);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [syncBusy, setSyncBusy] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_STORAGE_KEY, view);
    } catch {
      /* ignore */
    }
  }, [view]);

  useEffect(() => {
    if (!copyFeedback) {
      return;
    }
    const t = window.setTimeout(() => setCopyFeedback(null), 2500);
    return () => window.clearTimeout(t);
  }, [copyFeedback]);

  const addPasskey = async () => {
    try {
      const opts = await regOpt().unwrap();
      const att = await startRegistration({ optionsJSON: opts as never });
      await regVer({
        response: att as unknown as Record<string, unknown>,
      }).unwrap();
      alert('Passkey registrada en este navegador.');
    } catch (e) {
      console.error(e);
      alert(
        'No se pudo registrar la passkey (HTTPS, mismo dominio que RP_ID, sin bloqueos del navegador).',
      );
    }
  };

  const rows = data ?? [];
  const weakCount = rows.filter(
    (c) => (c.strengthScore ?? 100) < 45 && !c.isDuplicate,
  ).length;
  const dupCount = rows.filter((c) => c.isDuplicate).length;

  const tips = [
    dupCount > 0 && 'Tienes contraseñas duplicadas.',
    weakCount > 0 && 'Refuerza las claves débiles con el generador.',
    'Evita reutilizar la misma contraseña en varios sitios.',
  ].filter(Boolean) as string[];

  const onCopyPassword = async (e: MouseEvent<HTMLButtonElement>, c: CredentialDto) => {
    e.preventDefault();
    e.stopPropagation();
    const r = await copyCredentialPassword(c);
    if (!r.ok) {
      if (r.reason === 'no_vault_key') {
        setCopyFeedback('Desbloquea el cofre en la app o vuelve a iniciar sesión.');
      } else if (r.reason === 'decrypt_failed') {
        setCopyFeedback('No se pudo descifrar (clave de cofre distinta).');
      } else {
        setCopyFeedback('No se pudo copiar al portapapeles.');
      }
      return;
    }
    setCopyFeedback('Contraseña copiada (portapapeles ~45s).');
  };

  const onVaultSync = async () => {
    setSyncBusy(true);
    const r = await runFullVaultSync();
    setSyncBusy(false);
    if (!r.ok) {
      setCopyFeedback(r.message);
      return;
    }
    setCopyFeedback('Cofre sincronizado.');
    void refetch();
  };

  return (
    <div className="page page-home">
      {showExtBanner ? (
        <div
          className="card stack"
          role="status"
          style={{
            marginBottom: '1rem',
            border: '1px solid rgba(127, 29, 29, 0.35)',
            background: 'rgba(254, 242, 242, 0.95)',
          }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '0.75rem',
              alignItems: 'flex-start',
            }}>
            <p className="muted" style={{ margin: 0 }}>
              <strong>Extensión del navegador:</strong> abre el icono de Passtore y pulsa{' '}
              <strong>Sincronizar sesión desde la web</strong>. Mantén esta pestaña abierta.
            </p>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ flexShrink: 0, fontSize: '0.85rem' }}
              onClick={dismissExtensionBanner}>
              Cerrar
            </button>
          </div>
        </div>
      ) : null}
      <header className="header-row">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="logo-mark">P</div>
          <div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>
              Hola,
            </div>
            <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
              {user?.username ?? 'Passtore'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
            disabled={pkRegOpt || pkRegVer}
            onClick={addPasskey}>
            + Passkey
          </button>
          {USE_LOCAL_VAULT && USE_SYNC_OUTBOX ? (
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem' }}
              disabled={syncBusy}
              title="Subir cambios locales y traer actualizaciones de otros dispositivos"
              onClick={() => void onVaultSync()}>
              {syncBusy ? '…' : 'Sincronizar'}
            </button>
          ) : null}
          <Link
            to="/security/temp-sessions"
            aria-label="Acceso temporal"
            title="Acceso temporal">
            🔑
          </Link>
          <Link to="/notifications" aria-label="Notificaciones">
            🔔
          </Link>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.35rem 0.5rem' }}
            onClick={() => logoutSession()}>
            Salir
          </button>
        </div>
      </header>

      <aside className="card stack tips-panel" aria-label="Consejos de seguridad">
        <strong>Consejos</strong>
        {tips.map((t) => (
          <div key={t} className="muted">
            • {t}
          </div>
        ))}
        <div className="muted" style={{ marginTop: '0.35rem', fontSize: '0.9rem' }}>
          •{' '}
          <Link to="/temp-auth/pair">Cliente temporal</Link> ·{' '}
          <Link to="/security/temp-sessions">Sesiones temporales</Link>
        </div>
      </aside>

      <div className="credentials-toolbar">
        <div className="credentials-toolbar-left">
          <h2 className="credentials-heading">Credenciales</h2>
          <div
            className="view-toggle"
            role="group"
            aria-label="Vista de credenciales">
            <button
              type="button"
              className={view === 'list' ? 'is-active' : ''}
              onClick={() => setView('list')}>
              Lista
            </button>
            <button
              type="button"
              className={view === 'grid' ? 'is-active' : ''}
              onClick={() => setView('grid')}>
              Cuadrícula
            </button>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-primary credentials-new-btn"
          onClick={() => navigate('/vault/new')}>
          + Nueva credencial
        </button>
      </div>

      <button
        type="button"
        className="muted"
        style={{
          border: 'none',
          background: 'none',
          cursor: 'pointer',
          marginBottom: '0.75rem',
        }}
        onClick={() => refetch()}
        disabled={isFetching}>
        {isFetching ? 'Actualizando…' : 'Actualizar lista'}
      </button>

      {copyFeedback ? (
        <p className="copy-toast" role="status">
          {copyFeedback}
        </p>
      ) : null}

      {view === 'list' ? (
        <div className="stack credential-stack">
          {rows.length === 0 ? (
            <p className="muted">Aún no hay credenciales.</p>
          ) : (
            rows.map((c) => (
              <div key={c.id} className="card credential-row">
                <button
                  type="button"
                  className="credential-row-main row-click"
                  onClick={() => navigate(`/vault/${c.id}`)}>
                  <CredentialFavicon
                    iconUrl={c.iconUrl}
                    url={c.url}
                    alias={c.alias}
                    size={44}
                  />
                  <div className="credential-row-text">
                    <div style={{ fontWeight: 700 }}>{c.alias}</div>
                    <div className="muted" style={{ fontSize: '0.9rem' }}>
                      {c.loginUsername}
                    </div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      {c.platformName}
                      {c.url ? ` · ${c.url}` : ''}
                    </div>
                  </div>
                  <SecurityBadge status={securityOf(c)} />
                </button>
                <button
                  type="button"
                  className="btn-credential-copy"
                  aria-label={`Copiar contraseña de ${c.alias}`}
                  title="Copiar contraseña"
                  onClick={(e) => void onCopyPassword(e, c)}>
                  Copiar
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="credential-grid">
          {rows.length === 0 ? (
            <p className="muted credential-grid-empty">Aún no hay credenciales.</p>
          ) : (
            rows.map((c) => (
              <div key={c.id} className="card credential-tile">
                <button
                  type="button"
                  className="credential-tile-main row-click"
                  onClick={() => navigate(`/vault/${c.id}`)}>
                  <CredentialFavicon
                    iconUrl={c.iconUrl}
                    url={c.url}
                    alias={c.alias}
                    size={52}
                  />
                  <div className="credential-tile-text">
                    <div className="credential-tile-alias">{c.alias}</div>
                    <div className="muted credential-tile-login">{c.loginUsername}</div>
                    <div className="muted credential-tile-platform">{c.platformName}</div>
                  </div>
                  <div className="credential-tile-badge">
                    <SecurityBadge status={securityOf(c)} />
                  </div>
                </button>
                <div className="credential-tile-footer">
                  <button
                    type="button"
                    className="btn btn-ghost btn-tile-copy"
                    aria-label={`Copiar contraseña de ${c.alias}`}
                    onClick={(e) => void onCopyPassword(e, c)}>
                    Copiar contraseña
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
}
