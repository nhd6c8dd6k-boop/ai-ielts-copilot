import { languages, type Language } from "@/lib/i18n/messages";

export const languageCookieName = "ai_ielts_lang";

export function isLanguage(value: string | undefined | null): value is Language {
  return Boolean(value && languages.includes(value as Language));
}

export function normalizeLanguage(value: string | undefined | null): Language | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();

  if (normalized.startsWith("zh")) {
    return "zh";
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  return isLanguage(normalized) ? normalized : null;
}

export function getHtmlLang(language: Language) {
  return language === "zh" ? "zh-CN" : "en";
}
