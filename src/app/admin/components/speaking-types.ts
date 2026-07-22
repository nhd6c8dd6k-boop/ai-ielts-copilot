export type AdminSpeakingStatus = "draft" | "review" | "published" | "archived";

export type AdminSpeakingSourceType = "manual" | "ai";

export type AdminSpeakingPartFilter = "all" | "1" | "2" | "3";

export type AdminSpeakingStatusFilter = "all" | AdminSpeakingStatus;

export type AdminSpeakingTopicCountState =
  | { status: "idle" }
  | { status: "success"; count: number }
  | { status: "error" };

export type AdminSpeakingTopicSummary = {
  id: string;
  slug: string;
  part: 1 | 2 | 3;
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
  usefulPhrases: Array<{
    phrase: string;
    meaning: string;
    example: string;
  }>;
  vocabulary: Array<{
    insteadOf: string;
    try: string[];
    meaning: string;
    example: string;
    context: string;
  }>;
  sentencePatterns: Array<{
    pattern: string;
    example: string;
    suitableUse: string;
  }>;
  commonMistakes: Array<{
    incorrect: string;
    better: string;
    why: string;
  }>;
  createdAt: string;
  updatedAt: string;
};

export type AdminSpeakingTopicDetail = AdminSpeakingTopicSummary & {
  questions: AdminSpeakingQuestion[];
};
