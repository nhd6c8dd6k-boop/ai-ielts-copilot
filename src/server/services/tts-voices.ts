import { randomInt } from "node:crypto";

import type { ListeningScriptSegment } from "@/server/services/listening-script-parser";
import type { TtsVoice } from "@/server/services/tts";

const FEMALE_ROLE_PATTERN =
  /(receptionist|assistant|woman|female|librarian|clerk|staff|adviser|advisor|operator|secretary|sarah|anna|ms\.?|mrs\.?)/i;
const MALE_ROLE_PATTERN =
  /(student|man|male|customer|applicant|visitor|candidate|caller|daniel|david|james|john|mr\.?)/i;
const NARRATOR_ROLE_PATTERN = /(narrator|lecturer|speaker|professor|teacher)/i;

const MALE_STYLE_VOICES: TtsVoice[] = ["onyx", "echo", "verse"];
const FEMALE_STYLE_VOICES: TtsVoice[] = ["nova", "shimmer", "alloy"];
const NEUTRAL_STYLE_VOICES: TtsVoice[] = ["alloy"];
const ALL_VOICES = new Set<TtsVoice>([
  "alloy",
  "ash",
  "ballad",
  "coral",
  "echo",
  "fable",
  "marin",
  "nova",
  "onyx",
  "sage",
  "shimmer",
  "verse",
  "cedar",
]);

export type TtsVoiceMapping = Record<string, TtsVoice>;

export function createOrReuseVoiceMapping({
  segments,
  existingMapping,
  forceNew = false,
  singleNarrator = false,
  narratorVoice = "alloy",
}: {
  segments: ListeningScriptSegment[];
  existingMapping?: unknown;
  forceNew?: boolean;
  singleNarrator?: boolean;
  narratorVoice?: TtsVoice;
}) {
  const parsedExisting = forceNew ? {} : parseVoiceMapping(existingMapping);

  if (singleNarrator) {
    return {
      ...parsedExisting,
      Narrator: parsedExisting.Narrator ?? narratorVoice,
    };
  }

  const mapping: TtsVoiceMapping = { ...parsedExisting };
  const speakers = Array.from(
    new Set(segments.map((segment) => normalizeSpeakerKey(segment.speaker))),
  );

  for (const speaker of speakers) {
    if (!mapping[speaker]) {
      mapping[speaker] = pickVoiceForSpeaker(speaker);
    }
  }

  return mapping;
}

export function getVoiceForSpeaker(speaker: string | null): TtsVoice {
  return pickVoiceForSpeaker(normalizeSpeakerKey(speaker));
}

export function getMappedVoiceForSpeaker(
  speaker: string | null,
  voiceMapping?: TtsVoiceMapping,
): TtsVoice {
  const speakerKey = normalizeSpeakerKey(speaker);

  return voiceMapping?.[speakerKey] ?? getVoiceForSpeaker(speakerKey);
}

export function normalizeSpeakerKey(speaker: string | null) {
  const normalized = speaker?.trim();

  return normalized || "Narrator";
}

function pickVoiceForSpeaker(speaker: string): TtsVoice {
  if (FEMALE_ROLE_PATTERN.test(speaker)) {
    return pickRandomVoice(FEMALE_STYLE_VOICES);
  }

  if (MALE_ROLE_PATTERN.test(speaker)) {
    return pickRandomVoice(MALE_STYLE_VOICES);
  }

  if (NARRATOR_ROLE_PATTERN.test(speaker)) {
    return pickRandomVoice(NEUTRAL_STYLE_VOICES);
  }

  return pickRandomVoice(NEUTRAL_STYLE_VOICES);
}

export function summarizeVoiceMapping(
  voices: Array<{ speaker: string | null; voice: TtsVoice }>,
) {
  const summary = new Map<string, TtsVoice>();

  for (const item of voices) {
    summary.set(item.speaker ?? "Narrator", item.voice);
  }

  return Array.from(summary.entries()).map(([speaker, voice]) => ({
    speaker,
    voice,
  }));
}

function parseVoiceMapping(value: unknown): TtsVoiceMapping {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, TtsVoice] =>
        typeof entry[0] === "string" && isTtsVoice(entry[1]),
    ),
  );
}

function isTtsVoice(value: unknown): value is TtsVoice {
  return typeof value === "string" && ALL_VOICES.has(value as TtsVoice);
}

function pickRandomVoice(voices: TtsVoice[]) {
  return voices[randomInt(voices.length)];
}
