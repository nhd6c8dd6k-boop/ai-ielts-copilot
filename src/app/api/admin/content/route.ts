import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/server/services/admin-auth";

const adminContentMutationSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["reading", "listening", "writing"]),
  status: z.enum(["draft", "review", "published", "archived"]).optional(),
});

const tableByType = {
  reading: "reading_sets",
  listening: "listening_sets",
  writing: "writing_tasks",
} as const;

export async function PATCH(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const input = adminContentMutationSchema.parse(await request.json());

  if (!input.status) {
    return NextResponse.json({ error: "Missing status." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from(tableByType[input.type])
    .update({
      status: input.status,
      published_at:
        input.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", input.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAdminLog({
    adminUserId: auth.userId,
    action: "content_status_updated",
    targetType: input.type,
    targetId: input.id,
    metadata: { status: input.status },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const input = adminContentMutationSchema.parse(await request.json());
  const admin = createSupabaseAdminClient();
  const { error } = await admin
    .from(tableByType[input.type])
    .delete()
    .eq("id", input.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  await writeAdminLog({
    adminUserId: auth.userId,
    action: "content_deleted",
    targetType: input.type,
    targetId: input.id,
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}

async function writeAdminLog({
  adminUserId,
  action,
  targetType,
  targetId,
  metadata,
}: {
  adminUserId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();

  await admin.from("admin_logs").insert({
    admin_user_id: adminUserId,
    action,
    target_type: targetType,
    target_id: targetId,
    metadata,
  });
}
