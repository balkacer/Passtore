import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useRegisterMutation } from '@/api/passtoreApi';
import { persistSession } from '@/lib/session';

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromExtension = searchParams.get('extension') === '1';
  const postAuthPath = useMemo(
    () => (fromExtension ? '/home?fromExtension=1' : '/home'),
    [fromExtension],
  );
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [register, { isLoading }] = useRegisterMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await register({
        email: email.trim(),
        username: username.trim(),
        password,
      }).unwrap();
      persistSession(res.accessToken, res.user);
      navigate(postAuthPath, { replace: true });
    } catch {
      alert('No se pudo crear la cuenta.');
    }
  };

  return (
    <div className="page">
      <h1 className="heading-lg">Crear cuenta</h1>
      {fromExtension ? (
        <p className="muted" style={{ marginBottom: '1rem' }}>
          Cuando termines, abre la extensión y pulsa{' '}
          <strong>Sincronizar sesión desde la web</strong>.
        </p>
      ) : null}
      <form className="stack" onSubmit={onSubmit}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Contraseña (mín. 8)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? '…' : 'Registrarme'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to={fromExtension ? '/login?extension=1' : '/login'}>
          ¿Ya tienes cuenta? Inicia sesión
        </Link>
      </p>
    </div>
  );
}
