"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Crisp } from "crisp-sdk-web";

const crispWebsiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID;

let configuredWebsiteId: string | null = null;

export function CrispChat() {
  const pathname = usePathname();
  const shouldLoadCrisp = Boolean(
    crispWebsiteId && !pathname.startsWith("/admin"),
  );

  useEffect(() => {
    if (!crispWebsiteId) {
      return;
    }

    if (!shouldLoadCrisp) {
      if (configuredWebsiteId && Crisp.isCrispInjected()) {
        Crisp.chat.hide();
      }

      return;
    }

    if (configuredWebsiteId !== crispWebsiteId) {
      Crisp.configure(crispWebsiteId, {
        safeMode: true,
      });
      configuredWebsiteId = crispWebsiteId;
    }

    Crisp.chat.show();
  }, [shouldLoadCrisp]);

  return null;
}
