import { Link, useNavigate } from 'react-router-dom';
import { startRegistration } from '@simplewebauthn/browser';
import {
  useCredentialsQuery,
  usePasskeyRegisterOptionsMutation,
  usePasskeyRegisterVerifyMutation,
} from '@/api/passtoreApi';
import { useAuthStore } from '@/store/authStore';
import { logoutSession } from '@/lib/session';
import { SecurityBadge } from '@/components/SecurityBadge';
import type { CredentialDto } from '@passtore/core';
import { scoreToSecurityIndicator } from '@/lib/passwordStrength';

function securityOf(c: CredentialDto) {
  if (c.isDuplicate) {
    return 'duplicate' as const;
  }
  if (c.strengthScore != null) {
    return scoreToSecurityIndicator(c.strengthScore, c.isDuplicate);
  }
  return 'strong' as const;
}

export function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data, refetch, isFetching } = useCredentialsQuery();
  const [regOpt, { isLoading: pkRegOpt }] = usePasskeyRegisterOptionsMutation();
  const [regVer, { isLoading: pkRegVer }] = usePasskeyRegisterVerifyMutation();

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

  const recent = (data ?? []).slice(0, 12);
  const weakCount = (data ?? []).filter(
    (c) => (c.strengthScore ?? 100) < 45 && !c.isDuplicate,
  ).length;
  const dupCount = (data ?? []).filter((c) => c.isDuplicate).length;

  const tips = [
    dupCount > 0 && 'Tienes contraseñas duplicadas.',
    weakCount > 0 && 'Refuerza las claves débiles con el generador.',
    'Evita reutilizar la misma contraseña en varios sitios.',
  ].filter(Boolean) as string[];

  return (
    <div className="page page-wide">
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

      <h2 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Recientes</h2>
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

      <div className="stack">
        {recent.length === 0 ? (
          <p className="muted">Aún no hay credenciales.</p>
        ) : (
          recent.map((c) => (
            <button
              key={c.id}
              type="button"
              className="card row-click"
              style={{
                width: '100%',
                border: 'none',
                textAlign: 'left',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
              onClick={() => navigate(`/vault/${c.id}`)}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  alignItems: 'flex-start',
                }}>
                <div>
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
              </div>
            </button>
          ))
        )}
      </div>

      <div className="card stack" style={{ marginTop: '1.5rem' }}>
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
      </div>

      <button
        type="button"
        className="fab"
        aria-label="Nueva credencial"
        onClick={() => navigate('/vault/new')}>
        +
      </button>
    </div>
  );
}
