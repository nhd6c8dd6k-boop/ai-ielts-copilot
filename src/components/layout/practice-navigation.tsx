"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenText,
  ChevronDown,
  Headphones,
  Mic,
  PenLine,
  type LucideIcon,
} from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

export type PracticeNavigationItem = {
  id: "writing" | "reading" | "listening" | "speaking";
  href: string;
  titleKey: string;
  titleFallback: string;
  descriptionKey: string;
  descriptionFallback: string;
  icon: LucideIcon;
  featured?: boolean;
  badgeKey?: string;
  badgeFallback?: string;
};

export const practiceNavigationItems: PracticeNavigationItem[] = [
  {
    id: "writing",
    href: "/practice/writing",
    titleKey: "nav.practiceMenu.writing.title",
    titleFallback: "Writing",
    descriptionKey: "nav.practiceMenu.writing.description",
    descriptionFallback:
      "Estimated bands, criteria-based feedback and sentence improvements.",
    icon: PenLine,
    featured: true,
    badgeKey: "nav.practiceMenu.writing.badge",
    badgeFallback: "AI Feedback",
  },
  {
    id: "reading",
    href: "/practice/reading",
    titleKey: "nav.practiceMenu.reading.title",
    titleFallback: "Reading",
    descriptionKey: "nav.practiceMenu.reading.description",
    descriptionFallback: "IELTS-style passages with automatic answer checking.",
    icon: BookOpenText,
  },
  {
    id: "listening",
    href: "/practice/listening",
    titleKey: "nav.practiceMenu.listening.title",
    titleFallback: "Listening",
    descriptionKey: "nav.practiceMenu.listening.description",
    descriptionFallback: "Audio practice using reviewed IELTS-style scripts.",
    icon: Headphones,
  },
  {
    id: "speaking",
    href: "/practice/speaking",
    titleKey: "nav.practiceMenu.speaking.title",
    titleFallback: "Speaking",
    descriptionKey: "nav.practiceMenu.speaking.description",
    descriptionFallback: "Part 1, Part 2 and Part 3 preparation materials.",
    icon: Mic,
  },
];

export const allPracticeHref = "/practice";

export function isPracticeRoute(pathname: string) {
  return pathname === allPracticeHref || pathname.startsWith(`${allPracticeHref}/`);
}

export function isPracticeItemActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PracticeMobileAccordion({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string;
  onNavigate: () => void;
  className?: string;
}) {
  const { t } = useI18n();
  const panelId = useId();
  const practiceActive = isPracticeRoute(pathname);
  const [isOpen, setIsOpen] = useState(practiceActive);
  const closeAfterNavigationStarts = () => {
    window.setTimeout(onNavigate, 0);
  };

  return (
    <div className={cn("space-y-1", className)}>
      <button
        type="button"
        className={cn(
          "flex min-h-11 w-full items-center justify-between border-l-2 px-3 py-2.5 text-left text-sm transition-colors",
          "hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
          practiceActive
            ? "border-teal-600 bg-teal-50 font-semibold text-slate-950"
            : "border-transparent text-slate-700",
        )}
        aria-expanded={isOpen}
        aria-controls={panelId}
        aria-current={practiceActive ? "page" : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className="flex items-center gap-3">
          <BookOpenText className="h-4 w-4" aria-hidden="true" />
          {t("nav.practice", "Practice")}
        </span>
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", isOpen ? "rotate-180" : null)}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div id={panelId} className="ml-4 space-y-1 border-l border-slate-200 pl-2">
          {practiceNavigationItems.map((item) => {
            const Icon = item.icon;
            const itemActive = isPracticeItemActive(pathname, item.href);

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={closeAfterNavigationStarts}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  "hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
                  itemActive
                    ? "bg-teal-50 font-semibold text-slate-950"
                    : "text-slate-600",
                )}
                aria-current={itemActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {t(item.titleKey, item.titleFallback)}
              </Link>
            );
          })}
          <Link
            href={allPracticeHref}
            onClick={closeAfterNavigationStarts}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
              "text-teal-800 hover:bg-teal-50 hover:text-teal-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950",
            )}
            aria-current={pathname === allPracticeHref ? "page" : undefined}
          >
            {t("nav.practiceMenu.viewAll", "View all practice")}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
