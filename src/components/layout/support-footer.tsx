"use client";

import Link from "next/link";
import { Mail } from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
import { supportEmail, xiaohongshuAccount } from "@/lib/support";

export function SupportFooter() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-200 bg-white/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 text-sm leading-6 text-slate-600 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="font-medium text-slate-950">
              {t("footer.helpTitle", "Need help or want to report a bug?")}
            </p>
            <p className="mt-1">
              {t("footer.contactPrefix", "Contact:")}
              <a
                href={`mailto:${supportEmail}`}
                className="ml-1 font-medium text-teal-800 underline-offset-4 hover:underline"
              >
                {supportEmail}
              </a>
            </p>
            <p className="mt-1">
              {t("footer.xiaohongshu", "Xiaohongshu:")} {xiaohongshuAccount}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:items-end">
            <p className="max-w-md text-slate-500 md:text-right">
              {t(
                "footer.beta",
                "This is a beta version. Your feedback helps us improve the practice experience.",
              )}
            </p>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 font-medium text-slate-700 underline-offset-4 hover:text-slate-950 hover:underline"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t("footer.support", "Support & Beta Feedback")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
