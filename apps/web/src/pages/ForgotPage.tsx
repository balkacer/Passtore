import { useState } from 'react';
import { useForgotPasswordMutation } from '@/api/passtoreApi';

export function ForgotPage() {
  const [email, setEmail] = useState('');
  const [forgot, { isLoading }] = useForgotPasswordMutation();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await forgot({ email: email.trim() }).unwrap();
      alert(res.message);
    } catch {
      alert('No se pudo enviar la solicitud.');
    }
  };

  return (
    <div className="page">
      <h1 className="heading-lg">Recuperar acceso</h1>
      <p className="muted">
        Recibirás instrucciones si existe una cuenta (mock en MVP).
      </p>
      <form className="stack" onSubmit={onSubmit}>
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? '…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
