import { z } from "zod";

export const readingBandSchema = z.union([
  z.literal(5),
  z.literal(6),
  z.literal(7),
  z.literal(8),
  z.literal(9),
]);

export const readingQuestionTypeSchema = z.enum([
  "multiple_choice",
  "true_false_not_given",
  "matching_headings",
  "matching_information",
  "matching_features",
  "sentence_completion",
  "summary_completion",
  "short_answer",
  "gap_filling",
]);

export const generateReadingInputSchema = z.object({
  band: readingBandSchema,
  topic: z.enum([
    "education",
    "technology",
    "environment",
    "science",
    "business",
    "health",
    "medicine",
    "history",
    "psychology",
    "culture",
    "travel",
    "random",
  ]),
  lengthWords: z.union([z.literal(600), z.literal(800), z.literal(1000)]),
  questionTypes: z.array(readingQuestionTypeSchema).min(1).max(9),
});

export const generatedReadingQuestionSchema = z.object({
  type: readingQuestionTypeSchema,
  number: z.number().int().positive(),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanationZh: z.string().min(1),
  explanationEn: z.string().min(1),
  synonyms: z.array(z.string()).default([]),
});

export const generatedReadingSetSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  band: readingBandSchema,
  lengthWords: z.number().int().positive(),
  passage: z.string().min(500),
  questions: z.array(generatedReadingQuestionSchema).min(1),
  vocabulary: z.array(
    z.object({
      word: z.string().min(1),
      meaningZh: z.string().min(1),
      meaningEn: z.string().min(1),
      example: z.string().min(1),
    }),
  ),
});

export type GenerateReadingInput = z.infer<typeof generateReadingInputSchema>;
export type GeneratedReadingSet = z.infer<typeof generatedReadingSetSchema>;
