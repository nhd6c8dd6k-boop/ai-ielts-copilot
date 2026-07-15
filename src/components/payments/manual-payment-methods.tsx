import { existsSync } from "node:fs";
import path from "node:path";

import Image from "next/image";
import Link from "next/link";
import { Mail, QrCode, ShieldCheck, WalletCards } from "lucide-react";

import { LocalizedText } from "@/components/i18n/localized-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supportEmail } from "@/lib/support";

const manualPaymentQr = {
  wechat: {
    src: "/payments/wechat-pay.png",
  },
  alipay: {
    src: "/payments/alipay.png",
  },
} as const;

type ManualPaymentMethodsProps = {
  compact?: boolean;
};

export function ManualPaymentMethods({
  compact = false,
}: ManualPaymentMethodsProps) {
  return (
    <section className={compact ? "mt-6" : "mt-8"}>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
        <WalletCards className="h-4 w-4 text-teal-700" aria-hidden="true" />
        <LocalizedText
          k="payment.methodsTitle"
          fallback="Supported payment methods"
        />
      </div>

      <div className={compact ? "mt-3 grid gap-3" : "mt-4 grid gap-4 md:grid-cols-3"}>
        <PaymentQrCard
          title="WeChat Pay"
          src={manualPaymentQr.wechat.src}
          alt="WeChat Pay QR code"
        />
        <PaymentQrCard
          title="Alipay"
          src={manualPaymentQr.alipay.src}
          alt="Alipay QR code"
        />
        <Card>
          <CardHeader className="pb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-800">
              <Mail className="h-4 w-4" aria-hidden="true" />
            </div>
            <CardTitle className="text-base">e-Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6 text-slate-600">
              <LocalizedText
                k="payment.etransferDescription"
                fallback="Contact us first to receive the payment details."
              />
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href={`mailto:${supportEmail}`}>
                <LocalizedText
                  k="payment.contactDetails"
                  fallback="Contact for payment details"
                />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
        <p>
          <LocalizedText
            k="payment.domainReminder"
            fallback="Before paying, make sure the page domain is aiieltscopilot.com. Keep your payment confirmation after payment."
          />
        </p>
        <p className="mt-2">
          <LocalizedText
            k="payment.emailNoteReminder"
            fallback="Include your registered email in the payment note when the payment method supports it."
          />
        </p>
      </div>
    </section>
  );
}

function PaymentQrCard({
  title,
  src,
  alt,
}: {
  title: string;
  src: string;
  alt: string;
}) {
  const hasQrImage = publicFileExists(src);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-teal-50 text-teal-800">
          <QrCode className="h-4 w-4" aria-hidden="true" />
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {hasQrImage ? (
          <div className="rounded-md border border-slate-200 bg-white p-3">
            <Image
              src={src}
              alt={alt}
              width={220}
              height={220}
              className="aspect-square w-full max-w-[220px] rounded-sm object-contain"
            />
          </div>
        ) : (
          <div className="flex aspect-square w-full max-w-[220px] flex-col items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-600">
            <ShieldCheck className="mb-3 h-6 w-6 text-teal-700" aria-hidden="true" />
            <LocalizedText
              k="payment.qrComingSoon"
              fallback="QR code coming soon"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function publicFileExists(src: string) {
  const publicRelativePath = src.replace(/^\/+/, "");
  return existsSync(path.join(process.cwd(), "public", publicRelativePath));
}
