import { NextResponse } from "next/server";

const disabledMessage =
  "User-side AI generation is disabled in V1. Please use published practice content.";

export async function POST() {
  // User-side AI generation may return later as a Pro+ feature, but it is
  // disabled in V1 for cost control and content quality.
  return NextResponse.json(
    {
      error: disabledMessage,
    },
    { status: 410 },
  );
}
