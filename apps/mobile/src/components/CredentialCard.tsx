import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { CredentialDto, SecurityIndicator } from '@passtore/core';
import { SecurityBadge } from './SecurityBadge';
import { colors } from '@/theme/colors';
import { cardShadow } from '@/theme/shadows';
import { spacing } from '@/theme/spacing';
import { scoreToSecurityIndicator } from '@/utils/passwordStrength';

interface Props {
  item: CredentialDto;
  onPress: () => void;
}

function deriveSecurity(item: CredentialDto): SecurityIndicator {
  if (item.isDuplicate) {
    return 'duplicate';
  }
  if (item.strengthScore != null) {
    return scoreToSecurityIndicator(item.strengthScore, item.isDuplicate);
  }
  return 'strong';
}

export function CredentialCard({ item, onPress }: Props) {
  const security = deriveSecurity(item);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.94 }]}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          {item.iconUrl ? (
            <Image source={{ uri: item.iconUrl }} style={styles.icon} />
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>
        <View style={styles.body}>
          <Text style={styles.alias}>{item.alias}</Text>
          <Text style={styles.sub}>{item.loginUsername}</Text>
          <Text style={styles.platform} numberOfLines={1}>
            {item.platformName}
            {item.url ? ` · ${item.url}` : ''}
          </Text>
        </View>
        <SecurityBadge status={security} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  icon: {
    width: '100%',
    height: '100%',
  },
  iconPlaceholder: {
    flex: 1,
    backgroundColor: colors.roseLight,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  alias: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  sub: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  platform: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
