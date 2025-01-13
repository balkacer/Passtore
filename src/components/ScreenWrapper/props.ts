import { PropsWithChildren } from 'react';
import { LabelValues } from '../../lang/language.types';

export type ScreenWrapperProps = PropsWithChildren<{
  title?: string;
  goBack?: () => void
  padding?: number;
  scrollDisabled ?: boolean;
  gap?: number;
}>;

export type ScreenWrapperStyledProps = {
  padding: number;
}