import Link from "next/link";

import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";
import { AccountStatus } from "@/features/auth/account-status";

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
            <AppSidebarNav />
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
