import { z } from "zod";

export const writingTaskTypeSchema = z.union([z.literal(1), z.literal(2)]);

export const generateWritingTaskInputSchema = z.object({
  taskType: writingTaskTypeSchema,
  topic: z.enum([
    "education",
    "technology",
    "environment",
    "work",
    "health",
    "culture",
    "society",
    "random",
  ]),
  targetBand: z.union([
    z.literal(6),
    z.literal(7),
    z.literal(8),
    z.literal(9),
  ]),
});

export const generatedWritingTaskSchema = z.object({
  taskType: writingTaskTypeSchema,
  topic: z.string().min(1),
  targetBand: z.number().min(6).max(9),
  title: z.string().min(1),
  prompt: z.string().min(1),
  requirements: z.array(z.string()).min(1),
});

export const gradeWritingInputSchema = z.object({
  task: generatedWritingTaskSchema,
  essay: z.string().min(80),
  language: z.enum(["zh", "en"]).default("en"),
});

export const writingFeedbackSchema = z.object({
  overallBand: z.number().min(0).max(9),
  criteria: z.object({
    taskResponse: z.number().min(0).max(9),
    coherenceCohesion: z.number().min(0).max(9),
    lexicalResource: z.number().min(0).max(9),
    grammaticalRangeAccuracy: z.number().min(0).max(9),
  }),
  feedback: z.string().min(1),
  scoreSummary: z.array(z.string().min(1)).min(3).max(5),
  grammarIssues: z.array(z.string()).default([]),
  vocabularyUpgrades: z.array(z.string()).default([]),
  band7Sample: z.string().min(1),
  band8Sample: z.string().min(1),
  band9Sample: z.string().min(1),
  nextSteps: z.array(z.string()).min(1),
});

export type GenerateWritingTaskInput = z.infer<
  typeof generateWritingTaskInputSchema
>;
export type GeneratedWritingTask = z.infer<typeof generatedWritingTaskSchema>;
export type GradeWritingInput = z.infer<typeof gradeWritingInputSchema>;
export type WritingFeedback = z.infer<typeof writingFeedbackSchema>;
