import { useLanguageStore } from '../store/languageStore';

export function useI18n() {
  const language = useLanguageStore((s) => s.language);

  const t = (kk: string, ru: string) => (language === 'kk' ? kk : ru);

  return {
    language,
    t,
    isKk: language === 'kk',
  };
}
