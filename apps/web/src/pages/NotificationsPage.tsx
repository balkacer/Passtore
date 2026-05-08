import { Link } from 'react-router-dom';
import { useCredentialsQuery } from '@/api/passtoreApi';

export function NotificationsPage() {
  const { data } = useCredentialsQuery();

  const weak = (data ?? []).filter((c) => (c.strengthScore ?? 100) < 45);
  const dup = (data ?? []).filter((c) => c.isDuplicate);
  const old = (data ?? []).filter((c) => {
    const created = new Date(c.createdAt).getTime();
    return Date.now() - created > 1000 * 60 * 60 * 24 * 180;
  });

  const items = [
    ...weak.map((c) => ({
      key: `w-${c.id}`,
      title: 'Contraseña débil',
      body: `${c.alias} podría fortalecerse.`,
    })),
    ...dup.map((c) => ({
      key: `d-${c.id}`,
      title: 'Posible duplicada',
      body: `${c.alias} reutiliza una clave.`,
    })),
    ...old.map((c) => ({
      key: `o-${c.id}`,
      title: 'Antigua',
      body: `${c.alias} lleva tiempo sin actualizarse.`,
    })),
    {
      key: 'tip',
      title: 'Recomendación',
      body: 'Usa HTTPS y cierra sesión en equipos compartidos.',
    },
  ];

  return (
    <div className="page">
      <p className="muted" style={{ marginBottom: '0.75rem' }}>
        <Link to="/home">← Inicio</Link>
      </p>
      <h1 className="heading-lg">Notificaciones</h1>
      <p className="muted">Basado en datos locales sincronizados con la API.</p>
      <div className="stack" style={{ marginTop: '1rem' }}>
        {items.map((n) => (
          <div key={n.key} className="card">
            <strong>{n.title}</strong>
            <p className="muted" style={{ margin: '0.35rem 0 0' }}>
              {n.body}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
