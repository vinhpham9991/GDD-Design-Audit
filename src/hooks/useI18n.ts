import { translations } from "@/features/i18n/translations";
import { useAppStore } from "@/store";

export function useI18n() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);

  const dictionary = translations[language];

  return {
    language,
    setLanguage,
    t: dictionary,
  };
}

