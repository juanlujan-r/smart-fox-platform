import { useState, useEffect } from 'react';
import { getLanguage, setLanguage as setLang, t as translate, Language } from '@/lib/i18n';

export function useTranslation() {
  const [language, setLanguageState] = useState<Language>('es');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setLanguageState(getLanguage());
  }, []);

  const t = (key: string): string => {
    return translate(key, language);
  };

  const setLanguage = (lang: Language) => {
    setLang(lang);
    setLanguageState(lang);
  };

  return { t, language, setLanguage, isClient };
}
