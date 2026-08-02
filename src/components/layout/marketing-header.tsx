"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { BrandLogo } from "@/components/brand/brand-logo";
import { HeaderAuthNav } from "@/components/layout/header-auth-nav";
import {
  allPracticeHref,
  isPracticeItemActive,
  isPracticeRoute,
  practiceNavigationItems,
} from "@/components/layout/practice-navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/methodology", labelKey: "nav.methodology", fallback: "Methodology" },
  { href: "/pricing", labelKey: "nav.pricing", fallback: "Pricing" },
];

export function MarketingHeader() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-background/95 shadow-[0_1px_0_rgba(15,23,42,0.03)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <BrandLogo compact className="min-w-0 flex-1 lg:flex-none" textClassName="truncate" />
        <nav
          className="hidden min-w-0 items-center gap-1 text-sm text-slate-600 lg:flex"
          aria-label={t("nav.navigation", "Navigation")}
        >
          <PracticeMegaMenu pathname={pathname} />
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative rounded-md px-3 py-2 font-medium transition-colors",
                  "hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                  isActive ? "text-slate-950" : "text-slate-600",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                {t(item.labelKey, item.fallback)}
                {isActive ? (
                  <span
                    className="absolute inset-x-3 -bottom-1 h-0.5 rounded-full bg-teal-600"
                    aria-hidden="true"
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <LanguageSwitcher compact className="hidden shrink-0 lg:inline-flex" />
          <HeaderAuthNav />
        </div>
      </div>
    </header>
  );
}

function PracticeMegaMenu({ pathname }: { pathname: string }) {
  const { t } = useI18n();
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const practiceActive = isPracticeRoute(pathname);

  const clearTimers = useCallback(() => {
    if (openTimerRef.current) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }

    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const openMenu = useCallback(() => {
    clearTimers();
    setIsOpen(true);
  }, [clearTimers]);

  const closeMenu = useCallback(({ returnFocus = false } = {}) => {
    clearTimers();
    setIsOpen(false);

    if (returnFocus) {
      window.setTimeout(() => triggerRef.current?.focus(), 0);
    }
  }, [clearTimers]);

  const scheduleOpen = () => {
    clearTimers();
    openTimerRef.current = window.setTimeout(() => setIsOpen(true), 100);
  };

  const scheduleClose = () => {
    clearTimers();
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 180);
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
        event.preventDefault();
        closeMenu({ returnFocus: true });
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={scheduleOpen}
      onMouseLeave={scheduleClose}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-teal-700 px-4 text-sm font-semibold text-white transition-colors",
          "hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
          isOpen || practiceActive ? "bg-teal-800 ring-1 ring-teal-900/10" : null,
        )}
        aria-label={t("nav.practiceMenu.open", "Open Practice menu")}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-current={practiceActive ? "page" : undefined}
        data-active={practiceActive ? "true" : undefined}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openMenu();
            window.setTimeout(() => firstLinkRef.current?.focus(), 0);
          }
        }}
      >
        {t("nav.practice", "Practice")}
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : null)}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className={cn(
            "absolute left-0 top-full z-50 mt-3 w-[min(36rem,calc(100vw-2rem))] rounded-lg border border-slate-200 bg-white p-4 shadow-lg",
            "animate-in fade-in slide-in-from-top-1 duration-150",
          )}
        >
          <nav aria-label={t("nav.practiceMenu.label", "Practice modules")}>
            <div className="grid gap-3 sm:grid-cols-2">
              {practiceNavigationItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = isPracticeItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.id}
                    ref={index === 0 ? firstLinkRef : undefined}
                    href={item.href}
                    onClick={() => closeMenu()}
                    className={cn(
                      "group rounded-md border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                      item.featured
                        ? "border-teal-200 bg-teal-50/70 hover:bg-teal-50"
                        : "border-slate-200 bg-white hover:bg-slate-50",
                      isActive ? "ring-2 ring-teal-700 ring-offset-1" : null,
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                          item.featured
                            ? "bg-teal-700 text-white"
                            : "bg-slate-100 text-slate-700",
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          {t(item.titleKey, item.titleFallback)}
                          {item.badgeKey ? (
                            <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-teal-800 ring-1 ring-teal-200">
                              {t(item.badgeKey, item.badgeFallback ?? "AI Feedback")}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-slate-600">
                          {t(item.descriptionKey, item.descriptionFallback)}
                        </span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link
              href={allPracticeHref}
              onClick={() => closeMenu()}
              className="mt-4 flex items-center justify-between rounded-md border border-slate-200 px-4 py-3 text-sm font-semibold text-teal-800 transition-colors hover:bg-teal-50 hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950"
              aria-current={pathname === allPracticeHref ? "page" : undefined}
            >
              {t("nav.practiceMenu.viewAll", "View all practice")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
