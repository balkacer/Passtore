import { useMemo } from 'react';
import { LabelsKey } from '../lang/language.types';
import { useUserPreferences } from '../providers/UserPreferences.provider';
import { languages } from '../lang/values';

export default function useLanguageLabels() {
  const { language } = useUserPreferences();

  const languageLabelsMemo = useMemo(() => {
    const labels = languages[language];
    const languageLabels: Partial<Record<`${LabelsKey}Label`, string>> = {};

    for (const key in labels) {
      languageLabels[`${key as LabelsKey}Label`] = labels[key as LabelsKey];
    }

    return languageLabels;
  }, [language]);

  return languageLabelsMemo;
}