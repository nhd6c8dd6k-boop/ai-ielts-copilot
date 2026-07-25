"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import {
  getMessage,
  languageStorageKey,
  type Language,
} from "@/lib/i18n/messages";
import {
  getHtmlLang,
  languageCookieName,
  normalizeLanguage,
} from "@/lib/i18n/language";

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
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const hasHydrated = useRef(false);

  const persistLanguage = useCallback((nextLanguage: Language) => {
    window.localStorage.setItem(languageStorageKey, nextLanguage);
    document.cookie = `${languageCookieName}=${nextLanguage}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = getHtmlLang(nextLanguage);
  }, []);

  const setLanguage = useCallback(
    (nextLanguage: Language) => {
      if (nextLanguage === language) {
        return;
      }

      setLanguageState(nextLanguage);
      persistLanguage(nextLanguage);
      router.refresh();
    },
    [language, persistLanguage, router],
  );

  useEffect(() => {
    if (!hasHydrated.current) {
      hasHydrated.current = true;

      const storedLanguage = normalizeLanguage(
        window.localStorage.getItem(languageStorageKey),
      );
      const cookieLanguage = normalizeLanguage(readCookie(languageCookieName));
      const preferredLanguage = cookieLanguage ?? storedLanguage ?? language;

      persistLanguage(preferredLanguage);
      if (preferredLanguage !== language) {
        const syncLanguage = window.setTimeout(() => {
          setLanguageState(preferredLanguage);
          router.refresh();
        }, 0);

        return () => window.clearTimeout(syncLanguage);
      }
      return;
    }

    persistLanguage(language);
  }, [language, persistLanguage, router]);

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

function readCookie(name: string) {
  return document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}
