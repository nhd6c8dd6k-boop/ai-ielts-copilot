import { randomInt } from "node:crypto";

import type { ListeningScriptSegment } from "@/server/services/listening-script-parser";
import type { TtsVoice } from "@/server/services/tts";

const FEMALE_ROLE_PATTERN =
  /(receptionist|assistant|woman|female|librarian|clerk|staff|adviser|advisor|operator|secretary|maya|sarah|anna|emily|alice|ms\.?|mrs\.?)/i;
const MALE_ROLE_PATTERN =
  /(man|male|customer|applicant|visitor|candidate|caller|daniel|david|james|john|tom|ben|mr\.?)/i;
const TUTOR_ROLE_PATTERN =
  /(tutor|professor|teacher|lecturer|supervisor|instructor|researcher|dr\.?)/i;
const STUDENT_A_PATTERN = /(student\s*a|student\s*1)/i;
const STUDENT_B_PATTERN = /(student\s*b|student\s*2)/i;
const STUDENT_ROLE_PATTERN = /(student|learner|classmate)/i;
const NARRATOR_ROLE_PATTERN = /(narrator|speaker)/i;

const MALE_STYLE_VOICES: TtsVoice[] = ["onyx", "echo", "verse"];
const FEMALE_STYLE_VOICES: TtsVoice[] = ["nova", "shimmer", "alloy"];
const TUTOR_STYLE_VOICES: TtsVoice[] = ["verse", "onyx", "alloy"];
const STUDENT_A_STYLE_VOICES: TtsVoice[] = ["nova", "shimmer", "coral"];
const STUDENT_B_STYLE_VOICES: TtsVoice[] = ["echo", "fable", "sage"];
const NEUTRAL_STYLE_VOICES: TtsVoice[] = ["alloy", "sage", "verse"];
const FALLBACK_DISTINCT_VOICES: TtsVoice[] = [
  "verse",
  "nova",
  "echo",
  "shimmer",
  "onyx",
  "fable",
  "coral",
  "sage",
  "alloy",
];
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
  section,
}: {
  segments: ListeningScriptSegment[];
  existingMapping?: unknown;
  forceNew?: boolean;
  singleNarrator?: boolean;
  narratorVoice?: TtsVoice;
  section?: number | null;
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
  const usedVoices = new Set(Object.values(mapping));

  speakers.forEach((speaker, speakerIndex) => {
    if (!mapping[speaker]) {
      mapping[speaker] = pickVoiceForSpeaker(speaker, usedVoices, {
        section,
        speakerIndex,
        speakerCount: speakers.length,
      });
    }
    usedVoices.add(mapping[speaker]);
  });

  return mapping;
}

export function getVoiceForSpeaker(speaker: string | null): TtsVoice {
  return pickVoiceForSpeaker(normalizeSpeakerKey(speaker), new Set(), {});
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

function pickVoiceForSpeaker(
  speaker: string,
  usedVoices: Set<TtsVoice>,
  context: {
    section?: number | null;
    speakerIndex?: number;
    speakerCount?: number;
  },
): TtsVoice {
  if (context.section === 3 && context.speakerCount && context.speakerCount >= 3) {
    return pickSectionThreeVoice(speaker, usedVoices, context.speakerIndex ?? 0);
  }

  if (FEMALE_ROLE_PATTERN.test(speaker)) {
    return pickRandomAvailableVoice(FEMALE_STYLE_VOICES, usedVoices);
  }

  if (MALE_ROLE_PATTERN.test(speaker)) {
    return pickRandomAvailableVoice(MALE_STYLE_VOICES, usedVoices);
  }

  if (TUTOR_ROLE_PATTERN.test(speaker)) {
    return pickRandomAvailableVoice(TUTOR_STYLE_VOICES, usedVoices);
  }

  if (STUDENT_ROLE_PATTERN.test(speaker)) {
    return pickRandomAvailableVoice(
      context.speakerIndex === 1
        ? STUDENT_A_STYLE_VOICES
        : STUDENT_B_STYLE_VOICES,
      usedVoices,
    );
  }

  if (NARRATOR_ROLE_PATTERN.test(speaker)) {
    return pickRandomAvailableVoice(NEUTRAL_STYLE_VOICES, usedVoices);
  }

  return pickRandomAvailableVoice(NEUTRAL_STYLE_VOICES, usedVoices);
}

function pickSectionThreeVoice(
  speaker: string,
  usedVoices: Set<TtsVoice>,
  speakerIndex: number,
) {
  if (TUTOR_ROLE_PATTERN.test(speaker)) {
    return pickPreferredAvailableVoice(["onyx", "verse", "alloy"], usedVoices);
  }

  if (STUDENT_A_PATTERN.test(speaker) || FEMALE_ROLE_PATTERN.test(speaker)) {
    return pickPreferredAvailableVoice(["shimmer", "nova", "coral"], usedVoices);
  }

  if (STUDENT_B_PATTERN.test(speaker) || MALE_ROLE_PATTERN.test(speaker)) {
    return pickPreferredAvailableVoice(["echo", "fable", "sage"], usedVoices);
  }

  if (STUDENT_ROLE_PATTERN.test(speaker)) {
    return pickRandomAvailableVoice(
      speakerIndex % 2 === 0 ? STUDENT_B_STYLE_VOICES : STUDENT_A_STYLE_VOICES,
      usedVoices,
    );
  }

  const sectionThreePools = [
    TUTOR_STYLE_VOICES,
    STUDENT_A_STYLE_VOICES,
    STUDENT_B_STYLE_VOICES,
  ];

  return pickRandomAvailableVoice(
    sectionThreePools[speakerIndex % sectionThreePools.length],
    usedVoices,
  );
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

function pickRandomAvailableVoice(
  voices: TtsVoice[],
  usedVoices: Set<TtsVoice>,
) {
  const availableVoices = voices.filter((voice) => !usedVoices.has(voice));

  if (availableVoices.length) {
    return pickRandomVoice(availableVoices);
  }

  const fallbackVoices = FALLBACK_DISTINCT_VOICES.filter(
    (voice) => !usedVoices.has(voice),
  );

  return pickRandomVoice(fallbackVoices.length ? fallbackVoices : voices);
}

function pickPreferredAvailableVoice(
  voices: TtsVoice[],
  usedVoices: Set<TtsVoice>,
) {
  return (
    voices.find((voice) => !usedVoices.has(voice)) ??
    FALLBACK_DISTINCT_VOICES.find((voice) => !usedVoices.has(voice)) ??
    voices[0]
  );
}
