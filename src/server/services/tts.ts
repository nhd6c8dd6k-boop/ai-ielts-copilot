import { createOpenAIClient } from "@/lib/openai/client";

export type TtsProvider = "openai";
export type TtsVoice = "alloy" | "ash" | "ballad" | "coral" | "echo" | "fable" | "nova" | "onyx" | "sage" | "shimmer";

export type TtsSegment = {
  speaker?: string;
  voice?: TtsVoice;
  text: string;
};

export type GenerateSpeechInput = {
  provider?: TtsProvider;
  text: string;
  voice?: TtsVoice;
  segments?: TtsSegment[];
};

export type GenerateSpeechResult = {
  provider: TtsProvider;
  model: string;
  audioBuffer: Buffer;
  inputCharacters: number;
  estimatedTokens: number;
  estimatedCost: number;
};

const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";
const DEFAULT_OPENAI_VOICE: TtsVoice = "alloy";
const APPROX_TTS_COST_PER_MILLION_CHARS = 15;

export async function generateSpeech({
  provider = "openai",
  text,
  voice = DEFAULT_OPENAI_VOICE,
  segments,
}: GenerateSpeechInput): Promise<GenerateSpeechResult> {
  if (provider !== "openai") {
    throw new Error(`Unsupported TTS provider: ${provider}`);
  }

  const input = buildTtsInput(text, segments);
  const openai = createOpenAIClient();
  const response = await openai.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice,
    input,
    response_format: "mp3",
  });
  const audioBuffer = Buffer.from(await response.arrayBuffer());

  return {
    provider,
    model: OPENAI_TTS_MODEL,
    audioBuffer,
    inputCharacters: input.length,
    estimatedTokens: estimateTokens(input),
    estimatedCost: estimateTtsCost(input.length),
  };
}

function buildTtsInput(text: string, segments?: TtsSegment[]) {
  if (!segments?.length) {
    return text.trim();
  }

  // Future multi-role support can map each segment speaker to a voice provider.
  return segments
    .map((segment) =>
      segment.speaker ? `${segment.speaker}: ${segment.text}` : segment.text,
    )
    .join("\n")
    .trim();
}

function estimateTokens(text: string) {
  return Math.ceil(text.trim().length / 4);
}

function estimateTtsCost(inputCharacters: number) {
  return Number(
    ((inputCharacters / 1_000_000) * APPROX_TTS_COST_PER_MILLION_CHARS).toFixed(
      6,
    ),
  );
}
