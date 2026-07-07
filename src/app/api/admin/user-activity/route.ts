import { NextResponse } from "next/server";

import { requireAdminUser } from "@/server/services/admin-auth";
import { getUserActivity } from "@/server/services/admin-dashboard";

export async function GET() {
  const auth = await requireAdminUser();

  if (!auth.ok) {
    return auth.response;
  }

  const userActivity = await getUserActivity();

  return NextResponse.json({ userActivity });
}
