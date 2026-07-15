import { Mail, MessageCircle, WalletCards } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupportFooter } from "@/components/layout/support-footer";
import { ManualPaymentMethods } from "@/components/payments/manual-payment-methods";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supportEmail, xiaohongshuAccount } from "@/lib/support";

const upgradeSteps = [
  [
    "support.upgrade.step.account",
    "Register or sign in using the email you want to use for Pro.",
  ],
  [
    "support.upgrade.step.pay",
    "Pay using WeChat Pay, Alipay, or e-Transfer.",
  ],
  [
    "support.upgrade.step.confirm",
    "Send us the payment screenshot or confirmation together with your registered email.",
  ],
  [
    "support.upgrade.step.activate",
    "Pro will be manually activated after the payment is verified.",
  ],
];

const faqs = [
  [
    "support.faq.price.q",
    "How much is Pro?",
    "support.faq.price.a",
    "Pro is CA$9.99 per month, approximately ¥52 per month. The RMB amount is an estimate and may vary with the exchange rate.",
  ],
  [
    "support.faq.methods.q",
    "Which payment methods are supported?",
    "support.faq.methods.a",
    "We currently support WeChat Pay, Alipay, and e-Transfer with manual activation after payment confirmation.",
  ],
  [
    "support.faq.confirm.q",
    "What should I send after payment?",
    "support.faq.confirm.a",
    "Send the payment screenshot or confirmation together with the email used for your AI IELTS Copilot account.",
  ],
  [
    "support.faq.timing.q",
    "How long does activation take?",
    "support.faq.timing.a",
    "Pro is usually activated within a few minutes after payment confirmation, depending on administrator availability.",
  ],
  [
    "support.faq.card.q",
    "Will credit card payments be supported?",
    "support.faq.card.a",
    "Online card payments are planned for the future. For now, WeChat Pay, Alipay, and e-Transfer are handled through manual confirmation.",
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
          <p className="mt-2 text-sm leading-6 text-slate-600">
            <LocalizedText
              k="support.proBenefits"
              fallback="Pro includes unlimited Reading and Listening practice, plus up to 10 AI Writing feedbacks per day."
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
          <ManualPaymentMethods />
          <p className="mt-5 text-sm leading-6 text-slate-600">
            <LocalizedText
              k="support.afterPaymentReminder"
              fallback="After payment, send your registered email and payment confirmation."
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

        <section className="mt-10">
          <h2 className="text-2xl font-semibold text-slate-950">
            <LocalizedText k="support.faqTitle" fallback="FAQ" />
          </h2>
          <div className="mt-4 grid gap-4">
            {faqs.map(
              ([questionKey, questionFallback, answerKey, answerFallback]) => (
                <Card key={questionKey}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      <LocalizedText
                        k={questionKey}
                        fallback={questionFallback}
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-6 text-slate-600">
                      <LocalizedText k={answerKey} fallback={answerFallback} />
                    </p>
                  </CardContent>
                </Card>
              ),
            )}
          </div>
        </section>
      </main>
      <SupportFooter />
    </div>
  );
}
