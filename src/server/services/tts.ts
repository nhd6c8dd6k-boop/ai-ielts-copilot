import { createOpenAIClient } from "@/lib/openai/client";
import {
  buildTtsDialogueText,
  type ListeningScriptSegment,
} from "@/server/services/listening-script-parser";

export type TtsProvider = "openai";
export type TtsVoice =
  | "alloy"
  | "ash"
  | "ballad"
  | "coral"
  | "echo"
  | "fable"
  | "marin"
  | "nova"
  | "onyx"
  | "sage"
  | "shimmer"
  | "verse"
  | "cedar";

export type TtsSegment = {
  speaker: string | null;
  voice?: TtsVoice;
  text: string;
};

export type GenerateSpeechInput = {
  provider?: TtsProvider;
  text: string;
  voice?: TtsVoice;
  segments?: ListeningScriptSegment[];
};

export type GenerateSpeechResult = {
  provider: TtsProvider;
  model: string;
  audioBuffer: Buffer;
  inputCharacters: number;
  estimatedTokens: number;
  estimatedCost: number;
  segmentCount: number;
  voiceStrategy: "single_voice_clean_script" | "multi_voice_mp3_concat";
  voices: Array<{
    speaker: string | null;
    voice: TtsVoice;
  }>;
};

const OPENAI_TTS_MODEL = "gpt-4o-mini-tts";
const DEFAULT_OPENAI_VOICE: TtsVoice = "alloy";
const APPROX_TTS_COST_PER_MILLION_CHARS = 15;
const MAX_MULTI_VOICE_SEGMENTS = 24;

export async function generateSpeech({
  provider = "openai",
  text,
  voice = DEFAULT_OPENAI_VOICE,
  segments,
}: GenerateSpeechInput): Promise<GenerateSpeechResult> {
  if (provider !== "openai") {
    throw new Error(`Unsupported TTS provider: ${provider}`);
  }

  const cleanSegments = normalizeSegments(text, segments);
  const input = buildTtsDialogueText(cleanSegments);
  const openai = createOpenAIClient();

  if (cleanSegments.length > 1 && cleanSegments.length <= MAX_MULTI_VOICE_SEGMENTS) {
    const voices = cleanSegments.map((segment) => ({
      speaker: segment.speaker,
      voice: segment.voice ?? getVoiceForSpeaker(segment.speaker),
    }));
    const audioBuffers = await mapWithConcurrency(
      cleanSegments,
      3,
      async (segment) =>
        createSpeechBuffer({
          input: segment.text,
          voice: segment.voice ?? getVoiceForSpeaker(segment.speaker),
          openai,
        }),
    );

    return {
      provider,
      model: OPENAI_TTS_MODEL,
      audioBuffer: Buffer.concat(audioBuffers),
      inputCharacters: input.length,
      estimatedTokens: estimateTokens(input),
      estimatedCost: estimateTtsCost(input.length),
      segmentCount: cleanSegments.length,
      voiceStrategy: "multi_voice_mp3_concat",
      voices,
    };
  }

  const response = await openai.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice,
    input,
    instructions:
      "Read this as a natural IELTS listening recording. Do not read speaker names, labels, colons, or formatting. Use clear conversational pacing and brief pauses between turns.",
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
    segmentCount: cleanSegments.length,
    voiceStrategy: "single_voice_clean_script",
    voices: [{ speaker: null, voice }],
  };
}

async function createSpeechBuffer({
  input,
  voice,
  openai,
}: {
  input: string;
  voice: TtsVoice;
  openai: ReturnType<typeof createOpenAIClient>;
}) {
  const response = await openai.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice,
    input,
    instructions:
      "Read only the spoken dialogue text. Do not add a speaker name. Use natural IELTS listening pacing.",
    response_format: "mp3",
  });

  return Buffer.from(await response.arrayBuffer());
}

function normalizeSegments(
  text: string,
  segments?: ListeningScriptSegment[],
): TtsSegment[] {
  if (!segments?.length) {
    return [
      {
        speaker: null,
        text: text.trim(),
        voice: DEFAULT_OPENAI_VOICE,
      },
    ];
  }

  return segments.map((segment) => ({
    ...segment,
    voice: getVoiceForSpeaker(segment.speaker),
  }));
}

function getVoiceForSpeaker(speaker: string | null): TtsVoice {
  if (!speaker) {
    return "alloy";
  }

  const normalized = speaker.toLowerCase();

  if (
    /(student|man|male|customer|applicant|visitor|daniel|david|james|john|mr\.?)/i.test(
      normalized,
    )
  ) {
    return "onyx";
  }

  if (
    /(receptionist|woman|female|librarian|assistant|clerk|sarah|anna|ms\.?|mrs\.?)/i.test(
      normalized,
    )
  ) {
    return "nova";
  }

  return "alloy";
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );

  return results;
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
