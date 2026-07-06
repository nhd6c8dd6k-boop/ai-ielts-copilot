import { z } from "zod";

import { createOpenAIClient } from "@/lib/openai/client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { assertOriginalContentPolicy } from "@/lib/validators/content-policy";
import { writingVisualDataSchema } from "@/lib/writing-visual-data";

const adminReadingQuestionSchema = z.object({
  type: z.string().min(1),
  number: z.number().int().positive(),
  prompt: z.string().min(1),
  options: z.array(z.string()).default([]),
  answer: z.string().min(1),
  explanation_zh: z.string().min(1),
  explanation_en: z.string().min(1),
  synonyms: z.array(z.string()).default([]),
});

const adminReadingOutputSchema = z.object({
  title: z.string().min(1),
  band: z.number().int().min(5).max(9),
  topic: z.string().min(1),
  passage: z.string().min(500),
  questions: z.array(adminReadingQuestionSchema).min(1),
  answers: z.array(z.string()).default([]),
  explanations: z.array(z.string()).default([]),
  vocabulary: z.array(
    z.object({
      word: z.string().min(1),
      meaning_zh: z.string().min(1),
      meaning_en: z.string().min(1),
      example: z.string().min(1),
    }),
  ),
  synonyms: z.array(z.string()).default([]),
});

const adminListeningQuestionSchema = z.object({
  type: z.string().min(1),
  number: z.number().int().positive(),
  prompt: z.string().min(1),
  options: z.array(z.string()).default([]),
  answer: z.string().min(1),
  explanation_zh: z.string().min(1),
  explanation_en: z.string().min(1),
});

const adminListeningOutputSchema = z.object({
  title: z.string().min(1),
  band: z.number().int().min(5).max(9),
  topic: z.string().min(1),
  section: z.number().int().min(1).max(4),
  script: z.string().min(300),
  questions: z.array(adminListeningQuestionSchema).min(1),
  answers: z.array(z.string()).default([]),
  explanations: z.array(z.string()).default([]),
  audio_status: z.literal("pending"),
});

const adminWritingOutputSchema = z.object({
  task_type: z.union([z.literal(1), z.literal(2)]),
  band_target: z.number().int().min(5).max(9),
  topic: z.string().min(1),
  prompt: z.string().min(1),
  sample_answer_band_7: z.string().min(1),
  sample_answer_band_8: z.string().min(1),
  sample_answer_band_9: z.string().min(1),
  scoring_notes: z.array(z.string()).min(1),
  visual_data: writingVisualDataSchema.nullable(),
});

export const adminGenerateReadingInputSchema = z.object({
  band: z.number().int().min(5).max(9),
  topic: z.string().min(1),
  lengthWords: z.number().int().min(500).max(1200).default(800),
  questionTypes: z.array(z.string()).min(1),
  quantity: z.number().int().min(1).max(5).default(1),
  promptTemplateId: z.string().uuid().optional(),
});

export const adminGenerateListeningInputSchema = z.object({
  band: z.number().int().min(5).max(9),
  topic: z.string().min(1),
  section: z.number().int().min(1).max(4),
  questionTypes: z.array(z.string()).min(1),
  quantity: z.number().int().min(1).max(5).default(1),
  promptTemplateId: z.string().uuid().optional(),
});

export const adminGenerateWritingInputSchema = z.object({
  taskType: z.union([z.literal(1), z.literal(2)]),
  bandTarget: z.number().int().min(5).max(9),
  topic: z.string().min(1),
  quantity: z.number().int().min(1).max(5).default(1),
  promptTemplateId: z.string().uuid().optional(),
});

type AdminGenerateResult = {
  id: string;
  title: string;
  band: number;
  topic: string;
  status: "pending_review";
};

type UsageSummary = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
};

type UsageTrackedError = Error & {
  usage?: UsageSummary;
};

export async function generateAdminReadingContent({
  adminUserId,
  input,
}: {
  adminUserId: string;
  input: z.infer<typeof adminGenerateReadingInputSchema>;
}) {
  return generateMany({
    quantity: input.quantity,
    contentType: "reading",
    adminUserId,
    createOne: async () => {
      const promptTemplate = await loadPromptTemplate("reading", input.promptTemplateId);
      const payload = await callStrictJson({
        schemaName: "admin_reading_content",
        schema: adminReadingOutputSchema,
        systemPrompt: buildSystemPrompt(promptTemplate, "reading"),
        userPrompt: JSON.stringify({
          ...input,
          requirements: [
            "Generate fully original IELTS-style Reading content.",
            "Questions, passage, answers, and examples must be in English.",
            "Chinese is allowed only in explanation_zh and meaning_zh fields.",
            "Do not copy Cambridge IELTS, official tests, exam recalls, or copyrighted passages.",
          ],
        }),
      });

      assertOriginalContentPolicy(payload.data.passage);

      const admin = createSupabaseAdminClient();
      const { data: set, error } = await admin
        .from("reading_sets")
        .insert({
          title: payload.data.title,
          topic: payload.data.topic,
          band: payload.data.band,
          length_words: input.lengthWords,
          passage: payload.data.passage,
          source_type: "ai_generated",
          status: "review",
          created_by: adminUserId,
        })
        .select("id,title,band,topic,status")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await insertQuestionsAndAnswers({
        setType: "reading",
        setId: set.id,
        questions: payload.data.questions,
        vocabulary: payload.data.vocabulary,
      });
      await recordUsageAndAdminLog({
        adminUserId,
        contentType: "reading",
        targetId: set.id,
        usage: payload.usage,
        action: "ai_reading_generated",
      });

      return {
        result: {
          id: set.id,
          title: set.title,
          band: set.band,
          topic: set.topic,
          status: "pending_review" as const,
        },
        usage: payload.usage,
      };
    },
  });
}

export async function generateAdminListeningContent({
  adminUserId,
  input,
}: {
  adminUserId: string;
  input: z.infer<typeof adminGenerateListeningInputSchema>;
}) {
  return generateMany({
    quantity: input.quantity,
    contentType: "listening",
    adminUserId,
    createOne: async () => {
      const promptTemplate = await loadPromptTemplate(
        "listening",
        input.promptTemplateId,
      );
      const payload = await callStrictJson({
        schemaName: "admin_listening_content",
        schema: adminListeningOutputSchema,
        systemPrompt: buildSystemPrompt(promptTemplate, "listening"),
        userPrompt: JSON.stringify({
          ...input,
          requirements: [
            "Generate a fully original IELTS Listening script.",
            "Script, questions, answers, and examples must be in English.",
            "Chinese is allowed only in explanation_zh fields.",
            "audio_status must be pending.",
          ],
        }),
      });

      assertOriginalContentPolicy(payload.data.script);

      const admin = createSupabaseAdminClient();
      const { data: set, error } = await admin
        .from("listening_sets")
        .insert({
          title: payload.data.title,
          section: payload.data.section,
          topic: payload.data.topic,
          band: payload.data.band,
          script: payload.data.script,
          audio_url: null,
          audio_status: payload.data.audio_status,
          source_type: "ai_generated",
          status: "review",
          created_by: adminUserId,
        })
        .select("id,title,band,topic,status")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await insertQuestionsAndAnswers({
        setType: "listening",
        setId: set.id,
        questions: payload.data.questions,
        vocabulary: [],
      });
      await recordUsageAndAdminLog({
        adminUserId,
        contentType: "listening",
        targetId: set.id,
        usage: payload.usage,
        action: "ai_listening_generated",
      });

      return {
        result: {
          id: set.id,
          title: set.title,
          band: set.band,
          topic: set.topic,
          status: "pending_review" as const,
        },
        usage: payload.usage,
      };
    },
  });
}

export async function generateAdminWritingContent({
  adminUserId,
  input,
}: {
  adminUserId: string;
  input: z.infer<typeof adminGenerateWritingInputSchema>;
}) {
  return generateMany({
    quantity: input.quantity,
    contentType: "writing",
    adminUserId,
    createOne: async () => {
      const promptTemplate = await loadPromptTemplate("writing", input.promptTemplateId);
      const payload = await callStrictJson({
        schemaName: "admin_writing_content",
        schema: adminWritingOutputSchema,
        systemPrompt: buildSystemPrompt(promptTemplate, "writing"),
        userPrompt: JSON.stringify({
          ...input,
          requirements: [
            "Generate a fully original IELTS Writing task.",
            "Prompt and sample answers must be in English.",
            "Do not copy official IELTS, Cambridge IELTS, exam recalls, or copyrighted materials.",
            "For Task 1 chart, graph, pie chart or table tasks, include visual_data as structured JSON. For Task 2, set visual_data to null.",
          ],
        }),
      });

      assertOriginalContentPolicy(payload.data.prompt);

      const admin = createSupabaseAdminClient();
      const title = `Task ${payload.data.task_type}: ${payload.data.topic}`;
      const { data: task, error } = await admin
        .from("writing_tasks")
        .insert({
          task_type: payload.data.task_type,
          topic: payload.data.topic,
          prompt: payload.data.prompt,
          band_target: payload.data.band_target,
          sample_answer_band_7: payload.data.sample_answer_band_7,
          sample_answer_band_8: payload.data.sample_answer_band_8,
          sample_answer_band_9: payload.data.sample_answer_band_9,
          scoring_notes: payload.data.scoring_notes,
          visual_data: payload.data.visual_data,
          source_type: "ai_generated",
          status: "review",
          created_by: adminUserId,
        })
        .select("id,topic,band_target,status")
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await recordUsageAndAdminLog({
        adminUserId,
        contentType: "writing",
        targetId: task.id,
        usage: payload.usage,
        action: "ai_writing_generated",
      });

      return {
        result: {
          id: task.id,
          title,
          band: task.band_target,
          topic: task.topic,
          status: "pending_review" as const,
        },
        usage: payload.usage,
      };
    },
  });
}

async function generateMany({
  quantity,
  contentType,
  adminUserId,
  createOne,
}: {
  quantity: number;
  contentType: string;
  adminUserId: string;
  createOne: () => Promise<{ result: AdminGenerateResult; usage: UsageSummary }>;
}) {
  const results: AdminGenerateResult[] = [];
  let usage: UsageSummary = {
    model: "gpt-5.2",
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    estimatedCost: 0,
  };

  try {
    for (let index = 0; index < quantity; index += 1) {
      const generated = await createOne();
      results.push(generated.result);
      usage = mergeUsage(usage, generated.usage);
    }

    return { results, usage };
  } catch (error) {
    const usage = (error as UsageTrackedError).usage;

    if (usage) {
      await recordUsageLog({
        adminUserId,
        contentType,
        usage,
      });
    }

    await writeAdminLog({
      adminUserId,
      action: "ai_generation_failed",
      targetType: contentType,
      targetId: null,
      metadata: {
        error: error instanceof Error ? error.message : "Unknown generation error",
        model: usage?.model,
        inputTokens: usage?.inputTokens,
        outputTokens: usage?.outputTokens,
        estimatedCost: usage?.estimatedCost,
      },
    });

    throw error;
  }
}

async function callStrictJson<Schema extends z.ZodType>({
  schemaName,
  schema,
  systemPrompt,
  userPrompt,
}: {
  schemaName: string;
  schema: Schema;
  systemPrompt: string;
  userPrompt: string;
}) {
  const model = "gpt-5.2";
  const openai = createOpenAIClient();
  const response = await openai.responses.create({
    model,
    input: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: schemaName,
        schema: schema.toJSONSchema(),
        strict: true,
      },
    },
  });
  const usage = extractUsage(model, response);

  try {
    return {
      data: schema.parse(JSON.parse(response.output_text)) as z.infer<Schema>,
      usage,
    };
  } catch (error) {
    const validationError = new Error(
      error instanceof Error
        ? `OpenAI returned invalid JSON: ${error.message}`
        : "OpenAI returned invalid JSON.",
    ) as UsageTrackedError;

    validationError.usage = usage;
    throw validationError;
  }
}

async function loadPromptTemplate(skill: string, promptTemplateId?: string) {
  const admin = createSupabaseAdminClient();

  if (promptTemplateId) {
    const { data } = await admin
      .from("prompt_templates")
      .select("template")
      .eq("id", promptTemplateId)
      .maybeSingle();

    if (data?.template) {
      return data.template;
    }
  }

  const { data } = await admin
    .from("prompt_templates")
    .select("template")
    .eq("skill", skill)
    .eq("active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.template ?? null;
}

function buildSystemPrompt(template: string | null, contentType: string) {
  const base =
    "You are an expert IELTS item writer for AI IELTS Copilot. Generate only original IELTS-style content. Never copy Cambridge IELTS, official IELTS materials, exam recalls, protected PDFs, or copyrighted passages. Return strict JSON only. IELTS task content must be in English; Chinese is allowed only in explicit Chinese explanation fields.";

  return template
    ? `${base}\n\nAdmin prompt template for ${contentType}:\n${template}`
    : base;
}

async function insertQuestionsAndAnswers({
  setType,
  setId,
  questions,
  vocabulary,
}: {
  setType: "reading" | "listening";
  setId: string;
  questions: Array<{
    type: string;
    number: number;
    prompt: string;
    options: string[];
    answer: string;
    explanation_zh: string;
    explanation_en: string;
    synonyms?: string[];
  }>;
  vocabulary: unknown[];
}) {
  const admin = createSupabaseAdminClient();

  for (const question of questions) {
    const { data, error } = await admin
      .from("generated_questions")
      .insert({
        set_type: setType,
        set_id: setId,
        question_type: question.type,
        question_number: question.number,
        prompt: question.prompt,
        options: question.options,
        metadata: {},
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const { error: answerError } = await admin.from("generated_answers").insert({
      question_id: data.id,
      correct_answer: question.answer,
      explanation_zh: question.explanation_zh,
      explanation_en: question.explanation_en,
      synonyms: question.synonyms ?? [],
      vocabulary,
    });

    if (answerError) {
      throw new Error(answerError.message);
    }
  }
}

async function recordUsageAndAdminLog({
  adminUserId,
  contentType,
  targetId,
  usage,
  action,
}: {
  adminUserId: string;
  contentType: string;
  targetId: string;
  usage: UsageSummary;
  action: string;
}) {
  await recordUsageLog({
    adminUserId,
    contentType,
    usage,
  });

  await writeAdminLog({
    adminUserId,
    action,
    targetType: contentType,
    targetId,
    metadata: {
      status: "review",
      model: usage.model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      estimatedCost: usage.estimatedCost,
    },
  });
}

async function recordUsageLog({
  adminUserId,
  contentType,
  usage,
}: {
  adminUserId: string;
  contentType: string;
  usage: UsageSummary;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("ai_usage_logs").insert({
    admin_user_id: adminUserId,
    content_type: contentType,
    model: usage.model,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    total_tokens: usage.totalTokens,
    estimated_cost: usage.estimatedCost,
  });
}

async function writeAdminLog({
  adminUserId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}

function extractUsage(model: string, response: unknown): UsageSummary {
  const usage = (response as { usage?: Record<string, number | undefined> }).usage;
  const inputTokens = usage?.input_tokens ?? 0;
  const outputTokens = usage?.output_tokens ?? 0;
  const totalTokens = usage?.total_tokens ?? inputTokens + outputTokens;

  return {
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost: estimateCost(inputTokens, outputTokens),
  };
}

function estimateCost(inputTokens: number, outputTokens: number) {
  const inputCostPerMillion = 1.25;
  const outputCostPerMillion = 10;

  return Number(
    (
      (inputTokens / 1_000_000) * inputCostPerMillion +
      (outputTokens / 1_000_000) * outputCostPerMillion
    ).toFixed(6),
  );
}

function mergeUsage(current: UsageSummary, next: UsageSummary): UsageSummary {
  return {
    model: next.model,
    inputTokens: current.inputTokens + next.inputTokens,
    outputTokens: current.outputTokens + next.outputTokens,
    totalTokens: current.totalTokens + next.totalTokens,
    estimatedCost: Number(
      (current.estimatedCost + next.estimatedCost).toFixed(6),
    ),
  };
}
