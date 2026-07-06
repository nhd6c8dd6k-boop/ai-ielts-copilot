"use client";

import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/messages";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

const options: Array<{ value: Language; label: string }> = [
  { value: "zh", label: "中文" },
  { value: "en", label: "EN" },
];

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border border-slate-200 bg-white p-1 text-xs text-slate-600",
        className,
      )}
      aria-label={t("nav.language", "Language")}
    >
      {!compact ? (
        <span className="px-2 font-medium text-slate-500">
          {t("nav.language", "Language")}
        </span>
      ) : null}
      {options.map((option) => {
        const active = language === option.value;

        return (
          <button
            key={option.value}
            type="button"
            className={cn(
              "rounded px-2.5 py-1 font-medium transition-colors",
              active
                ? "bg-slate-950 text-white"
                : "hover:bg-slate-100 hover:text-slate-950",
            )}
            aria-pressed={active}
            onClick={() => setLanguage(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
