export const siteName = "AI IELTS Copilot";
export const productionSiteUrl = "https://www.aiieltscopilot.com";

export const siteDescription =
  "Practice IELTS Reading, Listening, Writing and Speaking with AI-powered feedback and computer-based test preparation.";

export function getPublicSiteUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!rawUrl) {
    return productionSiteUrl;
  }

  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return productionSiteUrl;
    }

    return url.origin;
  } catch {
    return productionSiteUrl;
  }
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${getPublicSiteUrl()}${normalizedPath}`;
}

