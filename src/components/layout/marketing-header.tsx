"use client";

import Link from "next/link";

import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { BrandLogo } from "@/components/brand/brand-logo";
import { HeaderAuthNav } from "@/components/layout/header-auth-nav";

const navigation = [
  { href: "/practice", labelKey: "nav.practice", fallback: "Practice" },
  { href: "/pricing", labelKey: "nav.pricing", fallback: "Pricing" },
];

export function MarketingHeader() {
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandLogo compact />
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-slate-950"
            >
              {t(item.labelKey, item.fallback)}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher compact />
          <HeaderAuthNav />
        </div>
      </div>
    </header>
  );
}
