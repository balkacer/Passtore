import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { apiDelete, apiGetJson, apiPostJson, pullSyncPage } from '../client.js';
import { loadConfig } from '../config.js';
import { decryptSensitive, encryptSensitive } from '@passtore/vault-crypto';
import {
  defaultGeneratorOptions,
  generatePassword,
  parseGeneratorOpts,
} from '../passwordGenerator.js';
import { evaluatePasswordStrength } from '../passwordStrength.js';
import { isPlainPasswordDuplicate } from '../vaultDuplicate.js';
import type { CredentialDto } from '@passtore/core';

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function ChromeBar(): React.ReactElement {
  const { baseUrl, token, vaultKey } = loadConfig();
  const apiOk = Boolean(token);
  const vaultOk = Boolean(vaultKey);
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box
        borderStyle="round"
        borderColor="cyan"
        paddingX={2}
        justifyContent="space-between"
      >
        <Box>
          <Text bold color="cyan">
            Passtore
          </Text>
          <Text dimColor> ▸ </Text>
          <Text dimColor>{truncate(baseUrl, 42)}</Text>
        </Box>
        <Box gap={2}>
          <Text color={apiOk ? 'green' : 'yellow'}>
            {apiOk ? '● API' : '○ API'}
          </Text>
          <Text color={vaultOk ? 'green' : 'yellow'}>
            {vaultOk ? '● cofre' : '○ cofre'}
          </Text>
        </Box>
      </Box>
      <Text dimColor>
        ↑↓ seleccionar · Enter confirmar · Esc atrás · Ctrl+C salir
      </Text>
    </Box>
  );
}

type StackScreen =
  | 'home'
  | 'vault'
  | 'vault-list'
  | 'vault-show'
  | 'vault-add'
  | 'vault-delete'
  | 'password'
  | 'password-gen'
  | 'password-strength'
  | 'password-dup'
  | 'sync'
  | 'devices';

export function TuiApp(): React.ReactElement {
  const [stack, setStack] = useState<StackScreen[]>(['home']);

  const push = useCallback((s: StackScreen) => {
    setStack((st) => [...st, s]);
  }, []);

  const pop = useCallback(() => {
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  }, []);

  useInput((_input, key) => {
    if (key.escape) {
      pop();
    }
  });

  const screen = stack[stack.length - 1];

  const body = useMemo(() => {
    switch (screen) {
      case 'home':
        return (
          <HomeMenu
            onVault={() => push('vault')}
            onPassword={() => push('password')}
            onSync={() => push('sync')}
            onDevices={() => push('devices')}
          />
        );
      case 'vault':
        return (
          <VaultRootMenu
            onList={() => push('vault-list')}
            onShow={() => push('vault-show')}
            onAdd={() => push('vault-add')}
            onDelete={() => push('vault-delete')}
          />
        );
      case 'vault-list':
        return <VaultListScreen />;
      case 'vault-show':
        return <VaultShowScreen />;
      case 'vault-add':
        return <VaultAddScreen />;
      case 'vault-delete':
        return <VaultDeleteScreen />;
      case 'password':
        return (
          <PasswordRootMenu
            onGen={() => push('password-gen')}
            onStrength={() => push('password-strength')}
            onDup={() => push('password-dup')}
          />
        );
      case 'password-gen':
        return <PasswordGenScreen />;
      case 'password-strength':
        return <PasswordStrengthScreen />;
      case 'password-dup':
        return <PasswordDupScreen />;
      case 'sync':
        return <SyncScreen />;
      case 'devices':
        return <DevicesScreen />;
      default:
        return <Text>?</Text>;
    }
  }, [screen, push]);

  return (
    <Box flexDirection="column" padding={1}>
      <ChromeBar />
      {body}
    </Box>
  );
}

function HomeMenu(props: {
  onVault: () => void;
  onPassword: () => void;
  onSync: () => void;
  onDevices: () => void;
}): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        Inicio
      </Text>
      <SelectInput
        indicatorComponent={({ isSelected }) => (
          <Text color={isSelected ? 'cyan' : 'gray'}>{isSelected ? '❯' : ' '}</Text>
        )}
        items={[
          { label: '🗝️  Cofre — ver y editar credenciales', value: 'vault' },
          { label: '🔐 Contraseña — generar, fuerza, duplicados', value: 'pwd' },
          { label: '☁️  Sync — eventos opacos', value: 'sync' },
          { label: '📱 Dispositivos', value: 'dev' },
        ]}
        onSelect={(item) => {
          if (item.value === 'vault') props.onVault();
          if (item.value === 'pwd') props.onPassword();
          if (item.value === 'sync') props.onSync();
          if (item.value === 'dev') props.onDevices();
        }}
      />
    </Box>
  );
}

function VaultRootMenu(props: {
  onList: () => void;
  onShow: () => void;
  onAdd: () => void;
  onDelete: () => void;
}): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        Cofre
      </Text>
      <SelectInput
        indicatorComponent={({ isSelected }) => (
          <Text color={isSelected ? 'cyan' : 'gray'}>{isSelected ? '❯' : ' '}</Text>
        )}
        items={[
          { label: '📋 Listar entradas', value: 'list' },
          { label: '🔎 Ver por ID (revelar opcional)', value: 'show' },
          { label: '➕ Añadir entrada', value: 'add' },
          { label: '🗑️  Eliminar por ID', value: 'del' },
        ]}
        onSelect={(item) => {
          if (item.value === 'list') props.onList();
          if (item.value === 'show') props.onShow();
          if (item.value === 'add') props.onAdd();
          if (item.value === 'del') props.onDelete();
        }}
      />
    </Box>
  );
}

function VaultListScreen(): React.ReactElement {
  const [phase, setPhase] = useState<'loading' | 'ok' | 'err'>('loading');
  const [rows, setRows] = useState<CredentialDto[]>([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    const { baseUrl, token } = loadConfig();
    if (!token) {
      setPhase('err');
      setErr('Configura PASSTORE_TOKEN en el entorno.');
      return;
    }
    void apiGetJson(baseUrl, token, '/credentials')
      .then((data) => {
        setRows(data as CredentialDto[]);
        setPhase('ok');
      })
      .catch((e: unknown) => {
        setPhase('err');
        setErr(e instanceof Error ? e.message : String(e));
      });
  }, []);

  if (phase === 'loading') {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Cargando cofre…</Text>
      </Box>
    );
  }
  if (phase === 'err') {
    return (
      <Box flexDirection="column">
        <Text color="red">{err}</Text>
      </Box>
    );
  }
  if (rows.length === 0) {
    return <Text dimColor>(sin credenciales)</Text>;
  }
  return (
    <Box flexDirection="column">
      <Text bold>{rows.length} entradas</Text>
      <Box flexDirection="column" marginTop={1}>
        <Text dimColor>
          {'alias'.padEnd(22)} {'plataforma'.padEnd(18)} usuario
        </Text>
        {rows.slice(0, 40).map((c) => (
          <Text key={c.id}>
            <Text color="gray">{truncate(c.id, 8)} </Text>
            {truncate(c.alias, 20).padEnd(22)}{' '}
            {truncate(c.platformName, 16).padEnd(18)}{' '}
            {truncate(c.loginUsername, 24)}
          </Text>
        ))}
        {rows.length > 40 ? (
          <Text dimColor>… y {rows.length - 40} más (usa JSON en CLI)</Text>
        ) : null}
      </Box>
    </Box>
  );
}

function VaultShowScreen(): React.ReactElement {
  const [id, setId] = useState('');
  const [step, setStep] = useState<
    'id' | 'reveal' | 'fetching' | 'result'
  >('id');
  const [reveal, setReveal] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (step !== 'fetching' || reveal === null || !id.trim()) return;

    const { baseUrl, token, vaultKey } = loadConfig();
    if (!token) {
      setErr('Falta PASSTORE_TOKEN');
      setStep('result');
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const data = (await apiGetJson(
          baseUrl,
          token,
          `/credentials/${id.trim()}`,
        )) as CredentialDto;
        if (cancelled) return;
        if (reveal) {
          if (!vaultKey) {
            setErr('Falta PASSTORE_VAULT_KEY para revelar.');
            setText(JSON.stringify(data, null, 2));
            setStep('result');
            return;
          }
          let pwd = '';
          let notes = '';
          try {
            pwd = decryptSensitive(data.encryptedPassword, vaultKey);
          } catch {
            pwd = '(error al descifrar)';
          }
          if (data.notesEncrypted) {
            try {
              notes = decryptSensitive(data.notesEncrypted, vaultKey);
            } catch {
              notes = '(error)';
            }
          }
          setText(
            JSON.stringify(
              {
                id: data.id,
                alias: data.alias,
                platformName: data.platformName,
                url: data.url,
                loginUsername: data.loginUsername,
                category: data.category,
                passwordPlain: pwd,
                notesPlain: notes || undefined,
                updatedAt: data.updatedAt,
              },
              null,
              2,
            ),
          );
        } else {
          const safe = { ...data };
          delete (safe as { encryptedPassword?: string }).encryptedPassword;
          safe.notesEncrypted = safe.notesEncrypted ? '(cifrado)' : null;
          setText(JSON.stringify(safe, null, 2));
        }
        setStep('result');
      } catch (e: unknown) {
        if (!cancelled) {
          setErr(e instanceof Error ? e.message : String(e));
          setStep('result');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [step, reveal, id]);

  if (step === 'id') {
    return (
      <Box flexDirection="column">
        <Text>UUID de la credencial:</Text>
        <TextInput
          value={id}
          onChange={setId}
          placeholder="pega el id…"
          onSubmit={(v) => {
            if (!v.trim()) return;
            setId(v.trim());
            setStep('reveal');
          }}
        />
      </Box>
    );
  }

  if (step === 'reveal') {
    return (
      <Box flexDirection="column">
        <Text>¿Revelar contraseña y notas? (requiere PASSTORE_VAULT_KEY)</Text>
        <SelectInput
          items={[
            { label: 'Sí — descifrar', value: 'y' },
            { label: 'No — solo metadatos', value: 'n' },
          ]}
          onSelect={(item) => {
            setReveal(item.value === 'y');
            setStep('fetching');
          }}
        />
      </Box>
    );
  }

  if (step === 'fetching') {
    return (
      <Box>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Leyendo…</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {err ? <Text color="red">{err}</Text> : null}
      <Text>{text}</Text>
    </Box>
  );
}

function VaultAddScreen(): React.ReactElement {
  const [alias, setAlias] = useState('');
  const [platform, setPlatform] = useState('');
  const [login, setLogin] = useState('');
  const [stage, setStage] = useState(0);
  const [pwdMode, setPwdMode] = useState<'plain' | 'gen' | null>(null);
  const [pwdPlain, setPwdPlain] = useState('');
  const [genLen, setGenLen] = useState('18');
  const [status, setStatus] = useState('');
  const [err, setErr] = useState('');

  const submitCreate = useCallback(
    async (plain: string) => {
      const { baseUrl, token, vaultKey } = loadConfig();
      if (!token || !vaultKey) {
        setErr('Requiere PASSTORE_TOKEN y PASSTORE_VAULT_KEY.');
        return;
      }
      try {
        const all = (await apiGetJson(
          baseUrl,
          token,
          '/credentials',
        )) as CredentialDto[];
        const strength = evaluatePasswordStrength(plain);
        const dup = isPlainPasswordDuplicate(plain, vaultKey, all);
        const body = {
          alias: alias.trim(),
          platformName: platform.trim(),
          loginUsername: login.trim(),
          encryptedPassword: encryptSensitive(plain, vaultKey),
          strengthScore: strength.score,
          isDuplicate: dup,
        };
        const created = await apiPostJson(baseUrl, token, '/credentials', body);
        setStatus(`Guardado ✓ id ${(created as { id?: string }).id ?? ''}`);
      } catch (e: unknown) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    },
    [alias, platform, login],
  );

  if (status || err) {
    return (
      <Box flexDirection="column">
        {err ? <Text color="red">{err}</Text> : null}
        {status ? <Text color="green">{status}</Text> : null}
        <Text dimColor>Esc para volver al menú anterior</Text>
      </Box>
    );
  }

  if (stage === 0) {
    return (
      <Box flexDirection="column">
        <Text>Alias</Text>
        <TextInput value={alias} onChange={setAlias} onSubmit={() => setStage(1)} />
      </Box>
    );
  }
  if (stage === 1) {
    return (
      <Box flexDirection="column">
        <Text>Plataforma / sitio</Text>
        <TextInput
          value={platform}
          onChange={setPlatform}
          onSubmit={() => setStage(2)}
        />
      </Box>
    );
  }
  if (stage === 2) {
    return (
      <Box flexDirection="column">
        <Text>Usuario / email del login</Text>
        <TextInput value={login} onChange={setLogin} onSubmit={() => setStage(3)} />
      </Box>
    );
  }
  if (stage === 3 && pwdMode === null) {
    return (
      <Box flexDirection="column">
        <Text>¿Cómo defines la contraseña?</Text>
        <SelectInput
          items={[
            { label: 'Generar (aleatorio seguro)', value: 'gen' },
            { label: 'Escribir ahora', value: 'plain' },
          ]}
          onSelect={(item) => setPwdMode(item.value as 'plain' | 'gen')}
        />
      </Box>
    );
  }
  if (stage === 3 && pwdMode === 'gen') {
    return (
      <Box flexDirection="column">
        <Text>Longitud (4–128), Enter para generar y guardar</Text>
        <TextInput
          value={genLen}
          onChange={setGenLen}
          onSubmit={(v) => {
            const n = parseInt(v, 10);
            const opts = defaultGeneratorOptions();
            if (Number.isFinite(n) && n >= 4 && n <= 128) opts.length = n;
            const plain = generatePassword(opts);
            void submitCreate(plain);
          }}
        />
      </Box>
    );
  }
  if (stage === 3 && pwdMode === 'plain') {
    return (
      <Box flexDirection="column">
        <Text>Contraseña (visible)</Text>
        <TextInput
          value={pwdPlain}
          onChange={setPwdPlain}
          mask="*"
          onSubmit={(v) => void submitCreate(v)}
        />
      </Box>
    );
  }

  return <Text dimColor>…</Text>;
}

function VaultDeleteScreen(): React.ReactElement {
  const [id, setId] = useState('');
  const [done, setDone] = useState('');

  return (
    <Box flexDirection="column">
      <Text color="red">Eliminar credencial (irreversible)</Text>
      <Text>UUID:</Text>
      <TextInput
        value={id}
        onChange={setId}
        onSubmit={(v) => {
          void (async () => {
            const { baseUrl, token } = loadConfig();
            if (!token) {
              setDone('Falta PASSTORE_TOKEN');
              return;
            }
            try {
              await apiDelete(baseUrl, token, `/credentials/${v.trim()}`);
              setDone(`Eliminado ✓ ${v.trim()}`);
            } catch (e: unknown) {
              setDone(e instanceof Error ? e.message : String(e));
            }
          })();
        }}
      />
      {done ? <Text>{done}</Text> : null}
    </Box>
  );
}

function PasswordRootMenu(props: {
  onGen: () => void;
  onStrength: () => void;
  onDup: () => void;
}): React.ReactElement {
  return (
    <Box flexDirection="column">
      <Text bold color="magenta">
        Contraseña
      </Text>
      <SelectInput
        items={[
          { label: 'Generar', value: 'g' },
          { label: 'Evaluar fortaleza', value: 's' },
          { label: '¿Duplicada en el cofre?', value: 'd' },
        ]}
        onSelect={(item) => {
          if (item.value === 'g') props.onGen();
          if (item.value === 's') props.onStrength();
          if (item.value === 'd') props.onDup();
        }}
      />
    </Box>
  );
}

function PasswordGenScreen(): React.ReactElement {
  const [len, setLen] = useState('18');
  const [out, setOut] = useState('');

  return (
    <Box flexDirection="column">
      <Text>Longitud (Enter para generar)</Text>
      <TextInput
        value={len}
        onChange={setLen}
        onSubmit={(v) => {
          const argv = ['--length', v.trim()];
          const opts = parseGeneratorOpts(argv, 'cli');
          setOut(generatePassword(opts));
        }}
      />
      {out ? (
        <Box marginTop={1} flexDirection="column">
          <Text color="green" bold>
            {out}
          </Text>
          <Text dimColor>Pulsa Esc para volver</Text>
        </Box>
      ) : null}
    </Box>
  );
}

function PasswordStrengthScreen(): React.ReactElement {
  const [pwd, setPwd] = useState('');
  const [out, setOut] = useState('');

  return (
    <Box flexDirection="column">
      <Text>Contraseña a evaluar</Text>
      <TextInput
        value={pwd}
        onChange={setPwd}
        mask="*"
        onSubmit={(v) => {
          const r = evaluatePasswordStrength(v);
          setOut(`score: ${r.score}  (${r.label})`);
        }}
      />
      {out ? <Text color="cyan">{out}</Text> : null}
    </Box>
  );
}

function PasswordDupScreen(): React.ReactElement {
  const [pwd, setPwd] = useState('');
  const [out, setOut] = useState('');

  return (
    <Box flexDirection="column">
      <Text>Contraseña (compara con el cofre)</Text>
      <TextInput
        value={pwd}
        onChange={setPwd}
        mask="*"
        onSubmit={(v) => {
          void (async () => {
            const { baseUrl, token, vaultKey } = loadConfig();
            if (!token || !vaultKey) {
              setOut('Falta TOKEN o VAULT_KEY');
              return;
            }
            try {
              const all = (await apiGetJson(
                baseUrl,
                token,
                '/credentials',
              )) as CredentialDto[];
              const dup = isPlainPasswordDuplicate(v, vaultKey, all);
              setOut(dup ? '⚠️  Duplicada (coincide con otra entrada)' : '✓ No duplicada');
            } catch (e: unknown) {
              setOut(e instanceof Error ? e.message : String(e));
            }
          })();
        }}
      />
      {out ? <Text>{out}</Text> : null}
    </Box>
  );
}

function SyncScreen(): React.ReactElement {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');
  const [summary, setSummary] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const { baseUrl, token } = loadConfig();
    if (!token) {
      setPhase('err');
      setErr('Falta PASSTORE_TOKEN');
      return;
    }
    setPhase('loading');
    void pullSyncPage(baseUrl, token, undefined, 50)
      .then((page) => {
        setSummary(
          `serverTime: ${page.serverTime}\neventos en página: ${page.events.length}\nnextCursor: ${page.nextCursor || '(fin)'}`,
        );
        setPhase('ok');
      })
      .catch((e: unknown) => {
        setPhase('err');
        setErr(e instanceof Error ? e.message : String(e));
      });
  }, []);

  if (phase === 'loading') {
    return (
      <Box>
        <Spinner type="dots" />
        <Text> Sync pull…</Text>
      </Box>
    );
  }
  if (phase === 'err') {
    return <Text color="red">{err}</Text>;
  }
  return (
    <Box flexDirection="column">
      <Text bold>Muestra GET /sync/events</Text>
      <Text>{summary}</Text>
      <Text dimColor>Backup completo: ejecuta `passtore sync backup` en terminal</Text>
    </Box>
  );
}

function DevicesScreen(): React.ReactElement {
  const [phase, setPhase] = useState<'loading' | 'ok' | 'err'>('loading');
  const [json, setJson] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    const { baseUrl, token } = loadConfig();
    if (!token) {
      setPhase('err');
      setErr('Falta PASSTORE_TOKEN');
      return;
    }
    void apiGetJson(baseUrl, token, '/devices')
      .then((data) => {
        setJson(JSON.stringify(data, null, 2));
        setPhase('ok');
      })
      .catch((e: unknown) => {
        setPhase('err');
        setErr(e instanceof Error ? e.message : String(e));
      });
  }, []);

  if (phase === 'loading') {
    return (
      <Box>
        <Spinner type="dots" />
        <Text> Dispositivos…</Text>
      </Box>
    );
  }
  if (phase === 'err') {
    return <Text color="red">{err}</Text>;
  }
  return (
    <Box flexDirection="column">
      <Text bold>GET /devices</Text>
      <Text>{json}</Text>
    </Box>
  );
}
