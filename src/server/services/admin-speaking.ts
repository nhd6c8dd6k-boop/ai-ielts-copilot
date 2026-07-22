import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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

export type AdminSpeakingStatus =
  | "draft"
  | "review"
  | "published"
  | "archived";

export type AdminSpeakingSourceType = "manual" | "ai";

export type AdminSpeakingTopicFilters = {
  part?: SpeakingPart;
  status?: AdminSpeakingStatus;
};

export type AdminSpeakingTopicMetadataInput = {
  title: string;
  slug: string;
  part: SpeakingPart;
  description: string;
  targetBand: number;
  sourceType: AdminSpeakingSourceType;
  status: AdminSpeakingStatus;
};

export type AdminSpeakingTopicSummary = {
  id: string;
  slug: string;
  part: SpeakingPart;
  title: string;
  description: string;
  status: AdminSpeakingStatus;
  targetBand: number | null;
  sourceType: AdminSpeakingSourceType;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questionCount: number;
};

export type AdminSpeakingQuestion = {
  id: string;
  topicId: string;
  questionOrder: number;
  question: string;
  answerTip: string | null;
  cueCardPoints: string[];
  preparationIdeas: string[];
  suggestedStructure: string[];
  directAnswer: string | null;
  mainReason: string | null;
  example: string | null;
  alternativePerspective: string | null;
  sampleBand6: string;
  sampleBand7: string;
  sampleBand8: string;
  usefulPhrases: UsefulPhrase[];
  vocabulary: VocabularyUpgrade[];
  sentencePatterns: SentencePattern[];
  commonMistakes: CommonMistake[];
  createdAt: string;
  updatedAt: string;
};

export type AdminSpeakingTopicDetail = AdminSpeakingTopicSummary & {
  questions: AdminSpeakingQuestion[];
};

type AdminSpeakingTopicRow = {
  id: string;
  slug: string;
  part: number;
  title: string;
  description: string;
  status: string;
  target_band: number | string | null;
  source_type: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

type AdminSpeakingQuestionRow = {
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
  created_at: string;
  updated_at: string;
};

const topicSummarySelect =
  "id,slug,part,title,description,status,target_band,source_type,published_at,created_at,updated_at";

const questionDetailSelect =
  "id,topic_id,question_order,question,answer_tip,cue_card_points,preparation_ideas,suggested_structure,direct_answer,main_reason,example,alternative_perspective,sample_band_6,sample_band_7,sample_band_8,useful_phrases,vocabulary,sentence_patterns,common_mistakes,created_at,updated_at";

export async function getAdminSpeakingTopicSummaries(
  filters: AdminSpeakingTopicFilters = {},
) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("speaking_topics")
    .select(topicSummarySelect)
    .order("part", { ascending: true })
    .order("title", { ascending: true });

  if (filters.part) {
    query = query.eq("part", filters.part);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const topicRows = (data ?? []) as AdminSpeakingTopicRow[];
  const questionCounts = await getQuestionCounts(topicRows.map((topic) => topic.id));

  return topicRows.map((topic) =>
    mapTopicSummary(topic, questionCounts.get(topic.id) ?? 0),
  );
}

export async function getAdminSpeakingTopicDetailById(id: string) {
  const admin = createSupabaseAdminClient();
  const { data: topic, error } = await admin
    .from("speaking_topics")
    .select(topicSummarySelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!topic) {
    return null;
  }

  const { data: questions, error: questionError } = await admin
    .from("speaking_questions")
    .select(questionDetailSelect)
    .eq("topic_id", id)
    .order("question_order", { ascending: true });

  if (questionError) {
    throw new Error(questionError.message);
  }

  const questionRows = (questions ?? []) as AdminSpeakingQuestionRow[];

  return {
    ...mapTopicSummary(topic as AdminSpeakingTopicRow, questionRows.length),
    questions: questionRows.map(mapQuestion),
  } satisfies AdminSpeakingTopicDetail;
}

export async function createAdminSpeakingTopicMetadata({
  input,
  adminUserId,
}: {
  input: AdminSpeakingTopicMetadataInput;
  adminUserId: string;
}) {
  const admin = createSupabaseAdminClient();
  const publishedAt = input.status === "published" ? new Date().toISOString() : null;

  const { data, error } = await admin
    .from("speaking_topics")
    .insert({
      title: input.title,
      slug: input.slug,
      part: input.part,
      description: input.description,
      target_band: input.targetBand,
      source_type: toDatabaseSourceType(input.sourceType),
      status: input.status,
      published_at: publishedAt,
      created_by: adminUserId,
    })
    .select(topicSummarySelect)
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw createSafeServiceError("Speaking topic slug already exists.", 409);
    }

    throw new Error(error.message);
  }

  const topic = await mapTopicSummaryWithQuestionCount(
    data as AdminSpeakingTopicRow,
  );

  await writeAdminSpeakingLog({
    adminUserId,
    action: "speaking_topic_created",
    targetId: topic.id,
    metadata: {
      slug: topic.slug,
      part: topic.part,
      status: topic.status,
      sourceType: topic.sourceType,
    },
  });

  return topic;
}

export async function updateAdminSpeakingTopicMetadata({
  id,
  input,
  adminUserId,
}: {
  id: string;
  input: AdminSpeakingTopicMetadataInput;
  adminUserId: string;
}) {
  const admin = createSupabaseAdminClient();

  const { data: existing, error: existingError } = await admin
    .from("speaking_topics")
    .select(topicSummarySelect)
    .eq("id", id)
    .maybeSingle();

  if (existingError) {
    throw new Error(existingError.message);
  }

  if (!existing) {
    return null;
  }

  const existingTopic = existing as AdminSpeakingTopicRow;
  const publishedAt =
    input.status === "published"
      ? existingTopic.published_at ?? new Date().toISOString()
      : null;

  const { data, error } = await admin
    .from("speaking_topics")
    .update({
      title: input.title,
      slug: input.slug,
      part: input.part,
      description: input.description,
      target_band: input.targetBand,
      source_type: toDatabaseSourceType(input.sourceType),
      status: input.status,
      published_at: publishedAt,
    })
    .eq("id", id)
    .select(topicSummarySelect)
    .single();

  if (error) {
    if (isUniqueViolation(error)) {
      throw createSafeServiceError("Speaking topic slug already exists.", 409);
    }

    throw new Error(error.message);
  }

  const topic = await mapTopicSummaryWithQuestionCount(
    data as AdminSpeakingTopicRow,
  );

  await writeAdminSpeakingLog({
    adminUserId,
    action: "speaking_topic_updated",
    targetId: topic.id,
    metadata: {
      previousSlug: existingTopic.slug,
      slug: topic.slug,
      part: topic.part,
      status: topic.status,
      sourceType: topic.sourceType,
    },
  });

  return topic;
}

async function getQuestionCounts(topicIds: string[]) {
  if (!topicIds.length) {
    return new Map<string, number>();
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("speaking_questions")
    .select("topic_id")
    .in("topic_id", topicIds);

  if (error) {
    throw new Error(error.message);
  }

  const counts = new Map<string, number>();

  (data ?? []).forEach((question) => {
    counts.set(question.topic_id, (counts.get(question.topic_id) ?? 0) + 1);
  });

  return counts;
}

async function mapTopicSummaryWithQuestionCount(topic: AdminSpeakingTopicRow) {
  const questionCounts = await getQuestionCounts([topic.id]);

  return mapTopicSummary(topic, questionCounts.get(topic.id) ?? 0);
}

function mapTopicSummary(
  topic: AdminSpeakingTopicRow,
  questionCount: number,
): AdminSpeakingTopicSummary {
  return {
    id: topic.id,
    slug: topic.slug,
    part: parseSpeakingPart(topic.part),
    title: topic.title,
    description: topic.description,
    status: parseStatus(topic.status),
    targetBand: parseOptionalNumber(topic.target_band),
    sourceType: fromDatabaseSourceType(topic.source_type),
    publishedAt: topic.published_at,
    createdAt: topic.created_at,
    updatedAt: topic.updated_at,
    questionCount,
  };
}

function toDatabaseSourceType(sourceType: AdminSpeakingSourceType) {
  if (sourceType === "ai") {
    return "ai_generated";
  }

  return "admin_original";
}

function fromDatabaseSourceType(sourceType: string): AdminSpeakingSourceType {
  if (sourceType === "ai_generated") {
    return "ai";
  }

  return "manual";
}

function createSafeServiceError(message: string, status: number) {
  const error = new Error(message) as Error & {
    safeMessage: string;
    status: number;
  };
  error.safeMessage = message;
  error.status = status;
  return error;
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (
    (error as { code?: unknown }).code === "23505"
  );
}

async function writeAdminSpeakingLog({
  adminUserId,
  action,
  targetId,
  metadata,
}: {
  adminUserId: string;
  action: string;
  targetId: string;
  metadata: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: "speaking_topic",
    target_id: targetId,
    metadata,
  });
}

function mapQuestion(question: AdminSpeakingQuestionRow): AdminSpeakingQuestion {
  return {
    id: question.id,
    topicId: question.topic_id,
    questionOrder: question.question_order,
    question: question.question,
    answerTip: question.answer_tip,
    cueCardPoints: readStringArray(question.cue_card_points),
    preparationIdeas: readStringArray(question.preparation_ideas),
    suggestedStructure: readStringArray(question.suggested_structure),
    directAnswer: question.direct_answer,
    mainReason: question.main_reason,
    example: question.example,
    alternativePerspective: question.alternative_perspective,
    sampleBand6: question.sample_band_6,
    sampleBand7: question.sample_band_7,
    sampleBand8: question.sample_band_8,
    usefulPhrases: readUsefulPhrases(question.useful_phrases),
    vocabulary: readVocabularyUpgrades(question.vocabulary),
    sentencePatterns: readSentencePatterns(question.sentence_patterns),
    commonMistakes: readCommonMistakes(question.common_mistakes),
    createdAt: question.created_at,
    updatedAt: question.updated_at,
  };
}

function parseStatus(status: string): AdminSpeakingStatus {
  return status === "review" ||
    status === "published" ||
    status === "archived"
    ? status
    : "draft";
}
