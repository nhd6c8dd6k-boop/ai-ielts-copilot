import { NextResponse } from "next/server";

import { getSpeakingLibraryCounts } from "@/server/services/speaking-practice";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const speaking = await getSpeakingLibraryCounts();

    return NextResponse.json({ speaking });
  } catch {
    return NextResponse.json({ speaking: null });
  }
}
