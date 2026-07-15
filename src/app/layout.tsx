import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Analytics } from "@vercel/analytics/next";

import { ClickAnalytics } from "@/components/analytics/click-analytics";
import {
  getHtmlLang,
  languageCookieName,
  normalizeLanguage,
} from "@/lib/i18n/language";
import type { Language } from "@/lib/i18n/messages";
import {
  absoluteUrl,
  getBingWebmasterVerification,
  getPublicSiteUrl,
  siteDescription,
  siteName,
} from "@/lib/seo";

import { Providers } from "./providers";
import "./globals.css";

const publicSiteUrl = getPublicSiteUrl();
const bingWebmasterVerification = getBingWebmasterVerification();

export const metadata: Metadata = {
  metadataBase: new URL(publicSiteUrl),
  title: {
    default: "AI IELTS Copilot | IELTS Practice with AI Feedback",
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
    siteName,
    title: "AI IELTS Copilot | IELTS Practice with AI Feedback",
    description: siteDescription,
    images: [
      {
        url: "/icon.png",
        width: 512,
        height: 512,
        alt: "AI IELTS Copilot icon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "AI IELTS Copilot | IELTS Practice with AI Feedback",
    description: siteDescription,
    images: ["/icon.png"],
  },
  ...(bingWebmasterVerification
    ? {
        verification: {
          other: {
            "msvalidate.01": bingWebmasterVerification,
          },
        },
      }
    : {}),
};

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: publicSiteUrl,
    description: siteDescription,
    inLanguage: ["en", "zh-CN"],
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: siteName,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: publicSiteUrl,
    description: siteDescription,
    offers: {
      "@type": "Offer",
      category: "Free and Pro membership",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteName,
    url: publicSiteUrl,
    logo: absoluteUrl("/icon.png"),
  },
];

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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Providers initialLanguage={initialLanguage}>{children}</Providers>
        <Analytics />
        <ClickAnalytics />
      </body>
    </html>
  );
}
