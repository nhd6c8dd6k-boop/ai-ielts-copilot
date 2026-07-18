import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requireAdminUser } from "@/server/services/admin-auth";
import {
  extendManualPro,
  type GrantManualProResult,
  getSupabaseErrorField,
  getMemberships,
  grantManualPro,
  MembershipServiceError,
  revokeManualPro,
} from "@/server/services/memberships";
import { apiErrorResponse } from "@/server/utils/api-error";

const durationSchema = z.union([
  z.literal(30),
  z.literal(90),
  z.literal(180),
  z.literal(365),
]);

const membershipActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("grant"),
    targetUserId: z.string().uuid(),
    durationDays: durationSchema.optional(),
    customExpiry: z.string().datetime().optional(),
    notes: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("extend"),
    targetUserId: z.string().uuid(),
    durationDays: durationSchema,
    notes: z.string().max(500).optional(),
  }),
  z.object({
    action: z.literal("revoke"),
    targetUserId: z.string().uuid(),
    notes: z.string().max(500).optional(),
  }),
]);

export async function GET(request: Request) {
  const adminUser = await requireAdminUser();

  if (!adminUser.ok) {
    return adminUser.response;
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search") ?? "";

  try {
    const memberships = await getMemberships(
      createSupabaseAdminClient(),
      search,
    );

    return NextResponse.json({ memberships });
  } catch (error) {
    return apiErrorResponse(error, {
      fallback: "Failed to load memberships.",
      status: 500,
      context: "admin_memberships_load_failed",
    });
  }
}

export async function POST(request: Request) {
  const adminUser = await requireAdminUser();

  if (!adminUser.ok) {
    return adminUser.response;
  }

  const input = membershipActionSchema.parse(await request.json());
  const admin = createSupabaseAdminClient();
  let grantResult: GrantManualProResult | null = null;

  try {
    if (input.action === "grant") {
      grantResult = await grantManualPro({
        admin,
        adminUserId: adminUser.userId,
        targetUserId: input.targetUserId,
        expiresAt: resolveGrantExpiry(input.durationDays, input.customExpiry),
        notes: input.notes,
      });
    }

    if (input.action === "extend") {
      await extendManualPro({
        admin,
        adminUserId: adminUser.userId,
        targetUserId: input.targetUserId,
        durationDays: input.durationDays,
        notes: input.notes,
      });
    }

    if (input.action === "revoke") {
      await revokeManualPro({
        admin,
        adminUserId: adminUser.userId,
        targetUserId: input.targetUserId,
        notes: input.notes,
      });
    }

    const memberships = await getMemberships(admin);

    return NextResponse.json({
      ok: true,
      memberships,
      emailDelivery: grantResult?.emailDelivery,
    });
  } catch (error) {
    logMembershipApiError(error);

    return NextResponse.json(
      {
        error:
          error instanceof MembershipServiceError
            ? error.category
            : "membership_write_failed",
      },
      { status: 500 },
    );
  }
}

function resolveGrantExpiry(durationDays?: number, customExpiry?: string) {
  if (customExpiry) {
    return customExpiry;
  }

  const days = durationDays ?? 30;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt.toISOString();
}

function logMembershipApiError(error: unknown) {
  const category =
    error instanceof MembershipServiceError
      ? error.category
      : "membership_write_failed";

  console.error("admin_membership_update_failed", {
    category,
    code: getSupabaseErrorField(error, "code"),
    message: getSupabaseErrorField(error, "message"),
    details: getSupabaseErrorField(error, "details"),
    hint: getSupabaseErrorField(error, "hint"),
  });
}
