import {
  generatedReadingSetSchema,
  type GenerateReadingInput,
} from "@/features/ai-reading/schemas";
import { createOpenAIClient } from "@/lib/openai/client";

export async function generateReadingSet(input: GenerateReadingInput) {
  const openai = createOpenAIClient();

  const response = await openai.responses.create({
    model: "gpt-5.2",
    input: [
      {
        role: "system",
        content:
          "You generate original IELTS style reading practice for Chinese learners. The passage, question prompts, options, correct answers, vocabulary examples, and IELTS task content must be in English. Chinese is allowed only in explanationZh and meaningZh fields. Do not copy Cambridge IELTS, official exam content, exam recalls, or copyrighted passages. Return only valid JSON.",
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "generated_reading_set",
        schema: generatedReadingSetSchema.toJSONSchema(),
        strict: true,
      },
    },
  });

  const rawText = response.output_text;
  return generatedReadingSetSchema.parse(JSON.parse(rawText));
}
