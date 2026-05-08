import { StyleSheet, Text, View } from 'react-native';
import type { SecurityIndicator } from '@passtore/core';
import { colors } from '@/theme/colors';

const LABELS: Record<SecurityIndicator, string> = {
  strong: 'Fuerte',
  weak: 'Débil',
  duplicate: 'Duplicada',
  compromised: 'Comprometida',
};

const BG: Record<SecurityIndicator, string> = {
  strong: 'rgba(21, 128, 61, 0.12)',
  weak: 'rgba(202, 138, 4, 0.15)',
  duplicate: 'rgba(194, 65, 92, 0.15)',
  compromised: 'rgba(220, 38, 38, 0.15)',
};

interface Props {
  status: SecurityIndicator;
}

export function SecurityBadge({ status }: Props) {
  return (
    <View style={[styles.wrap, { backgroundColor: BG[status] }]}>
      <Text style={styles.text}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
