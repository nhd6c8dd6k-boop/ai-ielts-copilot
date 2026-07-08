import Link from "next/link";

import { LocalizedText } from "@/components/i18n/localized-text";
import { cn } from "@/lib/utils";

export type PracticeCategoryTab = {
  value: string;
  labelKey: string;
  fallback: string;
};

type PracticeCategoryTabsProps = {
  activeCategory: string;
  tabs: PracticeCategoryTab[];
};

export function PracticeCategoryTabs({
  activeCategory,
  tabs,
}: PracticeCategoryTabsProps) {
  return (
    <div className="mb-5 overflow-x-auto pb-1">
      <div className="flex min-w-max gap-2">
        {tabs.map((tab) => {
          const active = activeCategory === tab.value;
          const href =
            tab.value === "all" ? "?" : `?category=${encodeURIComponent(tab.value)}`;

          return (
            <Link
              key={tab.value}
              href={href}
              scroll={false}
              className={cn(
                "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950",
              )}
              aria-current={active ? "page" : undefined}
            >
              <LocalizedText k={tab.labelKey} fallback={tab.fallback} />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
