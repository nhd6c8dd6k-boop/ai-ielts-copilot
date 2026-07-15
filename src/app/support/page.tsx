import { Mail, MessageCircle, WalletCards } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupportFooter } from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supportEmail, xiaohongshuAccount } from "@/lib/support";

const upgradeSteps = [
  [
    "support.upgrade.step.account",
    "Create an account using the email you want to use for Pro.",
  ],
  [
    "support.upgrade.step.pay",
    "Pay through WeChat Pay, Alipay, or e-Transfer.",
  ],
  [
    "support.upgrade.step.confirm",
    "Send your payment confirmation and registered email.",
  ],
  [
    "support.upgrade.step.activate",
    "Pro will be activated manually after confirmation.",
  ],
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <Badge>
          <LocalizedText k="footer.support" fallback="Support" />
        </Badge>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
          <LocalizedText k="support.title" fallback="Support & Pro upgrade" />
        </h1>
        <p className="mt-5 text-lg leading-8 text-slate-600">
          <LocalizedText
            k="support.description"
            fallback="Contact us if you need help, want to report a bug, or want to upgrade to Pro manually."
          />
        </p>

        <section className="mt-8 rounded-lg border border-teal-200 bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 text-teal-800">
            <WalletCards className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-slate-950">
            <LocalizedText k="support.upgradeTitle" fallback="Upgrade to Pro" />
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            <LocalizedText
              k="support.upgradeDescription"
              fallback="Pro membership is manually activated for now. No Stripe checkout is available yet."
            />
          </p>
          <ol className="mt-5 grid gap-3">
            {upgradeSteps.map(([key, fallback], index) => (
              <li key={key} className="flex gap-3 text-sm leading-6 text-slate-700">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-950 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <LocalizedText k={key} fallback={fallback} />
              </li>
            ))}
          </ol>
          <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            <LocalizedText
              k="support.betaReward"
              fallback="The first 10 users who register and complete a practice will receive one month of Pro access. Eligible users will be activated manually."
            />
          </p>
        </section>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <Mail className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="pt-3">
                <LocalizedText k="support.email" fallback="Email:" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <a
                href={`mailto:${supportEmail}`}
                className="text-base font-medium text-teal-800 underline-offset-4 hover:underline"
              >
                {supportEmail}
              </a>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                <LocalizedText
                  k="support.emailHelp"
                  fallback="Use email for Pro upgrade, bug reports, login issues, or longer feedback."
                />
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <CardTitle className="pt-3">
                <LocalizedText k="support.xiaohongshu" fallback="Xiaohongshu:" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium text-slate-950">
                {xiaohongshuAccount}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                <LocalizedText
                  k="support.xiaohongshuHelp"
                  fallback="You can also use Xiaohongshu for Pro upgrade questions, product feedback, or practice suggestions."
                />
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <SupportFooter />
    </div>
  );
}
