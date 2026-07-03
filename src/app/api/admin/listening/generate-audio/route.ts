import { NextResponse } from "next/server";
import { z } from "zod";

import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/server/services/admin-auth";
import { parseListeningScript } from "@/server/services/listening-script-parser";
import { generateSpeech } from "@/server/services/tts";

const generateListeningAudioSchema = z.object({
  listening_set_id: z.string().uuid(),
});

const LISTENING_AUDIO_BUCKET = "listening-audio";

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
  const { data: listeningSet, error: setError } = await admin
    .from("listening_sets")
    .select("id,title,script")
    .eq("id", listeningSetId)
    .maybeSingle();

  if (setError) {
    return NextResponse.json({ error: setError.message }, { status: 400 });
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

    const speech = await generateSpeech({
      provider: "openai",
      text: listeningSet.script,
      segments: parseListeningScript(listeningSet.script),
    });
    const storagePath = `listening/${listeningSetId}.mp3`;
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
    const { error: updateError } = await admin
      .from("listening_sets")
      .update({
        audio_url: audioUrl,
        audio_status: "ready",
      })
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
        inputCharacters: speech.inputCharacters,
        estimatedTokens: speech.estimatedTokens,
        estimatedCost: speech.estimatedCost,
        segmentCount: speech.segmentCount,
        voiceStrategy: speech.voiceStrategy,
        voices: speech.voices,
      },
    });

    return NextResponse.json({
      ok: true,
      id: listeningSetId,
      title: listeningSet.title,
      audioStatus: "ready",
      audioUrl,
      usage: {
        model: speech.model,
        inputTokens: speech.estimatedTokens,
        outputTokens: 0,
        totalTokens: speech.estimatedTokens,
        estimatedCost: speech.estimatedCost,
        segmentCount: speech.segmentCount,
        voiceStrategy: speech.voiceStrategy,
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

    return NextResponse.json({ error: message }, { status: 500 });
  }
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
