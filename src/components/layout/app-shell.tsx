import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  Headphones,
  LayoutDashboard,
  Settings,
  Timer,
} from "lucide-react";

import { AccountStatus } from "@/features/auth/account-status";

const navItems = [
  { href: "/dashboard", label: "学习看板", icon: LayoutDashboard },
  { href: "/practice/reading", label: "阅读练习", icon: BookOpen },
  { href: "/practice/listening", label: "听力练习", icon: Headphones },
  { href: "/practice/writing", label: "写作练习", icon: FileText },
  { href: "/exam", label: "模考", icon: Timer },
  { href: "/result", label: "结果复盘", icon: BarChart3 },
  { href: "/profile", label: "个人资料", icon: Settings },
  { href: "/pricing", label: "订阅", icon: CreditCard },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f7f4]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div className="flex h-full flex-col">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 px-2 text-sm font-semibold"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-white">
                AI
              </span>
              IELTS Copilot
            </Link>
            <nav className="mt-8 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950"
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="mt-auto">
            <AccountStatus />
          </div>
        </div>
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 lg:hidden">
            <AccountStatus />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
