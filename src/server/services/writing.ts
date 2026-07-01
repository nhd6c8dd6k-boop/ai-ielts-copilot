import {
  generatedWritingTaskSchema,
  writingFeedbackSchema,
  type GenerateWritingTaskInput,
  type GradeWritingInput,
} from "@/features/ai-writing/schemas";
import { createOpenAIClient } from "@/lib/openai/client";

export async function generateWritingTask(input: GenerateWritingTaskInput) {
  const openai = createOpenAIClient();

  const response = await openai.responses.create({
    model: "gpt-5.2",
    input: [
      {
        role: "system",
        content:
          "Generate an original IELTS Writing task for Chinese learners. The task prompt and requirements must be in English. Do not copy official IELTS, Cambridge IELTS, exam recalls, or copyrighted materials. Return only valid JSON.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "generated_writing_task",
        schema: generatedWritingTaskSchema.toJSONSchema(),
        strict: true,
      },
    },
  });

  return generatedWritingTaskSchema.parse(JSON.parse(response.output_text));
}

export async function gradeWriting(input: GradeWritingInput) {
  const openai = createOpenAIClient();

  const response = await openai.responses.create({
    model: "gpt-5.2",
    input: [
      {
        role: "system",
        content:
          "You are an IELTS Writing coach. Estimate a non-official IELTS band using Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Give Chinese and English feedback. The score is only an estimate and not official. Return only valid JSON.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "writing_feedback",
        schema: writingFeedbackSchema.toJSONSchema(),
        strict: true,
      },
    },
  });

  return writingFeedbackSchema.parse(JSON.parse(response.output_text));
}
