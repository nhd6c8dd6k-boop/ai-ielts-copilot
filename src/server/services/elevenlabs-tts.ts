export type ElevenLabsVoiceRole =
  | "britishFemale"
  | "britishMale"
  | "australianFemale"
  | "australianMale"
  | "narrator";

export type ElevenLabsDialogueTurn = {
  text: string;
  voiceId: string;
};

export type ElevenLabsDialogueAudioResult = {
  provider: "elevenlabs";
  model: "eleven_v3";
  outputFormat: "mp3_44100_128";
  audioBuffer: Buffer;
  inputCharacters: number;
  segmentCount: number;
  voiceCount: number;
  contentType: string;
};

export class ElevenLabsTtsError extends Error {
  code: string;
  status?: number;

  constructor(message: string, code: string, status?: number) {
    super(message);
    this.name = "ElevenLabsTtsError";
    this.code = code;
    this.status = status;
  }
}

export const ELEVENLABS_TEXT_TO_DIALOGUE_ENDPOINT =
  "https://api.elevenlabs.io/v1/text-to-dialogue";
export const ELEVENLABS_DIALOGUE_MODEL = "eleven_v3";
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128";
export const MAX_ELEVENLABS_DIALOGUE_CHARACTERS = 2000;
export const MAX_ELEVENLABS_UNIQUE_VOICES = 10;
const MIN_AUDIO_BYTES = 20 * 1024;
const ELEVENLABS_TIMEOUT_MS = 90_000;

const voiceRoleEnvKeys = {
  britishFemale: "ELEVENLABS_VOICE_BRITISH_FEMALE",
  britishMale: "ELEVENLABS_VOICE_BRITISH_MALE",
  australianFemale: "ELEVENLABS_VOICE_AUSTRALIAN_FEMALE",
  australianMale: "ELEVENLABS_VOICE_AUSTRALIAN_MALE",
  narrator: "ELEVENLABS_VOICE_NARRATOR",
} satisfies Record<ElevenLabsVoiceRole, string>;

export function getElevenLabsVoiceConfig(env = process.env) {
  return Object.fromEntries(
    Object.entries(voiceRoleEnvKeys).map(([role, key]) => [
      role,
      readRequiredEnv(env, key),
    ]),
  ) as Record<ElevenLabsVoiceRole, string>;
}

export function getElevenLabsVoiceEnvKey(role: ElevenLabsVoiceRole) {
  return voiceRoleEnvKeys[role];
}

export function validateElevenLabsDialogueInputs(
  turns: ElevenLabsDialogueTurn[],
) {
  if (!turns.length) {
    throw new ElevenLabsTtsError(
      "ElevenLabs dialogue input must contain at least one turn.",
      "empty_dialogue_input",
    );
  }

  let inputCharacters = 0;
  const voiceIds = new Set<string>();

  for (const turn of turns) {
    const text = turn.text.trim();
    const voiceId = turn.voiceId.trim();

    if (!text) {
      throw new ElevenLabsTtsError(
        "ElevenLabs dialogue turn text cannot be empty.",
        "empty_dialogue_text",
      );
    }

    if (!voiceId) {
      throw new ElevenLabsTtsError(
        "ElevenLabs dialogue turn voice_id cannot be empty.",
        "missing_dialogue_voice",
      );
    }

    assertNoUnsafeSpokenText(text);
    inputCharacters += text.length;
    voiceIds.add(voiceId);
  }

  if (inputCharacters > MAX_ELEVENLABS_DIALOGUE_CHARACTERS) {
    throw new ElevenLabsTtsError(
      `ElevenLabs dialogue input is ${inputCharacters} characters; keep it at or below ${MAX_ELEVENLABS_DIALOGUE_CHARACTERS}.`,
      "dialogue_text_too_long",
    );
  }

  if (voiceIds.size > MAX_ELEVENLABS_UNIQUE_VOICES) {
    throw new ElevenLabsTtsError(
      `ElevenLabs dialogue input uses ${voiceIds.size} voices; maximum is ${MAX_ELEVENLABS_UNIQUE_VOICES}.`,
      "too_many_voices",
    );
  }

  return {
    inputCharacters,
    voiceCount: voiceIds.size,
    segmentCount: turns.length,
  };
}

export async function generateElevenLabsDialogueAudio({
  inputs,
  apiKey = process.env.ELEVENLABS_API_KEY,
  fetchImpl = fetch,
}: {
  inputs: ElevenLabsDialogueTurn[];
  apiKey?: string;
  fetchImpl?: typeof fetch;
}): Promise<ElevenLabsDialogueAudioResult> {
  if (!apiKey?.trim()) {
    throw new ElevenLabsTtsError(
      "ELEVENLABS_API_KEY is not configured.",
      "missing_api_key",
    );
  }

  const validated = validateElevenLabsDialogueInputs(inputs);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ELEVENLABS_TIMEOUT_MS);

  try {
    const response = await fetchImpl(
      `${ELEVENLABS_TEXT_TO_DIALOGUE_ENDPOINT}?output_format=${ELEVENLABS_OUTPUT_FORMAT}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: inputs.map((input) => ({
            text: input.text,
            voice_id: input.voiceId,
          })),
          model_id: ELEVENLABS_DIALOGUE_MODEL,
        }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      throw await toElevenLabsHttpError(response);
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!isAudioContentType(contentType)) {
      throw new ElevenLabsTtsError(
        "ElevenLabs returned a non-audio response.",
        "invalid_audio_response",
        response.status,
      );
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    if (audioBuffer.length < MIN_AUDIO_BYTES || looksLikeJson(audioBuffer)) {
      throw new ElevenLabsTtsError(
        "ElevenLabs returned an empty or invalid audio file.",
        "empty_audio_response",
        response.status,
      );
    }

    return {
      provider: "elevenlabs",
      model: ELEVENLABS_DIALOGUE_MODEL,
      outputFormat: ELEVENLABS_OUTPUT_FORMAT,
      audioBuffer,
      inputCharacters: validated.inputCharacters,
      segmentCount: validated.segmentCount,
      voiceCount: validated.voiceCount,
      contentType,
    };
  } catch (error) {
    if (error instanceof ElevenLabsTtsError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ElevenLabsTtsError(
        "ElevenLabs request timed out.",
        "request_timeout",
      );
    }

    throw new ElevenLabsTtsError(
      "ElevenLabs audio generation failed.",
      "request_failed",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function readRequiredEnv(env: NodeJS.ProcessEnv, key: string) {
  const value = env[key];

  if (!value?.trim()) {
    throw new ElevenLabsTtsError(
      `${key} is not configured.`,
      "missing_voice_configuration",
    );
  }

  return value.trim();
}

function assertNoUnsafeSpokenText(text: string) {
  if (/```/.test(text)) {
    throw new ElevenLabsTtsError(
      "Dialogue text must not contain markdown code fences.",
      "unsafe_dialogue_text",
    );
  }

  if (/\b(?:answer|answers?|key|correct answer)\s*:/i.test(text)) {
    throw new ElevenLabsTtsError(
      "Dialogue text must not contain answer keys.",
      "unsafe_dialogue_text",
    );
  }

  if (/^\s*[\w\s-]{1,32}\s*:/m.test(text)) {
    throw new ElevenLabsTtsError(
      "Dialogue text must not include speaker role labels.",
      "speaker_label_in_dialogue_text",
    );
  }
}

async function toElevenLabsHttpError(response: Response) {
  const safeMessage = await readSafeErrorMessage(response);
  const code = classifyStatus(response.status, safeMessage);

  return new ElevenLabsTtsError(safeMessage, code, response.status);
}

async function readSafeErrorMessage(response: Response) {
  let body = "";

  try {
    body = (await response.text()).slice(0, 500);
  } catch {
    body = "";
  }

  if (response.status === 401 || response.status === 403) {
    return "ElevenLabs authentication failed.";
  }

  if (response.status === 429) {
    return "ElevenLabs rate limit or quota was exceeded.";
  }

  if (response.status === 422 || /voice/i.test(body)) {
    return "ElevenLabs rejected the request. Check voice IDs and text length.";
  }

  return "ElevenLabs request failed.";
}

function classifyStatus(status: number, message: string) {
  if (status === 401 || status === 403) return "authentication_failed";
  if (status === 429) return "rate_limit_or_quota_exceeded";
  if (/voice/i.test(message)) return "invalid_voice";
  if (/length|characters/i.test(message)) return "text_too_long";
  return "http_error";
}

function isAudioContentType(contentType: string) {
  return /audio\/(?:mpeg|mp3|x-mpeg|mp4|wav|wave)/i.test(contentType);
}

function looksLikeJson(buffer: Buffer) {
  const prefix = buffer.subarray(0, 32).toString("utf8").trimStart();

  return prefix.startsWith("{") || prefix.startsWith("[");
}
