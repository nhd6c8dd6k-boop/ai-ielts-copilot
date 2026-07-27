import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { buildUniqueWritingSlug } from "@/lib/writing-task-slug";

export async function createUniqueWritingTaskSlug({
  taskType,
  title,
  topic,
  fallbackId,
  excludeId,
}: {
  taskType: 1 | 2;
  title?: string | null;
  topic: string;
  fallbackId?: string | null;
  excludeId?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("writing_tasks")
    .select("id,slug")
    .limit(1000);

  if (error) {
    throw new Error(error.message);
  }

  return buildUniqueWritingSlug({
    taskType,
    title,
    topic,
    fallbackId,
    existingSlugs: (data ?? [])
      .filter((task) => task.id !== excludeId)
      .map((task) => task.slug)
      .filter(
        (slug): slug is string => typeof slug === "string" && slug.length > 0,
      ),
  });
}
