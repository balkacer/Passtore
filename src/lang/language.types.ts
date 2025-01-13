import { ScreenName } from '../types/screen.types';

export enum LanguageEnum {
  en = 'en',
  es = 'es',
}

export type Language = keyof typeof LanguageEnum;

export type SettingsLanguage = Language | 'system';

export type LabelValues = Record<ScreenName, string> & {
  Default: string;
  Spanish: string;
  English: string;
  Count: string;
  ChangeLanguage: string;
  HelloFrom: string;
  LogOut: string;
  SignInAction: string;
  SignUpAction: string;
  Username: string;
  Password: string;
  ConfirmPassword: string;
  FirstName: string;
  LastName: string;
  Hello: string;
};

export type LabelsKey = keyof LabelValues;

export type LanguageLabels = Record<Language, LabelValues>;