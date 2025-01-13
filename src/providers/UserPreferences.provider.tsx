import { createContext, PropsWithChildren, ReactNode, useContext, useEffect, useState } from 'react';
import { Language, SettingsLanguage } from '../lang/language.types';
import { USER_PREFERENCES_STORAGE_KEY } from '../constants/general';
import customStorage from '../utils/customStorage';
import getSystemLanguage from '../utils/getSystemLanguage';

type PreferencesContextType = {
  language: Language;
  settingsLanguage: SettingsLanguage;
  changeLanguage: (newLanguage: SettingsLanguage) => void;
  reset: () => void;
};

type UserPreferencesType = {
  language: SettingsLanguage;
};

const UserPreferencesContext = createContext<PreferencesContextType>({
  language: 'en',
  settingsLanguage: 'system',
  changeLanguage: () => {},
  reset: () => {}
});

export const useUserPreferences = () => useContext(UserPreferencesContext);

export const UserPreferencesProvider = ({
  children
}: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [settingsLanguage, setSettingsLanguage] =
    useState<SettingsLanguage>('system');

  const initUserPreferences = async () => {
    try {
      const userPreferences = await customStorage.getItem<UserPreferencesType>(
        USER_PREFERENCES_STORAGE_KEY
      );

      if (userPreferences?.language)
        setSettingsLanguage(userPreferences.language);
    } catch (error) {
      const userPreferences: UserPreferencesType = {
        language: settingsLanguage
      };

      customStorage.setItem(
        USER_PREFERENCES_STORAGE_KEY,
        userPreferences
      );
    }
  };

  useEffect(() => {
    initUserPreferences();
  }, []);

  useEffect(() => {
    if (settingsLanguage === 'system') {
      setLanguage(getSystemLanguage());
    } else {
      setLanguage(settingsLanguage);
    }
  }, [settingsLanguage]);


  const changeLanguage = (newLanguage: SettingsLanguage) => {
    if (newLanguage === 'system') {
      setLanguage(getSystemLanguage());
    } else {
      setLanguage(newLanguage);
    }

    setSettingsLanguage(newLanguage);
    customStorage.setItem(
      USER_PREFERENCES_STORAGE_KEY,
      {
        language: newLanguage
      }
    );
  };

  const reset = async () => {
    setLanguage(getSystemLanguage());
    setSettingsLanguage('system');

    return customStorage.removeItem(
      USER_PREFERENCES_STORAGE_KEY
    ).then(initUserPreferences);
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        language,
        settingsLanguage,
        changeLanguage,
        reset
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};