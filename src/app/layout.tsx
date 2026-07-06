import type { Metadata } from "next";
import { cookies, headers } from "next/headers";

import {
  getHtmlLang,
  languageCookieName,
  normalizeLanguage,
} from "@/lib/i18n/language";
import type { Language } from "@/lib/i18n/messages";

import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI IELTS Copilot",
    template: "%s | AI IELTS Copilot",
  },
  description:
    "AI generated IELTS practice, estimated scoring, and Computer IELTS simulation.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const requestHeaders = await headers();
  const initialLanguage =
    normalizeLanguage(cookieStore.get(languageCookieName)?.value) ??
    normalizeLanguage(requestHeaders.get("accept-language")) ??
    ("zh" satisfies Language);

  return (
    <html lang={getHtmlLang(initialLanguage)} className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
      </body>
    </html>
  );
}
