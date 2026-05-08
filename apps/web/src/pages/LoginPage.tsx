import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { startAuthentication } from '@simplewebauthn/browser';
import {
  useLoginMutation,
  usePasskeyLoginOptionsMutation,
  usePasskeyLoginVerifyMutation,
} from '@/api/passtoreApi';
import { persistSession } from '@/lib/session';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pkUser, setPkUser] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const [pkOpts, { isLoading: pkOptLoading }] = usePasskeyLoginOptionsMutation();
  const [pkVerify, { isLoading: pkVerLoading }] = usePasskeyLoginVerifyMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({
        email: email.trim(),
        password,
      }).unwrap();
      persistSession(res.accessToken, res.user);
      navigate('/home', { replace: true });
    } catch {
      alert('No se pudo iniciar sesión.');
    }
  };

  const onPasskeyLogin = async () => {
    const u = pkUser.trim();
    if (!u) {
      alert('Introduce tu nombre de usuario.');
      return;
    }
    try {
      const options = await pkOpts({ username: u }).unwrap();
      const assertion = await startAuthentication({
        optionsJSON: options as never,
      });
      const res = await pkVerify({
        username: u,
        response: assertion as unknown as Record<string, unknown>,
      }).unwrap();
      persistSession(res.accessToken, res.user);
      navigate('/home', { replace: true });
    } catch (e: unknown) {
      console.error(e);
      alert(
        'Passkey: verifica usuario, que exista una passkey registrada y que RP_ID/origin coincidan con el servidor.',
      );
    }
  };

  return (
    <div className="page">
      <h1 className="heading-lg">Iniciar sesión</h1>

      <p className="heading-lg" style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>
        Solo con passkey (usuario)
      </p>
      <div className="stack">
        <input
          className="input"
          placeholder="Nombre de usuario"
          value={pkUser}
          onChange={(e) => setPkUser(e.target.value)}
          autoComplete="username"
        />
        <button
          type="button"
          className="btn btn-primary"
          disabled={pkOptLoading || pkVerLoading}
          onClick={onPasskeyLogin}>
          {pkOptLoading || pkVerLoading ? '…' : 'Entrar con passkey'}
        </button>
      </div>

      <p className="divider">o con email y contraseña</p>

      <form className="stack" onSubmit={onSubmit}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <Link to="/forgot" className="muted">
          ¿Olvidaste tu contraseña?
        </Link>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? '…' : 'Entrar'}
        </button>
      </form>
      <p className="divider">o continúa con</p>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          alert(
            'Google OAuth: integra backend + cliente según README del proyecto móvil.',
          )
        }>
        Google
      </button>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() =>
          alert('Apple Sign-In Web requiere configuración en Apple Developer.')
        }>
        Apple (web)
      </button>
      <p className="muted" style={{ marginTop: '2rem', textAlign: 'center' }}>
        <Link to="/register">¿No tienes cuenta? Crear una</Link>
      </p>
    </div>
  );
}
