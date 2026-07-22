import type {
  AdminSpeakingQuestion,
  AdminSpeakingStatus,
  AdminSpeakingTopicDetail,
  AdminSpeakingTopicSummary,
} from "./speaking-types";

export async function readJsonResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function parseSpeakingTopicsPayload(
  payload: unknown,
): AdminSpeakingTopicSummary[] {
  if (!isRecord(payload) || !Array.isArray(payload.topics)) {
    throw new Error("Speaking topics response was malformed.");
  }

  if (!payload.topics.every(isAdminSpeakingTopicSummary)) {
    throw new Error("Speaking topics response was malformed.");
  }

  return payload.topics;
}

export function parseSpeakingDetailPayload(
  payload: unknown,
): AdminSpeakingTopicDetail {
  if (!isRecord(payload) || !isAdminSpeakingTopicDetail(payload.topic)) {
    throw new Error("Speaking topic response was malformed.");
  }

  return payload.topic;
}

function isAdminSpeakingTopicDetail(
  value: unknown,
): value is AdminSpeakingTopicDetail {
  if (!isRecord(value)) {
    return false;
  }

  const questions = value.questions;

  return (
    isAdminSpeakingTopicSummary(value) &&
    Array.isArray(questions) &&
    questions.every(isAdminSpeakingQuestion)
  );
}

function isAdminSpeakingTopicSummary(
  value: unknown,
): value is AdminSpeakingTopicSummary {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    isSpeakingPart(value.part) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    isSpeakingStatus(value.status) &&
    (typeof value.targetBand === "number" || value.targetBand === null) &&
    typeof value.sourceType === "string" &&
    (typeof value.publishedAt === "string" || value.publishedAt === null) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string" &&
    typeof value.questionCount === "number"
  );
}

function isAdminSpeakingQuestion(value: unknown): value is AdminSpeakingQuestion {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.topicId === "string" &&
    typeof value.questionOrder === "number" &&
    typeof value.question === "string" &&
    (typeof value.answerTip === "string" || value.answerTip === null) &&
    isStringArray(value.cueCardPoints) &&
    isStringArray(value.preparationIdeas) &&
    isStringArray(value.suggestedStructure) &&
    (typeof value.directAnswer === "string" || value.directAnswer === null) &&
    (typeof value.mainReason === "string" || value.mainReason === null) &&
    (typeof value.example === "string" || value.example === null) &&
    (typeof value.alternativePerspective === "string" ||
      value.alternativePerspective === null) &&
    typeof value.sampleBand6 === "string" &&
    typeof value.sampleBand7 === "string" &&
    typeof value.sampleBand8 === "string" &&
    Array.isArray(value.usefulPhrases) &&
    value.usefulPhrases.every(isAdminUsefulPhrase) &&
    Array.isArray(value.vocabulary) &&
    value.vocabulary.every(isAdminVocabulary) &&
    Array.isArray(value.sentencePatterns) &&
    value.sentencePatterns.every(isAdminSentencePattern) &&
    Array.isArray(value.commonMistakes) &&
    value.commonMistakes.every(isAdminCommonMistake) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isAdminUsefulPhrase(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.phrase === "string" &&
    typeof value.meaning === "string" &&
    typeof value.example === "string"
  );
}

function isAdminVocabulary(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.insteadOf === "string" &&
    isStringArray(value.try) &&
    typeof value.meaning === "string" &&
    typeof value.example === "string" &&
    typeof value.context === "string"
  );
}

function isAdminSentencePattern(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.pattern === "string" &&
    typeof value.example === "string" &&
    typeof value.suitableUse === "string"
  );
}

function isAdminCommonMistake(value: unknown) {
  return (
    isRecord(value) &&
    typeof value.incorrect === "string" &&
    typeof value.better === "string" &&
    typeof value.why === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isSpeakingPart(value: unknown): value is 1 | 2 | 3 {
  return value === 1 || value === 2 || value === 3;
}

function isSpeakingStatus(value: unknown): value is AdminSpeakingStatus {
  return (
    value === "draft" ||
    value === "review" ||
    value === "published" ||
    value === "archived"
  );
}
