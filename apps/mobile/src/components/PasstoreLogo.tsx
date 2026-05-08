import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/colors';
import { cardShadow } from '@/theme/shadows';

interface Props {
  size?: number;
}

export function PasstoreLogo({ size = 56 }: Props) {
  return (
    <View
      style={[
        styles.circle,
        cardShadow,
        { width: size, height: size, borderRadius: size / 2 },
      ]}>
      <Text style={[styles.letter, { fontSize: size * 0.42 }]}>P</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -1,
  },
});
