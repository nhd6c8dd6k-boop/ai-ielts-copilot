"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Globe2 } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/messages";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  variant?: "dropdown" | "menu";
};

const options: Array<{ value: Language; label: string }> = [
  { value: "zh", label: "中文" },
  { value: "en", label: "English" },
];

export function LanguageSwitcher({
  className,
  compact = false,
  variant = "dropdown",
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const currentOption = options.find((option) => option.value === language) ?? options[0];
  const orderedOptions = [
    currentOption,
    ...options.filter((option) => option.value !== currentOption.value),
  ];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (variant === "menu") {
    return (
      <div
        role="group"
        className={cn("space-y-2", className)}
        aria-label={t("nav.language", "Language")}
      >
        <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t("nav.language", "Language")}
        </p>
        <div className="space-y-1">
          {orderedOptions.map((option) => {
            const active = language === option.value;

            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                  active
                    ? "bg-slate-100 font-semibold text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
                aria-pressed={active}
                aria-label={
                  option.value === "en"
                    ? t("nav.switchToEnglish", "Switch language to English")
                    : t("nav.switchToChinese", "Switch language to Chinese")
                }
                onClick={() => setLanguage(option.value)}
              >
                <span>{option.label}</span>
                {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative inline-flex text-sm text-slate-700",
        className,
      )}
      aria-label={t("nav.language", "Language")}
    >
      <button
        type="button"
        className={cn(
          "inline-flex items-center justify-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 font-medium shadow-sm transition-colors",
          "hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
          compact ? "text-xs" : "text-sm",
        )}
        aria-label={`${t("nav.language", "Language")}: ${currentOption.label}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Globe2 className="h-4 w-4" aria-hidden="true" />
        <span>{currentOption.label}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-180" : null)}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 min-w-40 rounded-md border border-slate-200 bg-white p-1 shadow-lg"
        >
          {orderedOptions.map((option) => {
            const active = language === option.value;

            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                  active
                    ? "bg-slate-100 font-semibold text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
                onClick={() => {
                  setLanguage(option.value);
                  setIsOpen(false);
                }}
              >
                <span className="flex h-4 w-4 items-center justify-center">
                  {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
