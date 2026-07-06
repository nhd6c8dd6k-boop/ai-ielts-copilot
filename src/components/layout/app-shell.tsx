import { BrandLogo } from "@/components/brand/brand-logo";
import { AppSidebarNav } from "@/components/layout/app-sidebar-nav";
import { MobileAppNav } from "@/components/layout/mobile-app-nav";
import { SupportFooter } from "@/components/layout/support-footer";
import { AccountStatus } from "@/features/auth/account-status";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7f7f4]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-200 bg-white px-4 py-5 lg:block">
        <div className="flex h-full flex-col">
          <div>
            <BrandLogo className="px-2" />
            <AppSidebarNav />
          </div>
          <div className="mt-auto">
            <AccountStatus />
          </div>
        </div>
      </aside>
      <main className="min-w-0 overflow-x-hidden lg:pl-64">
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 space-y-4 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <BrandLogo compact />
              <MobileAppNav />
            </div>
            <AccountStatus />
          </div>
          {children}
          <div className="mt-10">
            <SupportFooter />
          </div>
        </div>
      </main>
    </div>
  );
}
