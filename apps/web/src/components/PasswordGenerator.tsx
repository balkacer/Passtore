import { useMemo, useState } from 'react';
import {
  generatePassword,
  type GeneratorOptions,
} from '@/lib/passwordGenerator';
import { evaluatePasswordStrength } from '@/lib/passwordStrength';

const defaultOpts: GeneratorOptions = {
  length: 18,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeRepeated: true,
  excludeAmbiguous: true,
};

interface Props {
  onUsePassword?: (pwd: string) => void;
}

export function PasswordGenerator({ onUsePassword }: Props) {
  const [opts, setOpts] = useState<GeneratorOptions>(defaultOpts);
  const [pwd, setPwd] = useState(() => generatePassword(defaultOpts));

  const strength = useMemo(() => evaluatePasswordStrength(pwd), [pwd]);

  const updateOpts = (next: GeneratorOptions) => {
    setOpts(next);
    setPwd(generatePassword(next));
  };

  const toggle = <K extends keyof GeneratorOptions>(
    key: K,
    value: GeneratorOptions[K],
  ) => {
    setOpts((o) => {
      const next = { ...o, [key]: value };
      setPwd(generatePassword(next));
      return next;
    });
  };

  return (
    <div className="stack">
      <div className="card">
        <code style={{ fontSize: '1rem', wordBreak: 'break-all' }}>{pwd}</code>
        <p className="muted" style={{ marginTop: '0.5rem' }}>
          Fortaleza: {strength.label} ({strength.score}/100)
        </p>
      </div>

      <label className="muted">
        Longitud: {opts.length}{' '}
        <input
          type="range"
          min={12}
          max={48}
          step={1}
          value={opts.length}
          onChange={(e) =>
            updateOpts({ ...opts, length: Number(e.target.value) })
          }
        />
      </label>

      <ToggleRow
        label="Mayúsculas"
        value={opts.uppercase}
        onChange={(v) => toggle('uppercase', v)}
      />
      <ToggleRow
        label="Minúsculas"
        value={opts.lowercase}
        onChange={(v) => toggle('lowercase', v)}
      />
      <ToggleRow
        label="Números"
        value={opts.numbers}
        onChange={(v) => toggle('numbers', v)}
      />
      <ToggleRow
        label="Símbolos"
        value={opts.symbols}
        onChange={(v) => toggle('symbols', v)}
      />
      <ToggleRow
        label="Sin repetidos"
        value={opts.excludeRepeated}
        onChange={(v) => toggle('excludeRepeated', v)}
      />
      <ToggleRow
        label="Excluir ambiguos O/0, l/I/1"
        value={opts.excludeAmbiguous}
        onChange={(v) => toggle('excludeAmbiguous', v)}
      />

      <button
        type="button"
        className="btn btn-primary"
        onClick={() => setPwd(generatePassword(opts))}>
        Regenerar
      </button>
      {onUsePassword ? (
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => onUsePassword(pwd)}>
          Usar contraseña
        </button>
      ) : null}
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
      }}>
      <span className="muted">{label}</span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}
