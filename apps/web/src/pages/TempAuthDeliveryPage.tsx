import { Link, useSearchParams } from 'react-router-dom';
import { useApproveTemporaryDeliveryMutation } from '@/api/passtoreApi';
import { useAuthStore } from '@/store/authStore';

/** Pantalla mínima para aprobar una entrega temporal desde deep link (escritorio / web). */
export function TempAuthDeliveryPage() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('requestId')?.trim() ?? '';
  const token = useAuthStore((s) => s.accessToken);
  const [approve, { isLoading }] = useApproveTemporaryDeliveryMutation();

  const onApprove = async () => {
    if (!requestId) return;
    try {
      await approve(requestId).unwrap();
      alert('Entrega aprobada.');
    } catch (e) {
      console.error(e);
      alert('No se pudo aprobar (¿sesión, expiración o ya procesado?).');
    }
  };

  return (
    <div className="page page-wide">
      <header className="header-row">
        <div>
          <Link to="/welcome" className="muted" style={{ fontSize: '0.9rem' }}>
            ← Volver
          </Link>
          <h1 style={{ margin: '0.35rem 0 0', fontSize: '1.35rem' }}>
            Aprobar entrega temporal
          </h1>
          <p className="muted" style={{ margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
            Abre este flujo desde el enlace <code>passtore://temp-auth/delivery</code>{' '}
            cuando un cliente secundario solicita una credencial sensible.
          </p>
        </div>
      </header>

      <div className="card stack" style={{ marginTop: '1rem' }}>
        <label className="stack" style={{ gap: '0.35rem' }}>
          <span className="muted" style={{ fontSize: '0.85rem' }}>
            requestId
          </span>
          <code style={{ fontSize: '0.85rem', wordBreak: 'break-all' }}>
            {requestId || '(vacío — abre desde deep link)'}
          </code>
        </label>

        {!token && (
          <p className="muted" style={{ fontSize: '0.9rem' }}>
            <Link to="/login">Inicia sesión</Link> como cuenta principal para
            aprobar.
          </p>
        )}

        <button
          type="button"
          className="btn btn-primary"
          disabled={isLoading || !requestId || !token}
          onClick={onApprove}>
          {isLoading ? 'Aprobando…' : 'Aprobar entrega'}
        </button>
      </div>

      <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
        <Link to="/home">Inicio</Link>
      </p>
    </div>
  );
}
