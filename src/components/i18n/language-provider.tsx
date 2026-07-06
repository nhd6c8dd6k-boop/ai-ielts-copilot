"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getMessage,
  languageStorageKey,
  type Language,
} from "@/lib/i18n/messages";
import { getHtmlLang, languageCookieName } from "@/lib/i18n/language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, fallback?: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  const setLanguage = useCallback((nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    document.cookie = `${languageCookieName}=${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = getHtmlLang(nextLanguage);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(languageStorageKey, language);
    document.cookie = `${languageCookieName}=${language}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = getHtmlLang(language);
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, fallback) => getMessage(language, key, fallback),
    }),
    [language, setLanguage],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useI18n must be used within LanguageProvider");
  }

  return context;
}
