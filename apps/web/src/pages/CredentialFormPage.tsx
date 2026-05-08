import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  useCreateCredentialMutation,
  useCredentialQuery,
  useCredentialsQuery,
  useUpdateCredentialMutation,
} from '@/api/passtoreApi';
import type { CreateCredentialBody } from '@passtore/core';
import { PasswordGenerator } from '@/components/PasswordGenerator';
import { decryptSensitive, encryptSensitive } from '@passtore/vault-crypto';
import { ensureVaultKey } from '@/lib/webSecureStorage';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';
import { resolveFaviconUrl } from '@/lib/favicon';
import { isPlainPasswordDuplicate } from '@/lib/vaultDuplicate';

export function CredentialFormPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const isNew = location.pathname === '/vault/new';
  const credentialId = isNew ? undefined : params.id;

  const { data: existing } = useCredentialQuery(credentialId ?? '', {
    skip: !credentialId,
  });
  const { data: all } = useCredentialsQuery();

  const [alias, setAlias] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [url, setUrl] = useState('');
  const [loginUsername, setLoginUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [category, setCategory] = useState('');
  const [iconUrl, setIconUrl] = useState<string | null>(null);

  const [createCred, { isLoading: creating }] = useCreateCredentialMutation();
  const [updateCred, { isLoading: updating }] = useUpdateCredentialMutation();

  useEffect(() => {
    if (!existing) {
      return;
    }
    setAlias(existing.alias);
    setPlatformName(existing.platformName);
    setUrl(existing.url ?? '');
    setLoginUsername(existing.loginUsername);
    setCategory(existing.category ?? '');
    setIconUrl(existing.iconUrl);
    try {
      const key = ensureVaultKey();
      if (existing.notesEncrypted) {
        setNotes(decryptSensitive(existing.notesEncrypted, key));
      }
    } catch {
      /* ignore */
    }
  }, [existing]);

  const onBlurUrl = () => {
    setIconUrl(resolveFaviconUrl(url));
  };

  const loading = creating || updating;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim() || !platformName.trim() || !loginUsername.trim()) {
      return;
    }
    if (!credentialId && !password.trim()) {
      alert('Introduce una contraseña o úsala del generador.');
      return;
    }

    const vaultKey = ensureVaultKey();
    const trimPwd = password.trim();
    const strength = evaluatePasswordStrength(trimPwd || 'aaaa');
    const duplicate =
      trimPwd.length > 0
        ? isPlainPasswordDuplicate(trimPwd, vaultKey, all ?? [], credentialId)
        : false;

    const notesCipher = notes.trim()
      ? encryptSensitive(notes.trim(), vaultKey)
      : undefined;

    try {
      if (credentialId && existing) {
        const patch: Partial<CreateCredentialBody> = {
          alias: alias.trim(),
          platformName: platformName.trim(),
          url: url.trim() || undefined,
          loginUsername: loginUsername.trim(),
          iconUrl: iconUrl ?? undefined,
          notesEncrypted: notesCipher,
          category: category.trim() || undefined,
          strengthScore: trimPwd ? strength.score : existing.strengthScore ?? undefined,
          isDuplicate: trimPwd ? duplicate : existing.isDuplicate,
        };
        if (trimPwd) {
          patch.encryptedPassword = encryptSensitive(trimPwd, vaultKey);
        }
        await updateCred({ id: credentialId, patch }).unwrap();
      } else {
        await createCred({
          alias: alias.trim(),
          platformName: platformName.trim(),
          url: url.trim() || undefined,
          loginUsername: loginUsername.trim(),
          encryptedPassword: encryptSensitive(trimPwd, vaultKey),
          iconUrl: iconUrl ?? undefined,
          notesEncrypted: notesCipher,
          strengthScore: strength.score,
          isDuplicate: duplicate,
          category: category.trim() || undefined,
        }).unwrap();
      }
      navigate('/home');
    } catch {
      alert('No se pudo guardar.');
    }
  };

  return (
    <div className="page">
      <p className="muted" style={{ marginBottom: '1rem' }}>
        <Link to="/home">← Inicio</Link>
      </p>
      <h1 className="heading-lg">
        {credentialId ? 'Editar credencial' : 'Nueva credencial'}
      </h1>
      <form className="stack" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Alias"
          value={alias}
          onChange={(e) => setAlias(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="Plataforma / app"
          value={platformName}
          onChange={(e) => setPlatformName(e.target.value)}
          required
        />
        <input
          className="input"
          placeholder="URL https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={onBlurUrl}
        />
        <input
          className="input"
          placeholder="Usuario o email"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder={
            credentialId ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña'
          }
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />

        <p className="heading-lg" style={{ fontSize: '1.1rem', marginTop: '0.5rem' }}>
          Generador
        </p>
        <PasswordGenerator onUsePassword={setPassword} />

        <textarea
          className="input"
          placeholder="Notas opcionales"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
        <input
          className="input"
          placeholder="Categoría opcional"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? '…' : 'Guardar'}
        </button>
      </form>
    </div>
  );
}
