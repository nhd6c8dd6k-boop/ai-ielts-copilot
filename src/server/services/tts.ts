import { createOpenAIClient } from "@/lib/openai/client";
import {
  buildNaturalSpeechSegmentText,
  getPauseDuration,
  normalizeSpeechText,
} from "@/server/services/listening-speech-normalizer";
import {
  getListeningTtsProfile,
  type ListeningTtsProfile,
} from "@/server/services/listening-tts-profile";
import {
  hasSpeakerLabels,
  type ListeningScriptSegment,
  parseListeningScript,
  stripSpeakerLabels,
} from "@/server/services/listening-script-parser";
import {
  getMappedVoiceForSpeaker,
  summarizeVoiceMapping,
  type TtsVoiceMapping,
} from "@/server/services/tts-voices";

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

type NaturalTtsSegment = TtsSegment & {
  pauseMs: number;
  speechText: string;
};

export type GenerateSpeechInput = {
  provider?: TtsProvider;
  text: string;
  voice?: TtsVoice;
  segments?: ListeningScriptSegment[];
  section?: number | null;
  voiceMapping?: TtsVoiceMapping;
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
  section: number;
  voices: Array<{
    speaker: string | null;
    voice: TtsVoice;
  }>;
  inputPreview: string;
  inputContainsSpeakerLabels: boolean;
  speed: number;
  pauseSummary: Array<{
    speaker: string | null;
    nextSpeaker: string | null;
    pauseMs: number;
  }>;
  voiceMappingSummary: Array<{
    speaker: string;
    voice: TtsVoice;
  }>;
  pauseStrategy: string;
  ttsProfile: {
    section: number;
    speed: number;
    pauseMultiplier: number;
    voiceStrategy: string;
    narratorVoice: TtsVoice;
    pauseStrategy: string;
  };
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
  section,
  voiceMapping,
}: GenerateSpeechInput): Promise<GenerateSpeechResult> {
  if (provider !== "openai") {
    throw new Error(`Unsupported TTS provider: ${provider}`);
  }

  const cleanSegments = normalizeSegments(text, segments, voiceMapping);
  const profile = getListeningTtsProfile(section);
  const naturalSegments = buildNaturalSegments(cleanSegments, profile);
  const input = naturalSegments.map((segment) => segment.speechText).join("\n\n");
  assertNoSpeakerLabels(input);
  const openai = createOpenAIClient();
  const speed = profile.speed;
  const voices = naturalSegments.map((segment) => ({
    speaker: segment.speaker,
    voice: segment.voice ?? profile.narratorVoice,
  }));
  const pauseSummary = naturalSegments.map((segment, index) => ({
    speaker: segment.speaker,
    nextSpeaker: naturalSegments[index + 1]?.speaker ?? null,
    pauseMs: segment.pauseMs,
  }));

  if (
    profile.voiceStrategy === "multi_voice" &&
    naturalSegments.length > 1 &&
    naturalSegments.length <= MAX_MULTI_VOICE_SEGMENTS
  ) {
    const audioBuffers = await mapWithConcurrency(
      naturalSegments,
      3,
      async (segment) =>
        createSpeechBuffer({
          input: segment.speechText,
          voice: segment.voice ?? profile.narratorVoice,
          openai,
          speed,
          profile,
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
      section: profile.section,
      voices,
      inputPreview: buildInputPreview(input),
      inputContainsSpeakerLabels: hasSpeakerLabels(input),
      speed,
      pauseSummary,
      voiceMappingSummary: summarizeVoiceMapping(voices),
      pauseStrategy: profile.pauseStrategy,
      ttsProfile: buildProfileLog(profile),
    };
  }

  const response = await openai.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice: profile.narratorVoice ?? voice,
    input,
    instructions: buildTtsInstructions(profile),
    response_format: "mp3",
    speed,
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
    section: profile.section,
    voices: [{ speaker: null, voice: profile.narratorVoice ?? voice }],
    inputPreview: buildInputPreview(input),
    inputContainsSpeakerLabels: hasSpeakerLabels(input),
    speed,
    pauseSummary,
    voiceMappingSummary: summarizeVoiceMapping([
      { speaker: null, voice: profile.narratorVoice ?? voice },
    ]),
    pauseStrategy: profile.pauseStrategy,
    ttsProfile: buildProfileLog(profile),
  };
}

async function createSpeechBuffer({
  input,
  voice,
  openai,
  speed,
  profile,
}: {
  input: string;
  voice: TtsVoice;
  openai: ReturnType<typeof createOpenAIClient>;
  speed: number;
  profile: ListeningTtsProfile;
}) {
  const safeInput = stripSpeakerLabels(input);
  assertNoSpeakerLabels(safeInput);

  const response = await openai.audio.speech.create({
    model: OPENAI_TTS_MODEL,
    voice,
    input: safeInput,
    instructions: buildTtsInstructions(profile),
    response_format: "mp3",
    speed,
  });

  return Buffer.from(await response.arrayBuffer());
}

function normalizeSegments(
  text: string,
  segments?: ListeningScriptSegment[],
  voiceMapping?: TtsVoiceMapping,
): TtsSegment[] {
  if (!segments?.length) {
    const parsedSegments = parseListeningScript(text);

    if (parsedSegments.length) {
      return parsedSegments.map((segment) => ({
        speaker: segment.speaker,
        text: stripSpeakerLabels(segment.text),
        voice: getMappedVoiceForSpeaker(segment.speaker, voiceMapping),
      }));
    }

    return [
      {
        speaker: null,
        text: stripSpeakerLabels(text),
        voice: DEFAULT_OPENAI_VOICE,
      },
    ];
  }

  return segments.map((segment) => ({
    speaker: segment.speaker,
    text: normalizeSpeechText(segment.text),
    voice: getMappedVoiceForSpeaker(segment.speaker, voiceMapping),
  }));
}

function buildNaturalSegments(
  segments: TtsSegment[],
  profile: ListeningTtsProfile,
): NaturalTtsSegment[] {
  return segments.map((segment, index) => {
    const pauseMs = getPauseDuration(
      segment,
      segments[index + 1],
      profile.pauseMultiplier,
    );

    return {
      speaker: segment.speaker,
      text: segment.text,
      voice:
        profile.voiceStrategy === "multi_voice"
          ? segment.voice
          : profile.narratorVoice,
      pauseMs,
      speechText: buildNaturalSpeechSegmentText({
        text: segment.text,
        pauseMs,
      }),
    };
  });
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

function assertNoSpeakerLabels(input: string) {
  if (hasSpeakerLabels(input)) {
    throw new Error(
      "TTS input still contains speaker labels after sanitization.",
    );
  }
}

function buildTtsInstructions(profile: ListeningTtsProfile) {
  return [
    "Speak naturally, like a real IELTS Listening recording.",
    profile.styleInstruction,
    "Use clear pronunciation, realistic intonation, and section-appropriate pacing.",
    "Questions should sound like genuine questions, with gentle rising intonation.",
    "Statements should settle naturally, with clear falling intonation.",
    "Read numbers, names, addresses, dates, prices, and spelling very clearly.",
    "Do not read speaker names, role labels, colons, formatting, or stage directions.",
  ].join(" ");
}

function buildInputPreview(input: string) {
  return input.replace(/\s+/g, " ").trim().slice(0, 200);
}

function buildProfileLog(profile: ListeningTtsProfile) {
  return {
    section: profile.section,
    speed: profile.speed,
    pauseMultiplier: profile.pauseMultiplier,
    voiceStrategy: profile.voiceStrategy,
    narratorVoice: profile.narratorVoice,
    pauseStrategy: profile.pauseStrategy,
  };
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
