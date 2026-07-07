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

const publicSiteUrl = "https://aiieltscopilot.com";
const siteDescription =
  "Computer IELTS-style Reading, Listening, and Writing practice with automatic scoring, AI writing feedback, and dashboard progress tracking.";

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: "AI IELTS Copilot",
    template: "%s | AI IELTS Copilot",
  },
  description: siteDescription,
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: publicSiteUrl,
    siteName: "AI IELTS Copilot",
    title: "AI IELTS Copilot",
    description: siteDescription,
  },
  twitter: {
    card: "summary",
    title: "AI IELTS Copilot",
    description: siteDescription,
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
