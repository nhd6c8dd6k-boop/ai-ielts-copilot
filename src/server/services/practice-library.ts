import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { hasUsableAudioUrl } from "@/server/services/listening-practice";
import { getSpeakingLibraryCounts } from "@/server/services/speaking-practice";

export type PracticeLibraryStats = {
  readingCount: number;
  listeningCount: number;
  writingCount: number;
  speakingCount: number | null;
  speakingQuestionCount: number | null;
  pendingListeningCount: number;
};

export const getPracticeLibraryStats = cache(async () => {
  if (!isSupabaseConfigured()) {
    return {
      readingCount: 0,
      listeningCount: 0,
      writingCount: 0,
      speakingCount: 0,
      speakingQuestionCount: 0,
      pendingListeningCount: 0,
    } satisfies PracticeLibraryStats;
  }

  const admin = createSupabaseAdminClient();
  const [
    readingResult,
    listeningResult,
    writingResult,
    speakingCounts,
    pendingListeningResult,
  ] = await Promise.all([
    admin
      .from("reading_sets")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    admin
      .from("listening_sets")
      .select("id,audio_url")
      .eq("status", "published")
      .eq("audio_status", "ready")
      .not("audio_url", "is", null),
    admin
      .from("writing_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    getSpeakingLibraryCounts().catch(() => null),
    admin
      .from("listening_sets")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("audio_status", "pending"),
  ]);

  for (const result of [
    readingResult,
    listeningResult,
    writingResult,
    pendingListeningResult,
  ]) {
    if (result.error) {
      throw new Error(result.error.message);
    }
  }

  return {
    readingCount: readingResult.count ?? 0,
    listeningCount: (listeningResult.data ?? []).filter((set) =>
      hasUsableAudioUrl(set.audio_url),
    ).length,
    writingCount: writingResult.count ?? 0,
    speakingCount: speakingCounts?.topicCount ?? null,
    speakingQuestionCount: speakingCounts?.questionCount ?? null,
    pendingListeningCount: pendingListeningResult.count ?? 0,
  } satisfies PracticeLibraryStats;
});
