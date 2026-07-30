"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { usePathname } from "next/navigation";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { BrandLogo } from "@/components/brand/brand-logo";
import { HeaderAuthNav } from "@/components/layout/header-auth-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/practice", labelKey: "nav.practice", fallback: "Practice" },
  {
    href: "/writing-feedback",
    labelKey: "nav.writingFeedback",
    fallback: "Writing Feedback",
  },
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
          <Button
            asChild
            size="sm"
            className="hidden h-9 shrink-0 bg-teal-700 px-3 font-semibold text-white hover:bg-teal-800 lg:inline-flex xl:px-4"
          >
            <Link href="/practice/writing">
              {t("nav.tryWriting", "Try Writing")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <HeaderAuthNav />
        </div>
      </div>
    </header>
  );
}
