import { Banknote, MessageCircle, ShieldCheck, WalletCards } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ManualPaymentMethodsProps = {
  compact?: boolean;
};

const paymentMethods = [
  {
    key: "wechat",
    title: "WeChat Pay",
    descriptionKey: "payment.wechatDescription",
    fallback: "Payment details are provided in live chat.",
    icon: WalletCards,
  },
  {
    key: "alipay",
    title: "Alipay",
    descriptionKey: "payment.alipayDescription",
    fallback: "Payment details are provided in live chat.",
    icon: WalletCards,
  },
  {
    key: "paypal",
    title: "PayPal",
    descriptionKey: "payment.paypalDescription",
    fallback: "Contact us in live chat for the correct PayPal details.",
    icon: ShieldCheck,
  },
  {
    key: "etransfer",
    title: "Interac e-Transfer",
    descriptionKey: "payment.etransferDescription",
    fallback: "Contact us in live chat for the correct e-Transfer details.",
    icon: Banknote,
  },
];

export function ManualPaymentMethods({
  compact = false,
}: ManualPaymentMethodsProps) {
  return (
    <section id="payment-instructions" className={compact ? "mt-6" : "mt-8"}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <WalletCards className="h-4 w-4 text-teal-700" aria-hidden="true" />
        <LocalizedText
          k="payment.methodsTitle"
          fallback="Supported payment methods"
        />
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-600">
        <LocalizedText
          k="payment.detailsInChat"
          fallback="Contact us in live chat to receive the correct payment details for your selected plan."
        />
      </p>

      <div
        className={
          compact
            ? "mt-4 grid gap-3"
            : "mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        }
      >
        {paymentMethods.map((method) => {
          const Icon = method.icon;

          return (
            <Card key={method.key} className="h-full">
              <CardHeader className="pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-800">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <CardTitle className="text-base">{method.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">
                  <LocalizedText
                    k={method.descriptionKey}
                    fallback={method.fallback}
                  />
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <div className="flex gap-3">
          <MessageCircle
            className="mt-0.5 h-4 w-4 shrink-0"
            aria-hidden="true"
          />
          <div>
            <p>
              <LocalizedText
                k="payment.confirmationReminder"
                fallback="After payment, send your payment screenshot, transaction ID, sender name, or payment reference in live chat."
              />
            </p>
            <p className="mt-2">
              <LocalizedText
                k="payment.securityReminder"
                fallback="Do not send passwords, card numbers, bank login details, or authentication codes."
              />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
