import type { GenerateWritingTaskInput } from "@/features/ai-writing/schemas";

export const currentWritingTaskStorageKey = "ai-ielts-current-writing-task";

export const writingTaskTypes = [
  { value: 1, label: "Task 1" },
  { value: 2, label: "Task 2" },
] satisfies Array<{ value: GenerateWritingTaskInput["taskType"]; label: string }>;

export const writingTopics = [
  { value: "education", label: "Education" },
  { value: "technology", label: "Technology" },
  { value: "environment", label: "Environment" },
  { value: "work", label: "Work" },
  { value: "health", label: "Health" },
  { value: "culture", label: "Culture" },
  { value: "society", label: "Society" },
  { value: "random", label: "Random" },
] satisfies Array<{ value: GenerateWritingTaskInput["topic"]; label: string }>;

export const writingTargetBands = [6, 7, 8, 9] as const;
