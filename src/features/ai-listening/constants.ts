import type { GenerateListeningInput } from "@/features/ai-listening/schemas";

export const listeningSections = [1, 2, 3, 4] as const;

export const listeningTopics = [
  { value: "accommodation", label: "Accommodation" },
  { value: "campus", label: "Campus" },
  { value: "travel", label: "Travel" },
  { value: "work", label: "Work" },
  { value: "science", label: "Science" },
  { value: "health", label: "Health" },
  { value: "environment", label: "Environment" },
  { value: "random", label: "Random" },
] satisfies Array<{ value: GenerateListeningInput["topic"]; label: string }>;

export const listeningQuestionTypes = [
  { value: "form_completion", label: "Form Completion" },
  { value: "table_completion", label: "Table Completion" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "matching", label: "Matching" },
  { value: "sentence_completion", label: "Sentence Completion" },
  { value: "map_labelling", label: "Map Labelling" },
] satisfies Array<{
  value: GenerateListeningInput["questionTypes"][number];
  label: string;
}>;
