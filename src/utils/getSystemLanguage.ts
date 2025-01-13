import { Language, LanguageEnum } from '../lang/language.types';
import * as RNLocalize from 'react-native-localize';

const getSystemLanguage = (): Language => {
  const locales = RNLocalize.getLocales();

  if (locales && locales.length > 0) {
    const lang = locales[0].languageCode;
    return LanguageEnum[lang as keyof typeof LanguageEnum] ? lang as keyof typeof LanguageEnum : 'en'
  }

  return 'en';
};

export default getSystemLanguage;


