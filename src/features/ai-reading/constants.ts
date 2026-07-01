import type { GenerateReadingInput } from "@/features/ai-reading/schemas";

export const currentReadingSetStorageKey = "ai-ielts-current-reading-set";
export const currentReadingAnswersStorageKey = "ai-ielts-reading-answers";

export const readingBands = [5, 6, 7, 8, 9] as const;

export const readingTopics = [
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
  { value: "environment", label: "Environment" },
  { value: "science", label: "Science" },
  { value: "business", label: "Business" },
  { value: "health", label: "Health" },
  { value: "medicine", label: "Medicine" },
  { value: "history", label: "History" },
  { value: "psychology", label: "Psychology" },
  { value: "culture", label: "Culture" },
  { value: "travel", label: "Travel" },
  { value: "random", label: "Random" },
] satisfies Array<{ value: GenerateReadingInput["topic"]; label: string }>;

export const readingLengths = [600, 800, 1000] as const;

export const readingQuestionTypes = [
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "true_false_not_given", label: "True False Not Given" },
  { value: "matching_headings", label: "Matching Headings" },
  { value: "matching_information", label: "Matching Information" },
  { value: "matching_features", label: "Matching Features" },
  { value: "sentence_completion", label: "Sentence Completion" },
  { value: "summary_completion", label: "Summary Completion" },
  { value: "short_answer", label: "Short Answer" },
  { value: "gap_filling", label: "Gap Filling" },
] satisfies Array<{
  value: GenerateReadingInput["questionTypes"][number];
  label: string;
}>;
