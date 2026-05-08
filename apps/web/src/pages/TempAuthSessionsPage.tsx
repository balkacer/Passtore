import { Link } from 'react-router-dom';
import {
  useRevokeAllTemporarySessionsMutation,
  useRevokeTemporarySessionMutation,
  useTemporaryAuthSessionsQuery,
} from '@/api/passtoreApi';

function statusLabel(s: string) {
  switch (s) {
    case 'active':
      return 'Activa';
    case 'pending_pairing':
      return 'Pendiente de emparejar';
    case 'revoked':
      return 'Revocada';
    case 'expired':
      return 'Expirada';
    default:
      return s;
  }
}

export function TempAuthSessionsPage() {
  const { data, isLoading, isError, refetch, isFetching } =
    useTemporaryAuthSessionsQuery();
  const [revokeOne, { isLoading: revoking }] =
    useRevokeTemporarySessionMutation();
  const [revokeAll, { isLoading: revokingAll }] =
    useRevokeAllTemporarySessionsMutation();

  const onRevoke = async (id: string) => {
    if (!confirm('¿Revocar esta sesión temporal?')) return;
    try {
      await revokeOne(id).unwrap();
    } catch (e) {
      console.error(e);
      alert('No se pudo revocar la sesión.');
    }
  };

  const onRevokeAll = async () => {
    if (!confirm('¿Revocar todas las sesiones temporales activas?')) return;
    try {
      await revokeAll().unwrap();
    } catch (e) {
      console.error(e);
      alert('No se pudo completar la revocación masiva.');
    }
  };

  return (
    <div className="page page-wide">
      <header className="header-row">
        <div>
          <Link to="/home" className="muted" style={{ fontSize: '0.9rem' }}>
            ← Inicio
          </Link>
          <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem' }}>
            Acceso temporal
          </h1>
          <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Sesiones de clientes secundarios (navegador, extensión, etc.). Revoca
            las que no reconozcas.
          </p>
        </div>
      </header>

      <div className="card stack" style={{ marginTop: '1rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
            onClick={() => refetch()}
            disabled={isFetching}>
            {isFetching ? 'Actualizando…' : 'Actualizar'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.9rem',
              color: 'var(--danger)',
              border: '1px solid rgba(220, 38, 38, 0.45)',
            }}
            disabled={revokingAll || !data?.length}
            onClick={onRevokeAll}>
            Revocar todas las activas
          </button>
        </div>

        {isLoading && <p className="muted">Cargando sesiones…</p>}
        {isError && (
          <p style={{ color: 'var(--danger)' }}>
            No se pudieron cargar las sesiones. ¿Sesión caducada?
          </p>
        )}
        {!isLoading && data && data.length === 0 && (
          <p className="muted">No hay sesiones temporales registradas.</p>
        )}
        {!isLoading && data && data.length > 0 && (
          <div className="stack" style={{ gap: '0.6rem' }}>
            {data.map((row) => (
              <div
                key={row.id}
                className="card"
                style={{
                  padding: '0.85rem 1rem',
                  boxShadow: 'none',
                  border: '1px solid rgba(127, 29, 29, 0.12)',
                }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                  }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      {row.requestingDeviceName}
                    </div>
                    <div className="muted" style={{ fontSize: '0.85rem' }}>
                      {row.contextType} · {row.allowedOrigin}
                    </div>
                    <div className="muted" style={{ fontSize: '0.8rem' }}>
                      {statusLabel(row.status)} · entregas: {row.deliveryCount}
                    </div>
                    <div className="muted" style={{ fontSize: '0.75rem' }}>
                      expira {new Date(row.expiresAt).toLocaleString()}
                    </div>
                  </div>
                  {row.status === 'active' && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{
                        padding: '0.45rem 0.75rem',
                        fontSize: '0.85rem',
                        color: 'var(--danger)',
                        border: '1px solid rgba(220, 38, 38, 0.45)',
                      }}
                      disabled={revoking}
                      onClick={() => onRevoke(row.id)}>
                      Revocar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ marginTop: '1.25rem', fontSize: '0.9rem' }}>
        <Link to="/temp-auth/pair">Emparejar un cliente temporal</Link>
      </p>
    </div>
  );
}
