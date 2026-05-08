import { createNavigationContainerRef } from '@react-navigation/native';
import type { MainStackParamList } from './types';

export const navigationRootRef =
  createNavigationContainerRef<MainStackParamList>();
