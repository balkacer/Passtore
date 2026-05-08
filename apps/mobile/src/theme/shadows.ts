import { Platform, ViewStyle } from 'react-native';

export const cardShadow: ViewStyle =
  Platform.OS === 'ios'
    ? {
        shadowColor: '#5C1A22',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      }
    : {
        elevation: 6,
      };
