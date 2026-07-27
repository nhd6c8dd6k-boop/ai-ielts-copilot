import { isGenericWritingTitle } from "@/lib/writing-task-display";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string) {
  return uuidPattern.test(value);
}

export function normalizeWritingSlug(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return slug.slice(0, 100).replace(/-$/g, "");
}

export function buildWritingSlugBase({
  taskType,
  title,
  topic,
  fallbackId,
}: {
  taskType: 1 | 2;
  title?: string | null;
  topic: string;
  fallbackId?: string | null;
}) {
  const normalizedTitle = title?.trim()
    ? normalizeWritingSlug(title)
    : "";

  if (
    normalizedTitle &&
    title &&
    !isGenericWritingTitle(title, topic)
  ) {
    return normalizedTitle;
  }

  const normalizedTopic = normalizeWritingSlug(topic);

  if (normalizedTopic) {
    return normalizeWritingSlug(
      `ielts writing task ${taskType} ${normalizedTopic}`,
    );
  }

  const shortId = fallbackId?.replace(/-/g, "").slice(0, 8);

  return shortId
    ? `ielts-writing-task-${taskType}-${shortId}`
    : `ielts-writing-task-${taskType}`;
}

export function buildUniqueWritingSlug({
  taskType,
  title,
  topic,
  fallbackId,
  existingSlugs,
}: {
  taskType: 1 | 2;
  title?: string | null;
  topic: string;
  fallbackId?: string | null;
  existingSlugs: Iterable<string>;
}) {
  const baseSlug = buildWritingSlugBase({
    taskType,
    title,
    topic,
    fallbackId,
  });
  const taken = new Set(
    Array.from(existingSlugs).map((slug) => slug.toLowerCase()),
  );

  if (!taken.has(baseSlug)) {
    return baseSlug;
  }

  for (let suffix = 2; suffix <= 500; suffix += 1) {
    const candidate = `${baseSlug}-${suffix}`;

    if (!taken.has(candidate)) {
      return candidate;
    }
  }

  throw new Error("Unable to create a unique Writing task slug.");
}
