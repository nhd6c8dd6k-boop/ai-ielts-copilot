"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { Language } from "@/lib/i18n/messages";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
  onSelect?: () => void;
  variant?: "dropdown" | "menu";
};

const options: Array<{ value: Language; label: string; triggerLabel: string }> = [
  { value: "en", label: "English", triggerLabel: "EN" },
  { value: "zh", label: "中文", triggerLabel: "中文" },
];

export function LanguageSwitcher({
  className,
  compact = false,
  onSelect,
  variant = "dropdown",
}: LanguageSwitcherProps) {
  const { language, setLanguage, t } = useI18n();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const currentOption = options.find((option) => option.value === language) ?? options[0];
  const orderedOptions = [
    currentOption,
    ...options.filter((option) => option.value !== currentOption.value),
  ];
  const currentLanguageName = language === "zh" ? "中文" : "English";
  const triggerLabel =
    language === "zh"
      ? `切换语言，当前语言${currentLanguageName}`
      : `Change language, current language ${currentLanguageName}`;

  const closeMenu = ({ returnFocus = false } = {}) => {
    setIsOpen(false);

    if (returnFocus) {
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  };

  const selectLanguage = (nextLanguage: Language) => {
    if (nextLanguage !== language) {
      setLanguage(nextLanguage);
    }

    setIsOpen(false);
    onSelect?.();
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu({ returnFocus: true });
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const closeAfterNavigation = window.setTimeout(() => {
      setIsOpen(false);
    }, 0);

    return () => window.clearTimeout(closeAfterNavigation);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    itemRefs.current = itemRefs.current.slice(0, orderedOptions.length);
  }, [isOpen, orderedOptions.length]);

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
                onClick={() => selectLanguage(option.value)}
              >
                <span className="flex items-center gap-2">
                  <span className="flex h-4 w-4 items-center justify-center">
                    {active ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                  </span>
                  {option.label}
                </span>
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
        ref={triggerRef}
        type="button"
        className={cn(
          "inline-flex h-10 min-w-10 items-center justify-center gap-1 rounded-md px-2.5 font-semibold tracking-wide text-slate-700 transition-colors",
          "hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
          compact ? "text-xs" : "text-sm",
        )}
        aria-label={triggerLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
            window.setTimeout(() => itemRefs.current[0]?.focus(), 0);
          }
        }}
      >
        <span>{currentOption.triggerLabel}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", isOpen ? "rotate-180" : null)}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-44 rounded-md border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          <p className="px-2.5 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("nav.language", "Language")}
          </p>
          {orderedOptions.map((option) => {
            const active = language === option.value;
            const index = orderedOptions.findIndex(
              (orderedOption) => orderedOption.value === option.value,
            );

            return (
              <button
                key={option.value}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                  active
                    ? "bg-slate-100 font-semibold text-slate-950"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                )}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    event.preventDefault();
                    closeMenu({ returnFocus: true });
                    return;
                  }

                  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                    event.preventDefault();
                    const direction = event.key === "ArrowDown" ? 1 : -1;
                    const nextIndex =
                      (index + direction + orderedOptions.length) % orderedOptions.length;
                    itemRefs.current[nextIndex]?.focus();
                    return;
                  }

                  if (event.key === "Home") {
                    event.preventDefault();
                    itemRefs.current[0]?.focus();
                    return;
                  }

                  if (event.key === "End") {
                    event.preventDefault();
                    itemRefs.current[orderedOptions.length - 1]?.focus();
                  }
                }}
                onClick={() => {
                  selectLanguage(option.value);
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
