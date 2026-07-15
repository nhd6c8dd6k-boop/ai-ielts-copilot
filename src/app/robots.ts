import type { MetadataRoute } from "next";

const siteUrl = "https://www.aiieltscopilot.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/dashboard",
        "/profile",
        "/result",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
