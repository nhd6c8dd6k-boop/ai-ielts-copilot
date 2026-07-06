"use client";

import { useI18n } from "@/components/i18n/language-provider";

type LocalizedTextProps = {
  k: string;
  fallback?: string;
};

export function LocalizedText({ k, fallback }: LocalizedTextProps) {
  const { t } = useI18n();

  return <>{t(k, fallback)}</>;
}
