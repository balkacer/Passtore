import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import {
  generatePassword,
  type GeneratorOptions,
} from '@/utils/passwordGenerator';
import { evaluatePasswordStrength } from '@/utils/passwordStrength';
import { PrimaryButton } from '@/components/PrimaryButton';

interface Props {
  onUsePassword?: (pwd: string) => void;
}

const defaultOpts: GeneratorOptions = {
  length: 18,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeRepeated: true,
  excludeAmbiguous: true,
};

export function PasswordGenerator({ onUsePassword }: Props) {
  const [opts, setOpts] = useState<GeneratorOptions>(defaultOpts);
  const [pwd, setPwd] = useState(() => generatePassword(defaultOpts));

  const strength = useMemo(
    () => evaluatePasswordStrength(pwd),
    [pwd],
  );

  const regenerate = () => {
    setOpts((current) => {
      const nextPwd = generatePassword(current);
      setPwd(nextPwd);
      return current;
    });
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
    <View style={styles.card}>
      <Text style={styles.preview}>{pwd}</Text>
      <Text style={styles.strength}>
        Fortaleza: {strength.label} ({strength.score}/100)
      </Text>

      <Row label="Longitud">
        <Text style={styles.mono}>{opts.length}</Text>
      </Row>
      <SliderLike
        value={opts.length}
        onChange={(n) =>
          setOpts((o) => {
            const next = { ...o, length: n };
            setPwd(generatePassword(next));
            return next;
          })
        }
        min={12}
        max={48}
      />

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
        label="Sin caracteres repetidos"
        value={opts.excludeRepeated}
        onChange={(v) => toggle('excludeRepeated', v)}
      />
      <ToggleRow
        label="Excluir ambiguos (O/0, l/I/1)"
        value={opts.excludeAmbiguous}
        onChange={(v) => toggle('excludeAmbiguous', v)}
      />

      <PrimaryButton title="Regenerar" onPress={regenerate} />
      {onUsePassword ? (
        <PrimaryButton
          title="Usar contraseña"
          variant="ghost"
          onPress={() => onUsePassword(pwd)}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </View>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.rowBetween}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
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
    <View style={styles.rowBetween}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

/** Lightweight stepper — avoids adding @react-native-community/slider. */
function SliderLike({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  const step = () => {
    if (value < max) {
      onChange(Math.min(max, value + 2));
    }
  };
  const stepDown = () => {
    if (value > min) {
      onChange(Math.max(min, value - 2));
    }
  };
  return (
    <View style={styles.sliderRow}>
      <Pressable onPress={stepDown} style={styles.stepBtn}>
        <Text style={styles.stepTxt}>−</Text>
      </Pressable>
      <View style={{ flex: 1 }} />
      <Pressable onPress={step} style={styles.stepBtn}>
        <Text style={styles.stepTxt}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
  },
  preview: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: 0.5,
  },
  strength: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    paddingRight: spacing.sm,
  },
  mono: {
    fontVariant: ['tabular-nums'],
    fontWeight: '600',
    color: colors.primary,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stepBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
  },
  stepTxt: {
    fontSize: 20,
    color: colors.primary,
  },
});
