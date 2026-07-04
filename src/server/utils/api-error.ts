import { NextResponse } from "next/server";

type ApiErrorOptions = {
  fallback: string;
  status?: number;
  context?: string;
};

export function getSafeErrorMessage(error: unknown, fallback: string) {
  if (process.env.NODE_ENV !== "production") {
    return error instanceof Error ? error.message : fallback;
  }

  return fallback;
}

export function apiErrorResponse(error: unknown, options: ApiErrorOptions) {
  if (process.env.NODE_ENV === "production") {
    console.error(options.context ?? "API error", error);
  }

  return NextResponse.json(
    { error: getSafeErrorMessage(error, options.fallback) },
    { status: options.status ?? 400 },
  );
}
