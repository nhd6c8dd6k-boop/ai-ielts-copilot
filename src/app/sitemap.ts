import type { MetadataRoute } from "next";

const siteUrl = "https://www.aiieltscopilot.com";

const publicRoutes = [
  "",
  "/practice",
  "/practice/reading",
  "/practice/listening",
  "/practice/writing",
  "/demo/writing-feedback",
  "/writing-score",
  "/pricing",
  "/support",
  "/privacy",
  "/terms",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/practice") ? 0.8 : 0.6,
  }));
}
