import { cache } from "react";

import { isSupabaseConfigured } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type SpeakingPart = 1 | 2 | 3;

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

export type UsefulPhrase = {
  phrase: string;
  meaning: string;
  example: string;
};

export type VocabularyUpgrade = {
  insteadOf: string;
  try: string[];
  meaning: string;
  example: string;
  context: string;
};

export type SentencePattern = {
  pattern: string;
  example: string;
  suitableUse: string;
};

export type CommonMistake = {
  incorrect: string;
  better: string;
  why: string;
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

export type SpeakingTopicDetail = SpeakingTopicSummary & {
  questions: SpeakingQuestion[];
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
    .select(
      "id,topic_id,question_order,question,answer_tip,cue_card_points,preparation_ideas,suggested_structure,direct_answer,main_reason,example,alternative_perspective,sample_band_6,sample_band_7,sample_band_8,useful_phrases,vocabulary,sentence_patterns,common_mistakes",
    )
    .eq("topic_id", topic.id)
    .order("question_order", { ascending: true });

  if (questionError) {
    throw new Error(questionError.message);
  }

  return {
    ...mapTopicSummary(topic as SpeakingTopicRow, (questions ?? []).length),
    questions: ((questions ?? []) as SpeakingQuestionRow[]).map(mapQuestion),
  } satisfies SpeakingTopicDetail;
});

export const getSpeakingLibraryStats = cache(async () => {
  const topics = await getPublishedSpeakingTopicSummaries();

  return {
    topicCount: topics.length,
    partCounts: {
      1: topics.filter((topic) => topic.part === 1).length,
      2: topics.filter((topic) => topic.part === 2).length,
      3: topics.filter((topic) => topic.part === 3).length,
    },
  };
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
    usefulPhrases: readObjectArray(question.useful_phrases, isUsefulPhrase),
    vocabulary: readObjectArray(question.vocabulary, isVocabularyUpgrade),
    sentencePatterns: readObjectArray(
      question.sentence_patterns,
      isSentencePattern,
    ),
    commonMistakes: readObjectArray(question.common_mistakes, isCommonMistake),
  };
}

function parseSpeakingPart(part: number): SpeakingPart {
  return part === 2 || part === 3 ? part : 1;
}

function parseOptionalNumber(value: number | string | null) {
  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function readStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readObjectArray<T>(
  value: unknown,
  predicate: (value: unknown) => value is T,
) {
  return Array.isArray(value) ? value.filter(predicate) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUsefulPhrase(value: unknown): value is UsefulPhrase {
  return (
    isRecord(value) &&
    typeof value.phrase === "string" &&
    typeof value.meaning === "string" &&
    typeof value.example === "string"
  );
}

function isVocabularyUpgrade(value: unknown): value is VocabularyUpgrade {
  return (
    isRecord(value) &&
    typeof value.insteadOf === "string" &&
    Array.isArray(value.try) &&
    value.try.every((item) => typeof item === "string") &&
    typeof value.meaning === "string" &&
    typeof value.example === "string" &&
    typeof value.context === "string"
  );
}

function isSentencePattern(value: unknown): value is SentencePattern {
  return (
    isRecord(value) &&
    typeof value.pattern === "string" &&
    typeof value.example === "string" &&
    typeof value.suitableUse === "string"
  );
}

function isCommonMistake(value: unknown): value is CommonMistake {
  return (
    isRecord(value) &&
    typeof value.incorrect === "string" &&
    typeof value.better === "string" &&
    typeof value.why === "string"
  );
}
