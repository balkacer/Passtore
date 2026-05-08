import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCredentialQuery, useDeleteCredentialMutation } from '@/api/passtoreApi';
import { SecurityBadge } from '@/components/SecurityBadge';
import { decryptSensitive } from '@passtore/vault-crypto';
import { getVaultKey } from '@/lib/webSecureStorage';
import { scoreToSecurityIndicator } from '@/lib/passwordStrength';

export function CredentialDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data } = useCredentialQuery(id);
  const [deleteCred] = useDeleteCredentialMutation();

  const [revealed, setRevealed] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const decryptPassword = (): string | null => {
    if (!data) {
      return null;
    }
    const key = getVaultKey();
    if (!key) {
      alert('No hay clave de bóveda en este navegador.');
      return null;
    }
    try {
      return decryptSensitive(data.encryptedPassword, key);
    } catch {
      alert('No se pudo descifrar.');
      return null;
    }
  };

  const onCopy = async () => {
    const plain = decryptPassword();
    if (!plain) {
      return;
    }
    await navigator.clipboard.writeText(plain);
    window.setTimeout(() => {
      navigator.clipboard.writeText('').catch(() => {});
    }, 45_000);
    alert('Copiado. El portapapeles se limpiará en ~45s.');
  };

  const onReveal = () => {
    if (!window.confirm('¿Mostrar la contraseña temporalmente en pantalla?')) {
      return;
    }
    const plain = decryptPassword();
    if (!plain) {
      return;
    }
    setRevealed(plain);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setRevealed(null), 12_000);
  };

  const onDelete = () => {
    if (!window.confirm('¿Eliminar esta credencial?')) {
      return;
    }
    void deleteCred(id)
      .unwrap()
      .then(() => navigate('/home'))
      .catch(() => alert('No se pudo eliminar.'));
  };

  if (!data) {
    return (
      <div className="page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  const strengthScore = data.strengthScore ?? 72;
  const security = scoreToSecurityIndicator(strengthScore, data.isDuplicate);

  return (
    <div className="page">
      <p style={{ marginBottom: '1rem' }}>
        <Link to="/home">← Inicio</Link>
      </p>
      <div className="card stack">
        <h1 className="heading-lg" style={{ margin: 0 }}>
          {data.alias}
        </h1>
        <div className="muted">{data.platformName}</div>
        <div>{data.loginUsername}</div>
        {data.url ? (
          <a href={data.url} target="_blank" rel="noreferrer">
            {data.url}
          </a>
        ) : null}
        <SecurityBadge status={security} />
      </div>

      <div className="card stack">
        <span className="muted">Contraseña</span>
        <code style={{ fontSize: '1rem' }}>{revealed ?? '••••••••••••'}</code>
      </div>

      <div className="stack">
        <button type="button" className="btn btn-primary" onClick={onCopy}>
          Copiar contraseña
        </button>
        <button type="button" className="btn btn-ghost" onClick={onReveal}>
          Mostrar temporalmente
        </button>
        <Link to={`/vault/${id}/edit`} className="btn btn-ghost" style={{ textAlign: 'center' }}>
          Editar
        </Link>
        <button type="button" className="btn btn-ghost" style={{ color: 'var(--danger)' }} onClick={onDelete}>
          Eliminar
        </button>
      </div>

      <p className="muted" style={{ marginTop: '1rem' }}>
        En web no hay Face ID; la revelación usa confirmación del navegador. En móvil se usa biometría.
      </p>
    </div>
  );
}
