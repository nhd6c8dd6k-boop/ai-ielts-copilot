-- Stripe Phase 1 foundation:
-- add subscription synchronization fields and webhook event idempotency storage.
-- This migration does not change current membership state or subscription logic.

alter table public.subscriptions
  add column if not exists stripe_price_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists cancel_at timestamptz,
  add column if not exists canceled_at timestamptz,
  add column if not exists ended_at timestamptz,
  add column if not exists latest_invoice_id text,
  add column if not exists last_stripe_event_id text,
  add column if not exists last_stripe_event_created timestamptz;

create index if not exists subscriptions_stripe_price_id_idx
  on public.subscriptions (stripe_price_id)
  where stripe_price_id is not null;

create index if not exists subscriptions_last_stripe_event_created_idx
  on public.subscriptions (last_stripe_event_created)
  where last_stripe_event_created is not null;

create index if not exists subscriptions_latest_invoice_id_idx
  on public.subscriptions (latest_invoice_id)
  where latest_invoice_id is not null;

revoke insert, update, delete on table public.subscriptions from public;
revoke insert, update, delete on table public.subscriptions from anon;
revoke insert, update, delete on table public.subscriptions from authenticated;
grant select on table public.subscriptions to authenticated;
grant all privileges on table public.subscriptions to service_role;

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  stripe_event_id text not null unique,
  event_type text not null,
  event_created timestamptz not null,
  livemode boolean not null,
  api_version text,
  object_id text,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processing', 'processed', 'failed', 'ignored')),
  processing_attempts integer not null default 0
    check (processing_attempts >= 0),
  last_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists stripe_webhook_events_processing_status_idx
  on public.stripe_webhook_events (processing_status);

create index if not exists stripe_webhook_events_event_created_idx
  on public.stripe_webhook_events (event_created);

create index if not exists stripe_webhook_events_received_at_idx
  on public.stripe_webhook_events (received_at);

create index if not exists stripe_webhook_events_object_id_idx
  on public.stripe_webhook_events (object_id)
  where object_id is not null;

alter table public.stripe_webhook_events enable row level security;

revoke all on table public.stripe_webhook_events from public;
revoke all on table public.stripe_webhook_events from anon;
revoke all on table public.stripe_webhook_events from authenticated;
grant all privileges on table public.stripe_webhook_events to service_role;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'set_stripe_webhook_events_updated_at'
  ) then
    create trigger set_stripe_webhook_events_updated_at
    before update on public.stripe_webhook_events
    for each row execute function public.set_updated_at();
  end if;
end;
$$;
