import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  isProSubscription,
  parseMembershipPlan,
  type MembershipPlan,
} from "@/server/services/memberships";
import {
  parseOptionalNumber,
  parseSpeakingPart,
  readCommonMistakes,
  readSentencePatterns,
  readStringArray,
  readUsefulPhrases,
  readVocabularyUpgrades,
  type CommonMistake,
  type SentencePattern,
  type SpeakingPart,
  type UsefulPhrase,
  type VocabularyUpgrade,
} from "@/server/services/speaking-content-parser";
import {
  FREE_SPEAKING_DAILY_QUESTION_LIMIT,
  getUsageDayRange,
} from "@/server/services/usage-limit-rules";

export type {
  CommonMistake,
  SentencePattern,
  SpeakingPart,
  UsefulPhrase,
  VocabularyUpgrade,
} from "@/server/services/speaking-content-parser";

export type SpeakingTopicSummary = {
  id: string;
  slug: string;
  part: SpeakingPart;
  title: string;
  description: string;
  targetBand: number | null;
  questionCount: number;
  createdAt: string;
};

export type SpeakingQuestion = {
  id: string;
  order: number;
  question: string;
  answerTip: string | null;
  cueCardPoints: string[];
  preparationIdeas: string[];
  suggestedStructure: string[];
  directAnswer: string | null;
  mainReason: string | null;
  example: string | null;
  alternativePerspective: string | null;
  samples: {
    band6: string;
    band7: string;
    band8: string;
  };
  usefulPhrases: UsefulPhrase[];
  vocabulary: VocabularyUpgrade[];
  sentencePatterns: SentencePattern[];
  commonMistakes: CommonMistake[];
};

export type SpeakingQuestionSummary = {
  id: string;
  order: number;
};

export type SpeakingTopicDetail = SpeakingTopicSummary & {
  questions: SpeakingQuestionSummary[];
};

export type SpeakingUsageSummary = {
  isSignedIn: boolean;
  isUnlimited: boolean;
  plan: MembershipPlan;
  isAdmin: boolean;
  isPro: boolean;
  usedToday: number;
  limitToday: number | null;
  remainingToday: number | null;
  resetsAt: string;
  timezone: "UTC";
  unlockedQuestionIds: string[];
};

export type SpeakingLibraryCounts = {
  topicCount: number;
  questionCount: number;
  partCounts: Record<SpeakingPart, number>;
};

type SpeakingTopicRow = {
  id: string;
  slug: string;
  part: number;
  title: string;
  description: string;
  target_band: number | string | null;
  created_at: string;
};

type SpeakingQuestionRow = {
  id: string;
  topic_id: string;
  question_order: number;
  question: string;
  answer_tip: string | null;
  cue_card_points: unknown;
  preparation_ideas: unknown;
  suggested_structure: unknown;
  direct_answer: string | null;
  main_reason: string | null;
  example: string | null;
  alternative_perspective: string | null;
  sample_band_6: string;
  sample_band_7: string;
  sample_band_8: string;
  useful_phrases: unknown;
  vocabulary: unknown;
  sentence_patterns: unknown;
  common_mistakes: unknown;
};

type SpeakingQuestionSummaryRow = {
  id: string;
  question_order: number;
};

type SpeakingUnlockRow = {
  question_id: string;
};

export const getPublishedSpeakingTopicSummaries = cache(async () => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const admin = createSupabaseAdminClient();
  const { data: topics, error } = await admin
    .from("speaking_topics")
    .select("id,slug,part,title,description,target_band,created_at")
    .eq("status", "published")
    .order("part", { ascending: true })
    .order("title", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const topicRows = (topics ?? []) as SpeakingTopicRow[];
  const questionCounts = await getQuestionCounts(topicRows.map((topic) => topic.id));

  return topicRows.map((topic) =>
    mapTopicSummary(topic, questionCounts.get(topic.id) ?? 0),
  );
});

export const getPublishedSpeakingTopicsByPart = cache(
  async (part: SpeakingPart) => {
    const topics = await getPublishedSpeakingTopicSummaries();

    return topics.filter((topic) => topic.part === part);
  },
);

export const getPublishedSpeakingTopicBySlug = cache(async (slug: string) => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: topic, error } = await admin
    .from("speaking_topics")
    .select("id,slug,part,title,description,target_band,created_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!topic) {
    return null;
  }

  const { data: questions, error: questionError } = await admin
    .from("speaking_questions")
    .select("id,question_order")
    .eq("topic_id", topic.id)
    .order("question_order", { ascending: true });

  if (questionError) {
    throw new Error(questionError.message);
  }

  return {
    ...mapTopicSummary(topic as SpeakingTopicRow, (questions ?? []).length),
    questions: ((questions ?? []) as SpeakingQuestionSummaryRow[]).map(
      mapQuestionSummary,
    ),
  } satisfies SpeakingTopicDetail;
});

export async function getPublishedSpeakingQuestionById(questionId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("speaking_questions")
    .select(
      "id,topic_id,question_order,question,answer_tip,cue_card_points,preparation_ideas,suggested_structure,direct_answer,main_reason,example,alternative_perspective,sample_band_6,sample_band_7,sample_band_8,useful_phrases,vocabulary,sentence_patterns,common_mistakes,speaking_topics!inner(status)",
    )
    .eq("id", questionId)
    .eq("speaking_topics.status", "published")
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapQuestion(data as SpeakingQuestionRow) : null;
}

export async function getSpeakingUsageSummary(
  userId: string | null,
): Promise<SpeakingUsageSummary> {
  const dayRange = getUsageDayRange();

  if (!userId || !isSupabaseConfigured()) {
    return {
      isSignedIn: Boolean(userId),
      isUnlimited: false,
      plan: "free",
      isAdmin: false,
      isPro: false,
      usedToday: 0,
      limitToday: FREE_SPEAKING_DAILY_QUESTION_LIMIT,
      remainingToday: FREE_SPEAKING_DAILY_QUESTION_LIMIT,
      resetsAt: dayRange.endOfDay.toISOString(),
      timezone: dayRange.timezone,
      unlockedQuestionIds: [],
    };
  }

  const admin = createSupabaseAdminClient();
  const [profileResult, subscriptionResult, unlockResult] = await Promise.all([
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
    admin
      .from("subscriptions")
      .select("plan,status,expires_at,current_period_end")
      .eq("user_id", userId)
      .maybeSingle(),
    admin
      .from("speaking_question_unlocks")
      .select("question_id")
      .eq("user_id", userId)
      .eq("usage_date", dayRange.startOfDay.toISOString().slice(0, 10)),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }

  if (subscriptionResult.error) {
    throw new Error(subscriptionResult.error.message);
  }

  if (unlockResult.error) {
    throw new Error(unlockResult.error.message);
  }

  const subscription = subscriptionResult.data;
  const isAdmin = profileResult.data?.role === "admin";
  const isPro = isProSubscription(subscription);
  const plan = parseMembershipPlan(subscription?.plan);
  const unlockedQuestionIds = ((unlockResult.data ?? []) as SpeakingUnlockRow[])
    .map((row) => row.question_id)
    .filter(Boolean);
  const usedToday = new Set(unlockedQuestionIds).size;
  const isUnlimited = isAdmin || isPro;

  return {
    isSignedIn: true,
    isUnlimited,
    plan,
    isAdmin,
    isPro,
    usedToday,
    limitToday: isUnlimited ? null : FREE_SPEAKING_DAILY_QUESTION_LIMIT,
    remainingToday: isUnlimited
      ? null
      : Math.max(0, FREE_SPEAKING_DAILY_QUESTION_LIMIT - usedToday),
    resetsAt: dayRange.endOfDay.toISOString(),
    timezone: dayRange.timezone,
    unlockedQuestionIds,
  };
}

export const getSpeakingLibraryStats = cache(async () => {
  return getSpeakingLibraryCounts();
});

export const getSpeakingLibraryCounts = cache(async () => {
  if (!isSupabaseConfigured()) {
    return {
      topicCount: 0,
      questionCount: 0,
      partCounts: {
        1: 0,
        2: 0,
        3: 0,
      },
    } satisfies SpeakingLibraryCounts;
  }

  const admin = createSupabaseAdminClient();
  const { data: topics, error } = await admin
    .from("speaking_topics")
    .select("id,part")
    .eq("status", "published");

  if (error) {
    throw new Error(error.message);
  }

  const topicRows = (topics ?? []) as Pick<SpeakingTopicRow, "id" | "part">[];
  const questionCounts = await getQuestionCounts(topicRows.map((topic) => topic.id));
  const partCounts = topicRows.reduce(
    (counts, topic) => {
      const part = parseSpeakingPart(topic.part);

      return {
        ...counts,
        [part]: counts[part] + 1,
      };
    },
    {
      1: 0,
      2: 0,
      3: 0,
    } as Record<SpeakingPart, number>,
  );

  return {
    topicCount: topicRows.length,
    questionCount: Array.from(questionCounts.values()).reduce(
      (total, count) => total + count,
      0,
    ),
    partCounts,
  } satisfies SpeakingLibraryCounts;
});

export const getPublishedSpeakingSitemapEntries = cache(async () => {
  const topics = await getPublishedSpeakingTopicSummaries();

  return topics.map((topic) => ({
    slug: topic.slug,
    createdAt: topic.createdAt,
  }));
});

async function getQuestionCounts(topicIds: string[]) {
  if (!topicIds.length) {
    return new Map<string, number>();
  }

  const admin = createSupabaseAdminClient();
  const { data: questions, error } = await admin
    .from("speaking_questions")
    .select("topic_id")
    .in("topic_id", topicIds);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();

  (questions ?? []).forEach((question) => {
    counts.set(question.topic_id, (counts.get(question.topic_id) ?? 0) + 1);
  });

  return counts;
}

function mapTopicSummary(
  topic: SpeakingTopicRow,
  questionCount: number,
): SpeakingTopicSummary {
  return {
    id: topic.id,
    slug: topic.slug,
    part: parseSpeakingPart(topic.part),
    title: topic.title,
    description: topic.description,
    targetBand: parseOptionalNumber(topic.target_band),
    questionCount,
    createdAt: topic.created_at,
  };
}

function mapQuestionSummary(
  question: SpeakingQuestionSummaryRow,
): SpeakingQuestionSummary {
  return {
    id: question.id,
    order: question.question_order,
  };
}

function mapQuestion(question: SpeakingQuestionRow): SpeakingQuestion {
  return {
    id: question.id,
    order: question.question_order,
    question: question.question,
    answerTip: question.answer_tip,
    cueCardPoints: readStringArray(question.cue_card_points),
    preparationIdeas: readStringArray(question.preparation_ideas),
    suggestedStructure: readStringArray(question.suggested_structure),
    directAnswer: question.direct_answer,
    mainReason: question.main_reason,
    example: question.example,
    alternativePerspective: question.alternative_perspective,
    samples: {
      band6: question.sample_band_6,
      band7: question.sample_band_7,
      band8: question.sample_band_8,
    },
    usefulPhrases: readUsefulPhrases(question.useful_phrases),
    vocabulary: readVocabularyUpgrades(question.vocabulary),
    sentencePatterns: readSentencePatterns(question.sentence_patterns),
    commonMistakes: readCommonMistakes(question.common_mistakes),
  };
}
