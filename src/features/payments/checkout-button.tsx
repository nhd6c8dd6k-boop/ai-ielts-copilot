"use client";

import { useState } from "react";
import { Apple, CreditCard, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type PaymentChannel = "wechat" | "alipay" | "apple_pay" | "stripe";

type CheckoutButtonProps = {
  plan: "free" | "pro_monthly" | "pro_yearly";
  channel?: PaymentChannel;
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost";
};

export function CheckoutButton({
  plan,
  channel = "wechat",
  children,
  variant = "default",
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const startCheckout = async () => {
    if (plan === "free") {
      window.location.href = "/register";
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan, channel }),
      });
      const payload = (await response.json()) as { url?: string };

      if (response.status === 401) {
        window.location.href = "/login?checkout=login_required";
        return;
      }

      if (payload.url) {
        window.location.href = payload.url;
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      className="w-full"
      onClick={startCheckout}
      disabled={isLoading}
      variant={variant}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : channel === "apple_pay" ? (
        <Apple className="h-4 w-4" aria-hidden="true" />
      ) : (
        <CreditCard className="h-4 w-4" aria-hidden="true" />
      )}
      {children}
    </Button>
  );
}
