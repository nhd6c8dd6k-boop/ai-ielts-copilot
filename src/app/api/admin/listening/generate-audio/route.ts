import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/server/services/admin-auth";
import { parseListeningScript } from "@/server/services/listening-script-parser";
import { generateSpeech } from "@/server/services/tts";
import { createOrReuseVoiceMapping } from "@/server/services/tts-voices";
import { apiErrorResponse } from "@/server/utils/api-error";

const generateListeningAudioSchema = z.object({
  listening_set_id: z.string().uuid(),
  regenerate_with_new_voices: z.boolean().optional().default(false),
});

const LISTENING_AUDIO_BUCKET = "listening-audio";

type ListeningSetForAudio = {
  id: string;
  title: string;
  script: string;
  audio_url: string | null;
  section: number;
  tts_voice_mapping?: unknown;
  hasVoiceMappingColumn: boolean;
};

export async function POST(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const parsed = generateListeningAudioSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid listening_set_id." },
      { status: 400 },
    );
  }

  if (!env.openaiApiKey) {
    return NextResponse.json(
      {
        error:
          "TTS is not available because OPENAI_API_KEY is not configured.",
      },
      { status: 503 },
    );
  }

  const admin = createSupabaseAdminClient();
  const listeningSetId = parsed.data.listening_set_id;
  const { listeningSet, error: setError } = await getListeningSetForAudio(
    admin,
    listeningSetId,
  );

  if (setError) {
    return apiErrorResponse(setError, {
      fallback: "Failed to load Listening set.",
      status: 400,
      context: "admin_tts_listening_set_load_failed",
    });
  }

  if (!listeningSet) {
    return NextResponse.json(
      { error: "Listening set not found." },
      { status: 404 },
    );
  }

  if (!listeningSet.script?.trim()) {
    await writeAdminLog({
      adminUserId: auth.userId,
      action: "listening_audio_generation_failed",
      targetId: listeningSetId,
      metadata: { error: "Missing listening script." },
    });

    return NextResponse.json(
      { error: "Listening script is empty. Audio cannot be generated." },
      { status: 400 },
    );
  }

  try {
    await ensureListeningAudioBucket(admin);

    const parsedSegments = parseListeningScript(listeningSet.script);
    const voiceMapping = createOrReuseVoiceMapping({
      segments: parsedSegments,
      existingMapping: listeningSet.tts_voice_mapping,
      forceNew: parsed.data.regenerate_with_new_voices,
      singleNarrator: listeningSet.section === 2 || listeningSet.section === 4,
      section: listeningSet.section,
    });
    const speech = await generateSpeech({
      provider: "openai",
      text: listeningSet.script,
      segments: parsedSegments,
      section: listeningSet.section,
      voiceMapping,
    });
    const storagePath = `listening/${listeningSetId}-${Date.now()}.mp3`;
    const { error: uploadError } = await admin.storage
      .from(LISTENING_AUDIO_BUCKET)
      .upload(storagePath, speech.audioBuffer, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = admin.storage
      .from(LISTENING_AUDIO_BUCKET)
      .getPublicUrl(storagePath);
    const audioUrl = publicUrlData.publicUrl;
    const updatePayload: Record<string, unknown> = {
      audio_url: audioUrl,
      audio_status: "ready",
    };

    if (listeningSet.hasVoiceMappingColumn) {
      updatePayload.tts_voice_mapping = voiceMapping;
    }

    const { error: updateError } = await admin
      .from("listening_sets")
      .update(updatePayload)
      .eq("id", listeningSetId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    await admin.from("ai_usage_logs").insert({
      admin_user_id: auth.userId,
      usage_type: "tts_generate",
      content_type: "listening",
      target_type: "listening_set",
      target_id: listeningSetId,
      model: speech.model,
      input_tokens: speech.estimatedTokens,
      output_tokens: 0,
      total_tokens: speech.estimatedTokens,
      estimated_cost: speech.estimatedCost,
    });

    await writeAdminLog({
      adminUserId: auth.userId,
      action: "listening_audio_generated",
      targetId: listeningSetId,
      metadata: {
        provider: speech.provider,
        model: speech.model,
        audioStatus: "ready",
        storagePath,
        previousStoragePath: getStoragePathFromPublicUrl(listeningSet.audio_url),
        inputCharacters: speech.inputCharacters,
        estimatedTokens: speech.estimatedTokens,
        estimatedCost: speech.estimatedCost,
        section: speech.section,
        segmentCount: speech.segmentCount,
        voiceStrategy: speech.voiceStrategy,
        voices: speech.voices,
        voiceMappingSummary: speech.voiceMappingSummary,
        savedVoiceMapping: voiceMapping,
        voiceMappingPersisted: listeningSet.hasVoiceMappingColumn,
        regeneratedWithNewVoices: parsed.data.regenerate_with_new_voices,
        pauseSummary: speech.pauseSummary,
        pauseStrategy: speech.pauseStrategy,
        ttsProfile: speech.ttsProfile,
        speed: speech.speed,
        inputPreview: speech.inputPreview,
        inputContainsSpeakerLabels: speech.inputContainsSpeakerLabels,
      },
    });

    return NextResponse.json({
      ok: true,
      id: listeningSetId,
      title: listeningSet.title,
      audioStatus: "ready",
      audioUrl,
      storagePath,
      previousStoragePath: getStoragePathFromPublicUrl(listeningSet.audio_url),
      usage: {
        model: speech.model,
        inputTokens: speech.estimatedTokens,
        outputTokens: 0,
        totalTokens: speech.estimatedTokens,
        estimatedCost: speech.estimatedCost,
        section: speech.section,
        segmentCount: speech.segmentCount,
        voiceStrategy: speech.voiceStrategy,
        speed: speech.speed,
        pauseStrategy: speech.pauseStrategy,
        ttsProfile: speech.ttsProfile,
        voiceMappingSummary: speech.voiceMappingSummary,
        savedVoiceMapping: voiceMapping,
        voiceMappingPersisted: listeningSet.hasVoiceMappingColumn,
        regeneratedWithNewVoices: parsed.data.regenerate_with_new_voices,
        inputPreview: speech.inputPreview,
        inputContainsSpeakerLabels: speech.inputContainsSpeakerLabels,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Audio generation failed.";

    await writeAdminLog({
      adminUserId: auth.userId,
      action: "listening_audio_generation_failed",
      targetId: listeningSetId,
      metadata: { error: message },
    });

    return apiErrorResponse(error, {
      fallback: "Audio generation failed.",
      status: 500,
      context: "admin_tts_generation_failed",
    });
  }
}

function getStoragePathFromPublicUrl(audioUrl?: string | null) {
  if (!audioUrl) {
    return null;
  }

  try {
    return new URL(audioUrl).pathname.replace(
      `/storage/v1/object/public/${LISTENING_AUDIO_BUCKET}/`,
      "",
    );
  } catch {
    return null;
  }
}

async function getListeningSetForAudio(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  listeningSetId: string,
): Promise<{
  listeningSet: ListeningSetForAudio | null;
  error: { message: string } | null;
}> {
  const { data, error } = await admin
    .from("listening_sets")
    .select("id,title,script,audio_url,section,tts_voice_mapping")
    .eq("id", listeningSetId)
    .maybeSingle();

  if (!error) {
    return {
      listeningSet: data
        ? {
            ...data,
            hasVoiceMappingColumn: true,
          }
        : null,
      error: null,
    };
  }

  if (!isMissingVoiceMappingColumnError(error)) {
    return {
      listeningSet: null,
      error,
    };
  }

  const fallback = await admin
    .from("listening_sets")
    .select("id,title,script,audio_url,section")
    .eq("id", listeningSetId)
    .maybeSingle();

  if (fallback.error) {
    return {
      listeningSet: null,
      error: fallback.error,
    };
  }

  return {
    listeningSet: fallback.data
      ? {
          ...fallback.data,
          tts_voice_mapping: {},
          hasVoiceMappingColumn: false,
        }
      : null,
    error: null,
  };
}

function isMissingVoiceMappingColumnError(error: { message?: string; code?: string }) {
  return (
    error.code === "PGRST204" ||
    Boolean(error.message?.includes("tts_voice_mapping"))
  );
}

async function ensureListeningAudioBucket(
  admin: ReturnType<typeof createSupabaseAdminClient>,
) {
  const { data: buckets, error: listError } = await admin.storage.listBuckets();

  if (listError) {
    throw new Error(listError.message);
  }

  const exists = buckets?.some((bucket) => bucket.name === LISTENING_AUDIO_BUCKET);

  if (exists) {
    return;
  }

  const { error: createError } = await admin.storage.createBucket(
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

async function writeAdminLog({
  adminUserId,
  action,
  targetId,
  metadata,
}: {
  adminUserId: string;
  action: string;
  targetId: string;
  metadata: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: "listening_set",
    target_id: targetId,
    metadata,
  });
}
