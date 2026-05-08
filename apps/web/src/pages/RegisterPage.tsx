import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '@/api/passtoreApi';
import { persistSession } from '@/lib/session';

export function RegisterPage() {
  const navigate = useNavigate();
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
      navigate('/home', { replace: true });
    } catch {
      alert('No se pudo crear la cuenta.');
    }
  };

  return (
    <div className="page">
      <h1 className="heading-lg">Crear cuenta</h1>
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
        <Link to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
      </p>
    </div>
  );
}
