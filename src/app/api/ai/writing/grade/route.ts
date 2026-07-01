import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Generic Writing grading is disabled in V1. Please submit a published Writing task through /practice/writing.",
    },
    { status: 410 },
  );
}
