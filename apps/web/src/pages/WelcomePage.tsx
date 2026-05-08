import { Link } from 'react-router-dom';

const BENEFITS = [
  'Guarda contraseñas de forma segura',
  'Genera contraseñas fuertes al instante',
  'Acceso desde esta web con la misma API',
  'Detecta duplicadas y claves débiles',
];

export function WelcomePage() {
  return (
    <div className="page stack">
      <div style={{ textAlign: 'center' }}>
        <div className="logo-mark" style={{ margin: '0 auto 1rem' }}>
          P
        </div>
        <h1 className="heading-xl">Passtore</h1>
        <p className="muted">
          Bóveda minimalista para credenciales — versión web.
        </p>
      </div>

      <div className="stack">
        {BENEFITS.map((line) => (
          <div key={line} style={{ display: 'flex', gap: '0.6rem' }}>
            <span style={{ color: 'var(--accent)', marginTop: 4 }}>●</span>
            <span className="muted">{line}</span>
          </div>
        ))}
      </div>

      <Link to="/register" className="btn btn-primary" style={{ textAlign: 'center' }}>
        Crear cuenta
      </Link>
      <Link to="/login" className="btn btn-ghost" style={{ textAlign: 'center' }}>
        Iniciar sesión
      </Link>
    </div>
  );
}
