"use client";

import { MessageCircle } from "lucide-react";
import { Crisp } from "crisp-sdk-web";

import { useI18n } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { proPricing } from "@/config/pricing";

type ContactToUpgradeButtonProps = {
  plan: "monthly" | "yearly";
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function ContactToUpgradeButton({
  plan,
  className,
  variant = "default",
}: ContactToUpgradeButtonProps) {
  const { language, t } = useI18n();

  const openChat = () => {
    try {
      if (process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID && Crisp.isCrispInjected()) {
        Crisp.chat.show();
        Crisp.chat.open();
        Crisp.message.setMessageText(
          plan === "monthly"
            ? t(
                "pricing.chatMessage.monthly",
                `Hi, I’d like to upgrade to the Pro Monthly plan for ${proPricing.monthly.cad}.`,
              )
            : t(
                "pricing.chatMessage.yearly",
                `Hi, I’d like to upgrade to the Pro Yearly plan for ${proPricing.yearly.cad}.`,
              ),
        );
        return;
      }
    } catch {
      // Fall back to the payment instructions below.
    }

    document
      .getElementById("payment-instructions")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Button
      type="button"
      className={className}
      variant={variant}
      onClick={openChat}
      aria-label={
        plan === "monthly"
          ? t("pricing.chatCta.monthly", "Chat to upgrade monthly")
          : t("pricing.chatCta.yearly", "Chat to upgrade yearly")
      }
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {plan === "monthly"
        ? t("pricing.chatCta.monthly", "Chat to upgrade monthly")
        : t("pricing.chatCta.yearly", "Chat to upgrade yearly")}
      <span className="sr-only">
        {language === "zh" ? "，打开在线客服" : ", opens live chat"}
      </span>
    </Button>
  );
}
