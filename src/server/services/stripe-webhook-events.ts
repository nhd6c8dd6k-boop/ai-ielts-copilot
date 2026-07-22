import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const stripeWebhookProcessingStatuses = [
  "received",
  "processing",
  "processed",
  "failed",
  "ignored",
] as const;

export type StripeWebhookProcessingStatus =
  (typeof stripeWebhookProcessingStatuses)[number];

export type StripeWebhookEventRecord = {
  id: string;
  stripeEventId: string;
  eventType: string;
  eventCreated: string;
  livemode: boolean;
  apiVersion: string | null;
  objectId: string | null;
  processingStatus: StripeWebhookProcessingStatus;
  processingAttempts: number;
  lastError: string | null;
  receivedAt: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RegisterStripeWebhookEventInput = {
  stripeEventId: string;
  eventType: string;
  eventCreated: string | Date;
  livemode: boolean;
  apiVersion?: string | null;
  objectId?: string | null;
};

export type RegisterStripeWebhookEventResult =
  | {
      status: "registered";
      event: StripeWebhookEventRecord;
    }
  | {
      status: "duplicate";
      event: StripeWebhookEventRecord;
    };

type StripeWebhookEventRow = {
  id: string;
  stripe_event_id: string;
  event_type: string;
  event_created: string;
  livemode: boolean;
  api_version: string | null;
  object_id: string | null;
  processing_status: string;
  processing_attempts: number;
  last_error: string | null;
  received_at: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
};

const webhookEventColumns = [
  "id",
  "stripe_event_id",
  "event_type",
  "event_created",
  "livemode",
  "api_version",
  "object_id",
  "processing_status",
  "processing_attempts",
  "last_error",
  "received_at",
  "processed_at",
  "created_at",
  "updated_at",
].join(",");

export async function registerStripeWebhookEvent(
  input: RegisterStripeWebhookEventInput,
): Promise<RegisterStripeWebhookEventResult> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("stripe_webhook_events")
    .insert({
      stripe_event_id: input.stripeEventId,
      event_type: input.eventType,
      event_created: toIsoString(input.eventCreated),
      livemode: input.livemode,
      api_version: input.apiVersion ?? null,
      object_id: input.objectId ?? null,
      processing_status: "received",
    })
    .select(webhookEventColumns)
    .single();

  if (!error && data) {
    return {
      status: "registered",
      event: mapStripeWebhookEventRow(data as unknown as StripeWebhookEventRow),
    };
  }

  if (isUniqueViolation(error)) {
    const existing = await getStripeWebhookEventByStripeId(input.stripeEventId);

    if (existing) {
      return {
        status: "duplicate",
        event: existing,
      };
    }
  }

  throw new StripeWebhookEventStoreError("register");
}

export async function getStripeWebhookEventByStripeId(
  stripeEventId: string,
): Promise<StripeWebhookEventRecord | null> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("stripe_webhook_events")
    .select(webhookEventColumns)
    .eq("stripe_event_id", stripeEventId)
    .maybeSingle();

  if (error) {
    throw new StripeWebhookEventStoreError("load");
  }

  return data
    ? mapStripeWebhookEventRow(data as unknown as StripeWebhookEventRow)
    : null;
}

export async function markStripeWebhookEventProcessing(
  stripeEventId: string,
): Promise<StripeWebhookEventRecord> {
  const existing = await getStripeWebhookEventByStripeId(stripeEventId);

  if (!existing) {
    throw new StripeWebhookEventStoreError("mark_processing");
  }

  return updateStripeWebhookEventStatus(stripeEventId, {
    processing_status: "processing",
    processing_attempts: existing.processingAttempts + 1,
    last_error: null,
    processed_at: null,
  });
}

export async function markStripeWebhookEventProcessed(
  stripeEventId: string,
): Promise<StripeWebhookEventRecord> {
  return updateStripeWebhookEventStatus(stripeEventId, {
    processing_status: "processed",
    processed_at: new Date().toISOString(),
    last_error: null,
  });
}

export async function markStripeWebhookEventFailed({
  stripeEventId,
  error,
}: {
  stripeEventId: string;
  error: unknown;
}): Promise<StripeWebhookEventRecord> {
  return updateStripeWebhookEventStatus(stripeEventId, {
    processing_status: "failed",
    last_error: sanitizeWebhookError(error),
  });
}

export async function markStripeWebhookEventIgnored({
  stripeEventId,
  reason,
}: {
  stripeEventId: string;
  reason?: string;
}): Promise<StripeWebhookEventRecord> {
  return updateStripeWebhookEventStatus(stripeEventId, {
    processing_status: "ignored",
    processed_at: new Date().toISOString(),
    last_error: reason ? sanitizeWebhookError(reason) : null,
  });
}

export function stripeEventCreatedToIso(eventCreated: number) {
  return new Date(eventCreated * 1000).toISOString();
}

export function shouldApplyStripeSubscriptionEvent({
  incomingEventCreated,
  lastStripeEventCreated,
}: {
  incomingEventCreated: string | Date;
  lastStripeEventCreated?: string | Date | null;
}) {
  if (!lastStripeEventCreated) {
    return true;
  }

  return (
    new Date(incomingEventCreated).getTime() >=
    new Date(lastStripeEventCreated).getTime()
  );
}

function updateStripeWebhookEventStatus(
  stripeEventId: string,
  update: {
    processing_status: StripeWebhookProcessingStatus;
    processing_attempts?: number;
    last_error?: string | null;
    processed_at?: string | null;
  },
) {
  const admin = createSupabaseAdminClient();

  return admin
    .from("stripe_webhook_events")
    .update(update)
    .eq("stripe_event_id", stripeEventId)
    .select(webhookEventColumns)
    .single()
    .then(({ data, error }) => {
      if (error || !data) {
        throw new StripeWebhookEventStoreError("update_status");
      }

      return mapStripeWebhookEventRow(
        data as unknown as StripeWebhookEventRow,
      );
    });
}

function mapStripeWebhookEventRow(
  row: StripeWebhookEventRow,
): StripeWebhookEventRecord {
  return {
    id: row.id,
    stripeEventId: row.stripe_event_id,
    eventType: row.event_type,
    eventCreated: row.event_created,
    livemode: row.livemode,
    apiVersion: row.api_version,
    objectId: row.object_id,
    processingStatus: parseStripeWebhookProcessingStatus(
      row.processing_status,
    ),
    processingAttempts: row.processing_attempts,
    lastError: row.last_error,
    receivedAt: row.received_at,
    processedAt: row.processed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseStripeWebhookProcessingStatus(
  status: string,
): StripeWebhookProcessingStatus {
  return stripeWebhookProcessingStatuses.includes(
    status as StripeWebhookProcessingStatus,
  )
    ? (status as StripeWebhookProcessingStatus)
    : "failed";
}

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function sanitizeWebhookError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return message.replace(/\s+/g, " ").trim().slice(0, 500);
}

function isUniqueViolation(error: unknown) {
  if (!error || typeof error !== "object" || !("code" in error)) {
    return false;
  }

  return (
    (error as { code?: unknown }).code === "23505"
  );
}

export class StripeWebhookEventStoreError extends Error {
  constructor(operation: string) {
    super(`Stripe webhook event store failed during ${operation}.`);
    this.name = "StripeWebhookEventStoreError";
  }
}
