import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/seo";
import { getPublishedSpeakingSitemapEntries } from "@/server/services/speaking-practice";
import { getPublishedWritingSitemapEntries } from "@/server/services/writing-practice";

const publicRoutes = [
  "",
  "/practice",
  "/practice/reading",
  "/practice/listening",
  "/practice/writing",
  "/practice/speaking",
  "/practice/speaking/part-1",
  "/practice/speaking/part-2",
  "/practice/speaking/part-3",
  "/demo/writing-feedback",
  "/writing-feedback",
  "/writing-score",
  "/pricing",
  "/support",
  "/privacy",
  "/terms",
];

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();
  let speakingTopics: Awaited<
    ReturnType<typeof getPublishedSpeakingSitemapEntries>
  > = [];
  let writingTasks: Awaited<
    ReturnType<typeof getPublishedWritingSitemapEntries>
  > = [];

  const [speakingResult, writingResult] = await Promise.allSettled([
    getPublishedSpeakingSitemapEntries(),
    getPublishedWritingSitemapEntries(),
  ]);

  if (speakingResult.status === "fulfilled") {
    speakingTopics = speakingResult.value;
  }

  if (writingResult.status === "fulfilled") {
    writingTasks = writingResult.value;
  }

  return [
    ...publicRoutes.map((route) => ({
      url: absoluteUrl(route || "/"),
      lastModified,
      changeFrequency: route === "" ? ("weekly" as const) : ("monthly" as const),
      priority: route === "" ? 1 : route.startsWith("/practice") ? 0.8 : 0.6,
    })),
    ...speakingTopics.map((topic) => ({
      url: absoluteUrl(`/practice/speaking/${topic.slug}`),
      lastModified: new Date(topic.createdAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...writingTasks.map((task) => ({
      url: absoluteUrl(`/practice/writing/${task.slug}`),
      lastModified: new Date(task.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
