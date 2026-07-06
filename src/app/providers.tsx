"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

import { LanguageProvider } from "@/components/i18n/language-provider";
import type { Language } from "@/lib/i18n/messages";

export function Providers({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage: Language;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider initialLanguage={initialLanguage}>
        {children}
      </LanguageProvider>
    </QueryClientProvider>
  );
}
