import {
  generatedWritingTaskSchema,
  writingFeedbackSchema,
  type GenerateWritingTaskInput,
  type GradeWritingInput,
} from "@/features/ai-writing/schemas";
import { createOpenAIClient } from "@/lib/openai/client";
import { countWords } from "@/lib/word-count";
import { sanitizeScoreSummaryBands } from "@/server/services/writing-feedback-sanitizer";
import { calibrateWritingScores } from "@/server/services/writing-scoring";

const writingFeedbackModelSchema = writingFeedbackSchema.omit({
  overallBand: true,
});

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
  const languageInstruction =
    input.language === "zh"
      ? "Write all feedback content in Simplified Chinese only. Do not provide a separate English version."
      : "Write all feedback content in English only. Do not include Simplified Chinese or Chinese explanations.";

  const response = await openai.responses.create({
    model: "gpt-5.2",
    input: [
      {
        role: "system",
        content:
          `You are a strict IELTS Writing coach. Estimate a non-official IELTS band using independent criterion scores for Task Achievement / Task Response, Coherence and Cohesion, Lexical Resource, and Grammatical Range and Accuracy. Do not return an overall band; the server computes it from the four criteria. Give feedback in the requested language only. ${languageInstruction} Include scoreSummary with 3 to 5 concise, specific points explaining the biggest score limit and the next focus, but do not include any numeric band scores in scoreSummary because the server calibrates final scores after model output. Include sentenceImprovements as 2 to 4 objects with original, improved, and explanation; original must come from the learner's essay and explanation must use the requested language only. Include taskSpecificFeedback for Task 1 or Task 2 only, with 4 to 5 concrete items and statuses strong, needs_work, or missing. The score is only an estimate and not official. Return only valid JSON.`,
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
        schema: writingFeedbackModelSchema.toJSONSchema(),
        strict: true,
      },
    },
  });

  const parsed = writingFeedbackModelSchema.parse(JSON.parse(response.output_text));
  const calibrated = calibrateWritingScores({
    criteria: {
      taskResponse: parsed.criteria.taskResponse,
      coherenceCohesion: parsed.criteria.coherenceCohesion,
      lexicalResource: parsed.criteria.lexicalResource,
      grammaticalRangeAccuracy: parsed.criteria.grammaticalRangeAccuracy,
    },
    taskSpecificFeedback: {
      task_type: parsed.taskSpecificFeedback.taskType,
      items: parsed.taskSpecificFeedback.items,
    },
    taskType: input.task.taskType,
    wordCount: countWords(input.essay),
  });

  return writingFeedbackSchema.parse({
    ...parsed,
    scoreSummary: sanitizeScoreSummaryBands(parsed.scoreSummary),
    overallBand: calibrated.overallBand,
    criteria: {
      taskResponse: calibrated.taskResponse,
      coherenceCohesion: calibrated.coherenceCohesion,
      lexicalResource: calibrated.lexicalResource,
      grammaticalRangeAccuracy: calibrated.grammaticalRangeAccuracy,
    },
  });
}
