import { z } from "zod";

export const listeningSectionSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
]);

export const listeningQuestionTypeSchema = z.enum([
  "form_completion",
  "table_completion",
  "multiple_choice",
  "matching",
  "sentence_completion",
  "map_labelling",
]);

export const generateListeningInputSchema = z.object({
  section: listeningSectionSchema,
  topic: z.enum([
    "accommodation",
    "campus",
    "travel",
    "work",
    "science",
    "health",
    "environment",
    "random",
  ]),
  questionTypes: z.array(listeningQuestionTypeSchema).min(1).max(6),
});

export const generatedListeningQuestionSchema = z.object({
  type: listeningQuestionTypeSchema,
  number: z.number().int().positive(),
  prompt: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanationZh: z.string().min(1),
  explanationEn: z.string().min(1),
});

export const generatedListeningSetSchema = z.object({
  title: z.string().min(1),
  section: listeningSectionSchema,
  topic: z.string().min(1),
  script: z.string().min(300),
  questions: z.array(generatedListeningQuestionSchema).min(1),
  vocabulary: z.array(
    z.object({
      word: z.string().min(1),
      meaningZh: z.string().min(1),
      meaningEn: z.string().min(1),
    }),
  ),
});

export type GenerateListeningInput = z.infer<
  typeof generateListeningInputSchema
>;
export type GeneratedListeningSet = z.infer<
  typeof generatedListeningSetSchema
>;
