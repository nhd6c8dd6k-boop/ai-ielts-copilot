import { z } from "zod";

export const adminSpeakingBandSchema = z
  .number()
  .min(5)
  .max(9)
  .refine((value) => Number.isInteger(value * 2), {
    message: "Target band must use 0.5 increments.",
  });

export const adminGenerateSpeakingInputSchema = z
  .object({
    part: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    topic: z.string().trim().min(1).max(120),
    targetBand: adminSpeakingBandSchema.default(7),
    questionCount: z.number().int().min(1).max(6),
    optionalInstructions: z.string().trim().max(800).optional(),
    promptTemplateId: z.string().uuid().optional(),
  })
  .superRefine((input, ctx) => {
    if (input.part === 2 && input.questionCount !== 1) {
      ctx.addIssue({
        code: "custom",
        path: ["questionCount"],
        message: "Part 2 generation must create exactly 1 cue card.",
      });
    }

    if (
      (input.part === 1 || input.part === 3) &&
      (input.questionCount < 3 || input.questionCount > 6)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["questionCount"],
        message: "Part 1 and Part 3 generation must create 3 to 6 questions.",
      });
    }
  });

const generatedTopicBaseSchema = {
  title: z.string().trim().min(1).max(160),
  slug: z.string().trim().min(1).max(140),
  description: z.string().trim().min(1).max(600),
  targetBand: z.number().min(5).max(9),
};

const usefulPhraseSchema = z.object({
  phrase: z.string().trim().min(1).max(140),
  meaning: z.string().trim().min(1).max(260),
  example: z.string().trim().min(1).max(300),
});

const vocabularyUpgradeSchema = z.object({
  insteadOf: z.string().trim().min(1).max(120),
  try: z.array(z.string().trim().min(1).max(120)).min(1).max(5),
  meaning: z.string().trim().min(1).max(260),
  example: z.string().trim().min(1).max(300),
  context: z.string().trim().min(1).max(160),
});

const sentencePatternSchema = z.object({
  pattern: z.string().trim().min(1).max(220),
  example: z.string().trim().min(1).max(320),
  suitableUse: z.string().trim().min(1).max(260),
});

const commonMistakeSchema = z.object({
  incorrect: z.string().trim().min(1).max(260),
  better: z.string().trim().min(1).max(260),
  why: z.string().trim().min(1).max(320),
});

const teachingFieldsSchema = {
  usefulPhrases: z.array(usefulPhraseSchema).min(2).max(8),
  vocabulary: z.array(vocabularyUpgradeSchema).min(2).max(8),
  sentencePatterns: z.array(sentencePatternSchema).min(2).max(6),
  commonMistakes: z.array(commonMistakeSchema).min(2).max(6),
};

const partOneQuestionSchema = z.object({
  questionOrder: z.number().int().min(1).max(20),
  question: z.string().trim().min(1).max(300),
  answerTip: z.string().trim().min(1).max(500),
  directAnswer: z.string().trim().min(1).max(500),
  mainReason: z.string().trim().min(1).max(500),
  example: z.string().trim().min(1).max(500),
  alternativePerspective: z.string().trim().min(1).max(500),
  sampleBand6: z.string().trim().min(1).max(1200),
  sampleBand7: z.string().trim().min(1).max(1400),
  sampleBand8: z.string().trim().min(1).max(1600),
  ...teachingFieldsSchema,
});

const partTwoQuestionSchema = z.object({
  questionOrder: z.literal(1),
  question: z.string().trim().min(1).max(300),
  answerTip: z.string().trim().min(1).max(500),
  cueCardPoints: z.array(z.string().trim().min(1).max(220)).min(3).max(4),
  preparationIdeas: z.array(z.string().trim().min(1).max(220)).min(3).max(8),
  suggestedStructure: z.array(z.string().trim().min(1).max(160)).min(3).max(6),
  sampleBand6: z.string().trim().min(1).max(2600),
  sampleBand7: z.string().trim().min(1).max(3200),
  sampleBand8: z.string().trim().min(1).max(3600),
  ...teachingFieldsSchema,
});

const partThreeQuestionSchema = z.object({
  questionOrder: z.number().int().min(1).max(20),
  question: z.string().trim().min(1).max(320),
  answerTip: z.string().trim().min(1).max(500),
  directAnswer: z.string().trim().min(1).max(600),
  mainReason: z.string().trim().min(1).max(700),
  example: z.string().trim().min(1).max(700),
  alternativePerspective: z.string().trim().min(1).max(700),
  sampleBand6: z.string().trim().min(1).max(1800),
  sampleBand7: z.string().trim().min(1).max(2400),
  sampleBand8: z.string().trim().min(1).max(2800),
  ...teachingFieldsSchema,
});

export const adminSpeakingPartOneOutputSchema = z.object({
  topic: z.object({
    ...generatedTopicBaseSchema,
    part: z.literal(1),
  }),
  questions: z.array(partOneQuestionSchema).min(3).max(6),
});

export const adminSpeakingPartTwoOutputSchema = z.object({
  topic: z.object({
    ...generatedTopicBaseSchema,
    part: z.literal(2),
  }),
  questions: z.array(partTwoQuestionSchema).length(1),
});

export const adminSpeakingPartThreeOutputSchema = z.object({
  topic: z.object({
    ...generatedTopicBaseSchema,
    part: z.literal(3),
  }),
  questions: z.array(partThreeQuestionSchema).min(3).max(6),
});

export type AdminGenerateSpeakingInput = z.infer<
  typeof adminGenerateSpeakingInputSchema
>;

export type AdminSpeakingPartOneOutput = z.infer<
  typeof adminSpeakingPartOneOutputSchema
>;
export type AdminSpeakingPartTwoOutput = z.infer<
  typeof adminSpeakingPartTwoOutputSchema
>;
export type AdminSpeakingPartThreeOutput = z.infer<
  typeof adminSpeakingPartThreeOutputSchema
>;

export type AdminSpeakingContentPayload =
  | AdminSpeakingPartOneOutput
  | AdminSpeakingPartTwoOutput
  | AdminSpeakingPartThreeOutput;

export class AdminSpeakingGenerationValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminSpeakingGenerationValidationError";
  }
}

export function getAdminSpeakingOutputSchema(part: 1 | 2 | 3) {
  if (part === 1) {
    return adminSpeakingPartOneOutputSchema;
  }

  if (part === 2) {
    return adminSpeakingPartTwoOutputSchema;
  }

  return adminSpeakingPartThreeOutputSchema;
}

export function validateAdminSpeakingContentPayload({
  payload,
  input,
}: {
  payload: unknown;
  input: AdminGenerateSpeakingInput;
}) {
  const parsed = getAdminSpeakingOutputSchema(input.part).parse(payload);
  const questionOrders = parsed.questions.map((question) => question.questionOrder);

  if (parsed.topic.part !== input.part) {
    throw new AdminSpeakingGenerationValidationError(
      "Generated Speaking topic part does not match the requested part.",
    );
  }

  if (parsed.topic.targetBand !== input.targetBand) {
    throw new AdminSpeakingGenerationValidationError(
      "Generated Speaking topic target band does not match the requested band.",
    );
  }

  if (parsed.questions.length !== input.questionCount) {
    throw new AdminSpeakingGenerationValidationError(
      "Generated Speaking question count does not match the requested count.",
    );
  }

  assertSequentialQuestionOrders(questionOrders);

  return parsed;
}

export function normalizeSpeakingSlug(value: string, fallback: string) {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.length >= 3) {
    return normalized.slice(0, 120).replace(/-$/g, "");
  }

  const normalizedFallback = fallback
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalizedFallback.length >= 3 ? normalizedFallback.slice(0, 120) : "speaking-topic";
}

export function buildAdminSpeakingGenerationRequirements(
  input: AdminGenerateSpeakingInput,
) {
  const shared = [
    "Generate fully original IELTS-style Speaking preparation content.",
    "Do not copy Cambridge IELTS, official IELTS materials, exam recalls, protected PDFs, or copyrighted materials.",
    "Do not claim these are official IELTS questions or official examiner answers.",
    "Do not promise that a sample answer guarantees a Band score.",
    "Samples illustrate approximate language levels only.",
    "Use natural spoken English, not IELTS Writing essay style.",
    "Avoid memorised template language and over-complex unnatural vocabulary.",
    "Avoid culturally insensitive examples, personal data, unsafe topics, and inappropriate content.",
    "Use internationally understandable examples.",
    "Topic title must be clear, natural, and specific.",
    "Slug must use lowercase English letters, numbers, and hyphens only.",
    "Topic part and targetBand must exactly match the request.",
    "Every teaching field must use the exact requested JSON shape.",
    "Every vocabulary item must include insteadOf, try, meaning, example, and context.",
  ];

  if (input.part === 1) {
    return [
      ...shared,
      "Generate IELTS Speaking Part 1 content: familiar, personal, everyday, direct, and natural.",
      "Generate exactly the requested number of Part 1 questions.",
      "Each Band 6 sample should be about 35 to 55 words.",
      "Each Band 7 sample should be about 45 to 70 words.",
      "Each Band 8 sample should be about 50 to 80 words.",
      "Each answer must directly answer the question and include a reason or example.",
    ];
  }

  if (input.part === 2) {
    return [
      ...shared,
      "Generate IELTS Speaking Part 2 content: exactly one cue card.",
      "Question should begin like Describe a person, Describe a place, Describe an experience, Describe an object, or Describe an activity.",
      "cueCardPoints must contain 3 to 4 clear You should say prompts.",
      "preparationIdeas must be suitable for 1-minute preparation and should be short notes, not full essay sentences.",
      "suggestedStructure should provide a clear speaking structure such as Introduction, Background, Main details or story, Reflection.",
      "Band 6 sample should be about 150 to 180 words.",
      "Band 7 sample should be about 180 to 220 words and feel like about 1.5 minutes of natural speech.",
      "Band 8 sample should be about 200 to 240 words.",
      "The answer must include personal details, a concrete story or description, natural connection, and a closing reflection.",
      "Do not generate a 30 to 60 second short answer.",
    ];
  }

  return [
    ...shared,
    "Generate IELTS Speaking Part 3 content: abstract discussion questions linked to society, education, culture, technology, behaviour, or trends.",
    "Generate exactly the requested number of Part 3 questions.",
    "Questions should encourage explanation, comparison, causes, effects, predictions, and opinions.",
    "Questions must not be simple personal fact questions.",
    "Each Band 6 sample should be about 70 to 100 words.",
    "Each Band 7 sample should be about 90 to 140 words.",
    "Each Band 8 sample should be about 110 to 160 words.",
    "Each answer should contain a clear position, explanation, example, and optional contrast or qualification.",
    "Do not mechanically use Firstly, Secondly, and In conclusion in every answer.",
  ];
}

function assertSequentialQuestionOrders(questionOrders: number[]) {
  const sorted = [...questionOrders].sort((left, right) => left - right);

  for (let index = 0; index < sorted.length; index += 1) {
    if (sorted[index] !== index + 1) {
      throw new AdminSpeakingGenerationValidationError(
        "Generated Speaking question orders must be sequential starting from 1.",
      );
    }
  }
}
