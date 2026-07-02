import Link from "next/link";
import { Sparkles } from "lucide-react";

import { HeaderAuthNav } from "@/components/layout/header-auth-nav";

const navigation = [
  { href: "/features", label: "功能" },
  { href: "/pricing", label: "价格" },
  { href: "/practice/reading", label: "练习" },
];

export function MarketingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          AI IELTS Copilot
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-slate-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <HeaderAuthNav />
      </div>
    </header>
  );
}
