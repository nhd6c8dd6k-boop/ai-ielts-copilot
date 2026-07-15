alter type public.subscription_plan add value if not exists 'pro';

alter type public.subscription_status add value if not exists 'expired';
alter type public.subscription_status add value if not exists 'cancelled';

alter table public.subscriptions
  add column if not exists started_at timestamptz,
  add column if not exists expires_at timestamptz,
  add column if not exists granted_by uuid references auth.users(id) on delete set null,
  add column if not exists notes text;

create index if not exists subscriptions_expires_at_idx
  on public.subscriptions (expires_at);

notify pgrst, 'reload schema';
