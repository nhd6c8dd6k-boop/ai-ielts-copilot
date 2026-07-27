#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";

import { ELEVENLABS_LISTENING_SETS } from "./elevenlabs-listening-content.mjs";
import {
  generateElevenLabsDialogueAudio,
  getElevenLabsVoiceConfig,
  getElevenLabsVoiceEnvKey,
  validateElevenLabsDialogueInputs,
} from "../src/server/services/elevenlabs-tts.ts";

const LISTENING_AUDIO_BUCKET = "listening-audio";
const AUDIO_PATH_PREFIX = "listening";
const MIN_RECOMMENDED_SPOKEN_CHARACTERS = 1300;

if (isMainModule()) {
  await main();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selectedSets = args.set
    ? ELEVENLABS_LISTENING_SETS.filter((set) => set.slug === args.set)
    : ELEVENLABS_LISTENING_SETS;

  if (!selectedSets.length) {
    throw new Error(`No Listening set matches --set ${args.set}.`);
  }

  const validation = validateListeningPracticeSets(selectedSets, {
    allowPartial: Boolean(args.set),
  });

  if (!args.execute) {
    console.log("ElevenLabs Listening generation dry-run passed.");
    printValidationSummary(validation, { dryRun: true });
    console.log(
      "No ElevenLabs request, Supabase write, or Storage upload was performed.",
    );
    return;
  }

  const voiceConfig = getElevenLabsVoiceConfig();
  const supabase = createSupabaseClient();
  await ensureListeningAudioBucket(supabase);

  const results = [];

  for (const practiceSet of selectedSets) {
    const result = await executeSet({ supabase, practiceSet, voiceConfig, args });
    results.push(result);
  }

  console.log("ElevenLabs Listening generation finished.");
  console.table(results);
}

function parseArgs(rawArgs) {
  const parsed = {
    execute: false,
    retryFailed: false,
    set: "",
  };

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === "--execute") {
      parsed.execute = true;
    } else if (arg === "--retry-failed") {
      parsed.retryFailed = true;
    } else if (arg === "--dry-run") {
      parsed.execute = false;
    } else if (arg === "--set") {
      parsed.set = rawArgs[index + 1] ?? "";
      index += 1;
    }
  }

  return parsed;
}

export function validateListeningPracticeSets(practiceSets, options = {}) {
  if (practiceSets.length !== 5 && !options.allowPartial) {
    throw new Error("Expected exactly 5 ElevenLabs Listening sets.");
  }

  const seedKeys = new Set();
  const summaries = [];

  for (const practiceSet of practiceSets) {
    if (seedKeys.has(practiceSet.seedKey)) {
      throw new Error(`Duplicate seed key: ${practiceSet.seedKey}`);
    }

    seedKeys.add(practiceSet.seedKey);
    validateSetShape(practiceSet);
    const dummyInputs = buildDialogueInputs(practiceSet, buildDummyVoiceConfig());
    const inputStats = validateElevenLabsDialogueInputs(dummyInputs);

    if (inputStats.inputCharacters < MIN_RECOMMENDED_SPOKEN_CHARACTERS) {
      throw new Error(
        `${practiceSet.title}: spoken script is ${inputStats.inputCharacters} characters; expected at least ${MIN_RECOMMENDED_SPOKEN_CHARACTERS}.`,
      );
    }

    validateQuestions(practiceSet);
    summaries.push({
      seedKey: practiceSet.seedKey,
      title: practiceSet.title,
      section: practiceSet.section,
      questions: practiceSet.questions.length,
      scriptCharacters: inputStats.inputCharacters,
      speakerTurns: inputStats.segmentCount,
      voiceRoles: [...new Set(practiceSet.speakers.map((speaker) => speaker.voiceRole))].length,
    });
  }

  return summaries;
}

function isMainModule() {
  return import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
}

function validateSetShape(practiceSet) {
  if (!practiceSet.seedKey || !practiceSet.slug || !practiceSet.title) {
    throw new Error("Every Listening set needs a seedKey, slug, and title.");
  }

  if (!Number.isInteger(practiceSet.section) || practiceSet.section < 1 || practiceSet.section > 4) {
    throw new Error(`${practiceSet.title}: section must be 1 to 4.`);
  }

  if (!Number.isInteger(practiceSet.band) || practiceSet.band < 5 || practiceSet.band > 9) {
    throw new Error(`${practiceSet.title}: band must be 5 to 9.`);
  }

  if (!practiceSet.speakers.length || !practiceSet.turns.length) {
    throw new Error(`${practiceSet.title}: speakers and turns are required.`);
  }

  const speakerIds = new Set(practiceSet.speakers.map((speaker) => speaker.id));

  for (const turn of practiceSet.turns) {
    if (!speakerIds.has(turn.speaker)) {
      throw new Error(`${practiceSet.title}: unknown speaker ${turn.speaker}.`);
    }
  }

  for (const speaker of practiceSet.speakers) {
    getElevenLabsVoiceEnvKey(speaker.voiceRole);
  }
}

function validateQuestions(practiceSet) {
  if (practiceSet.questions.length !== 10) {
    throw new Error(`${practiceSet.title}: expected exactly 10 questions.`);
  }

  const numbers = practiceSet.questions.map((question) => question.number);

  for (let index = 1; index <= 10; index += 1) {
    if (!numbers.includes(index)) {
      throw new Error(`${practiceSet.title}: missing question ${index}.`);
    }
  }

  for (const question of practiceSet.questions) {
    if (!question.type || !question.prompt || !question.answer) {
      throw new Error(`${practiceSet.title} Q${question.number}: missing required fields.`);
    }

    if (
      question.options.length &&
      !question.options.some((option) => option === question.answer)
    ) {
      throw new Error(
        `${practiceSet.title} Q${question.number}: answer must exist in options.`,
      );
    }
  }
}

async function executeSet({ supabase, practiceSet, voiceConfig, args }) {
  const existing = await findExistingSet(supabase, practiceSet.seedKey);

  if (existing?.status === "published") {
    return resultRow(practiceSet, "skipped_published", existing.id);
  }

  if (existing?.audio_status === "ready" && existing.audio_url?.trim()) {
    return resultRow(practiceSet, "skipped_ready", existing.id);
  }

  if (existing && existing.audio_status !== "failed" && !args.retryFailed) {
    return resultRow(practiceSet, `skipped_${existing.audio_status}`, existing.id);
  }

  const setId =
    existing?.id ?? (await createListeningSet(supabase, practiceSet, voiceConfig));

  try {
    await markAudioStatus(supabase, setId, practiceSet, voiceConfig, "generating");

    if (!existing) {
      await insertQuestions(supabase, setId, practiceSet);
    }

    const inputs = buildDialogueInputs(practiceSet, voiceConfig);
    const audio = await generateElevenLabsDialogueAudio({ inputs });
    const storagePath = `${AUDIO_PATH_PREFIX}/${setId}/elevenlabs-${Date.now()}.mp3`;
    const { error: uploadError } = await supabase.storage
      .from(LISTENING_AUDIO_BUCKET)
      .upload(storagePath, audio.audioBuffer, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabase.storage
      .from(LISTENING_AUDIO_BUCKET)
      .getPublicUrl(storagePath);
    const audioUrl = publicUrlData.publicUrl;
    const { error: updateError } = await supabase
      .from("listening_sets")
      .update({
        audio_url: audioUrl,
        audio_status: "ready",
        tts_voice_mapping: buildVoiceMetadata(practiceSet, voiceConfig, {
          status: "ready",
          storagePath,
          inputCharacters: audio.inputCharacters,
        }),
      })
      .eq("id", setId);

    if (updateError) {
      throw new Error(
        `Database update failed after upload. Orphan storage path: ${storagePath}. ${updateError.message}`,
      );
    }

    await writeAdminLog(supabase, {
      action: "listening_audio_generated",
      targetId: setId,
      metadata: {
        provider: "elevenlabs",
        model: "eleven_v3",
        seedKey: practiceSet.seedKey,
        status: "ready",
        characterCount: audio.inputCharacters,
        voiceCount: audio.voiceCount,
        storagePath,
      },
    });

    return resultRow(practiceSet, "ready", setId, {
      characters: audio.inputCharacters,
      storagePath,
    });
  } catch (error) {
    const safeError = error instanceof Error ? error.message : "Generation failed.";
    await markAudioStatus(
      supabase,
      setId,
      practiceSet,
      voiceConfig,
      "failed",
      safeError,
    );
    await writeAdminLog(supabase, {
      action: "listening_audio_generation_failed",
      targetId: setId,
      metadata: {
        provider: "elevenlabs",
        model: "eleven_v3",
        seedKey: practiceSet.seedKey,
        status: "failed",
        error: safeError,
      },
    });
    return resultRow(practiceSet, "failed", setId, { error: safeError });
  }
}

async function createListeningSet(supabase, practiceSet, voiceConfig) {
  const { data, error } = await supabase
    .from("listening_sets")
    .insert({
      title: practiceSet.title,
      section: practiceSet.section,
      topic: practiceSet.topic,
      band: practiceSet.band,
      script: buildTranscript(practiceSet),
      audio_url: null,
      audio_status: "generating",
      voice: `elevenlabs:${practiceSet.seedKey}`,
      tts_voice_mapping: buildVoiceMetadata(practiceSet, voiceConfig, {
        status: "generating",
      }),
      source_type: "admin_original",
      status: "review",
      published_at: null,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

async function insertQuestions(supabase, setId, practiceSet) {
  try {
    for (const question of practiceSet.questions) {
      const { data, error } = await supabase
        .from("generated_questions")
        .insert({
          set_type: "listening",
          set_id: setId,
          question_type: question.type,
          question_number: question.number,
          prompt: question.prompt,
          options: question.options,
          metadata: {
            seed_key: practiceSet.seedKey,
            answer_count: question.answer.split(/\s*;\s*/).filter(Boolean).length,
          },
        })
        .select("id")
        .single();

      if (error) throw new Error(error.message);

      const { error: answerError } = await supabase
        .from("generated_answers")
        .insert({
          question_id: data.id,
          correct_answer: question.answer,
          explanation_en: question.explanation_en,
          explanation_zh: question.explanation_zh,
          synonyms: question.synonyms ?? [],
          vocabulary: [],
        });

      if (answerError) throw new Error(answerError.message);
    }
  } catch (error) {
    await supabase.from("listening_sets").delete().eq("id", setId);
    throw error;
  }
}

async function findExistingSet(supabase, seedKey) {
  const { data, error } = await supabase
    .from("listening_sets")
    .select("id,title,status,audio_status,audio_url")
    .eq("voice", `elevenlabs:${seedKey}`)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function markAudioStatus(
  supabase,
  setId,
  practiceSet,
  voiceConfig,
  status,
  errorMessage,
) {
  await supabase
    .from("listening_sets")
    .update({
      audio_status: status,
      tts_voice_mapping: buildVoiceMetadata(practiceSet, voiceConfig, {
        status,
        error: errorMessage ? sanitizeError(errorMessage) : undefined,
      }),
    })
    .eq("id", setId);
}

async function ensureListeningAudioBucket(supabase) {
  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    throw new Error(error.message);
  }

  if (buckets?.some((bucket) => bucket.name === LISTENING_AUDIO_BUCKET)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(
    LISTENING_AUDIO_BUCKET,
    {
      public: true,
      allowedMimeTypes: ["audio/mpeg"],
    },
  );

  if (createError) {
    throw new Error(createError.message);
  }
}

async function writeAdminLog(supabase, { action, targetId, metadata }) {
  await supabase.from("admin_logs").insert({
    admin_user_id: null,
    action,
    target_type: "listening_set",
    target_id: targetId,
    metadata,
  });
}

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for execution.",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function buildDialogueInputs(practiceSet, voiceConfig) {
  const speakerById = new Map(
    practiceSet.speakers.map((speaker) => [speaker.id, speaker]),
  );

  return practiceSet.turns.map((turn) => {
    const speaker = speakerById.get(turn.speaker);

    if (!speaker) {
      throw new Error(`${practiceSet.title}: unknown speaker ${turn.speaker}.`);
    }

    return {
      text: turn.text.trim(),
      voiceId: voiceConfig[speaker.voiceRole],
    };
  });
}

function buildTranscript(practiceSet) {
  const speakerById = new Map(
    practiceSet.speakers.map((speaker) => [speaker.id, speaker.label]),
  );

  return practiceSet.turns
    .map((turn) => `${speakerById.get(turn.speaker) ?? "Speaker"}: ${turn.text}`)
    .join("\n\n");
}

function buildVoiceMetadata(practiceSet, voiceConfig, extra = {}) {
  return {
    provider: "elevenlabs",
    model: "eleven_v3",
    seed_key: practiceSet.seedKey,
    script_character_count: practiceSet.turns.reduce(
      (sum, turn) => sum + turn.text.trim().length,
      0,
    ),
    voices: Object.fromEntries(
      practiceSet.speakers.map((speaker) => [
        speaker.label,
        {
          role: speaker.voiceRole,
          env: getElevenLabsVoiceEnvKey(speaker.voiceRole),
          voice_id: voiceConfig[speaker.voiceRole],
        },
      ]),
    ),
    generated_at: new Date().toISOString(),
    ...extra,
  };
}

function buildDummyVoiceConfig() {
  return {
    britishFemale: "dry-run-british-female",
    britishMale: "dry-run-british-male",
    australianFemale: "dry-run-australian-female",
    australianMale: "dry-run-australian-male",
    narrator: "dry-run-narrator",
  };
}

function printValidationSummary(rows, { dryRun }) {
  console.table(rows);
  if (dryRun) {
    console.log("Run with --execute to generate audio and write pending_review sets.");
  }
}

function resultRow(practiceSet, status, id, extra = {}) {
  return {
    title: practiceSet.title,
    seedKey: practiceSet.seedKey,
    id,
    status,
    ...extra,
  };
}

function sanitizeError(message) {
  return message
    .replace(/xi-api-key[^\s,]*/gi, "xi-api-key redacted")
    .replace(/sk_[A-Za-z0-9_-]+/g, "redacted");
}
