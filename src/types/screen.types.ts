import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Screens from '../screens';

export type ScreenName = keyof typeof Screens;

export const TabBarScreenNames: ScreenName[] = [
  'Home',
  'Settings'
];

export type ScreenParams = {
  Home: undefined;
  Dashboard: undefined;
  Settings: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type ScreenProps<Name extends ScreenName> = NativeStackScreenProps<
  ScreenParams,
  Name
>;