create table if not exists public.writing_feedback_quota_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_id uuid references public.writing_attempts(id) on delete set null,
  request_id uuid not null unique,
  quota_version text not null default 'free_writing_feedback_lifetime_v1',
  status text not null default 'reserved',
  reserved_at timestamptz not null default now(),
  consumed_at timestamptz,
  released_at timestamptz,
  release_reason text,
  created_at timestamptz not null default now(),
  constraint writing_feedback_quota_usage_status_check
    check (status in ('reserved', 'consumed', 'released')),
  constraint writing_feedback_quota_usage_consumed_attempt_check
    check (status <> 'consumed' or attempt_id is not null)
);

create index if not exists writing_feedback_quota_usage_user_version_status_idx
on public.writing_feedback_quota_usage(user_id, quota_version, status);

create unique index if not exists writing_feedback_quota_usage_attempt_unique_idx
on public.writing_feedback_quota_usage(attempt_id)
where attempt_id is not null;

alter table public.writing_feedback_quota_usage enable row level security;

drop policy if exists "Users can read own writing feedback quota usage"
on public.writing_feedback_quota_usage;
create policy "Users can read own writing feedback quota usage"
on public.writing_feedback_quota_usage for select
using (auth.uid() = user_id);

revoke insert, update, delete on table public.writing_feedback_quota_usage from public;
revoke insert, update, delete on table public.writing_feedback_quota_usage from anon;
revoke insert, update, delete on table public.writing_feedback_quota_usage from authenticated;
grant select on table public.writing_feedback_quota_usage to authenticated;
grant all privileges on table public.writing_feedback_quota_usage to service_role;

create or replace function public.reserve_free_writing_feedback_quota(
  p_user_id uuid,
  p_request_id uuid,
  p_limit integer default 3,
  p_quota_version text default 'free_writing_feedback_lifetime_v1'
)
returns table (
  allowed boolean,
  reservation_id uuid,
  used integer,
  limit_total integer,
  remaining integer,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used integer := 0;
  v_reservation_id uuid;
begin
  if p_user_id is null then
    return query select false, null::uuid, 0, p_limit, p_limit, 'unauthenticated'::text;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text), hashtext(p_quota_version));

  update public.writing_feedback_quota_usage
  set status = 'released',
      released_at = now(),
      release_reason = 'stale_reservation'
  where user_id = p_user_id
    and quota_version = p_quota_version
    and status = 'reserved'
    and reserved_at < now() - interval '30 minutes';

  select id
  into v_reservation_id
  from public.writing_feedback_quota_usage
  where request_id = p_request_id
    and user_id = p_user_id
    and quota_version = p_quota_version
    and status = 'reserved'
  limit 1;

  if v_reservation_id is not null then
    select count(*)::integer
    into v_used
    from public.writing_feedback_quota_usage
    where user_id = p_user_id
      and quota_version = p_quota_version
      and status in ('reserved', 'consumed');

    return query select true, v_reservation_id, v_used, p_limit, greatest(p_limit - v_used, 0), 'already_reserved'::text;
    return;
  end if;

  select count(*)::integer
  into v_used
  from public.writing_feedback_quota_usage
  where user_id = p_user_id
    and quota_version = p_quota_version
    and status in ('reserved', 'consumed');

  if v_used >= p_limit then
    return query select false, null::uuid, v_used, p_limit, 0, 'free_lifetime_limit_reached'::text;
    return;
  end if;

  insert into public.writing_feedback_quota_usage (
    user_id,
    request_id,
    quota_version,
    status
  )
  values (
    p_user_id,
    p_request_id,
    p_quota_version,
    'reserved'
  )
  returning id into v_reservation_id;

  v_used := v_used + 1;

  return query select true, v_reservation_id, v_used, p_limit, greatest(p_limit - v_used, 0), 'reserved'::text;
end;
$$;

create or replace function public.consume_free_writing_feedback_quota(
  p_user_id uuid,
  p_reservation_id uuid,
  p_attempt_id uuid,
  p_quota_version text default 'free_writing_feedback_lifetime_v1'
)
returns table (
  consumed boolean,
  used integer,
  remaining integer,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit integer := 3;
  v_used integer := 0;
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text), hashtext(p_quota_version));

  if exists (
    select 1
    from public.writing_feedback_quota_usage
    where user_id = p_user_id
      and attempt_id = p_attempt_id
      and quota_version = p_quota_version
      and status = 'consumed'
  ) then
    select count(*)::integer
    into v_used
    from public.writing_feedback_quota_usage
    where user_id = p_user_id
      and quota_version = p_quota_version
      and status = 'consumed';

    return query select true, v_used, greatest(v_limit - v_used, 0), 'already_consumed'::text;
    return;
  end if;

  update public.writing_feedback_quota_usage
  set status = 'consumed',
      attempt_id = p_attempt_id,
      consumed_at = now()
  where id = p_reservation_id
    and user_id = p_user_id
    and quota_version = p_quota_version
    and status = 'reserved';

  if not found then
    select count(*)::integer
    into v_used
    from public.writing_feedback_quota_usage
    where user_id = p_user_id
      and quota_version = p_quota_version
      and status = 'consumed';

    return query select false, v_used, greatest(v_limit - v_used, 0), 'reservation_not_found'::text;
    return;
  end if;

  select count(*)::integer
  into v_used
  from public.writing_feedback_quota_usage
  where user_id = p_user_id
    and quota_version = p_quota_version
    and status = 'consumed';

  return query select true, v_used, greatest(v_limit - v_used, 0), 'consumed'::text;
end;
$$;

create or replace function public.release_free_writing_feedback_quota(
  p_user_id uuid,
  p_reservation_id uuid,
  p_release_reason text default 'request_failed',
  p_quota_version text default 'free_writing_feedback_lifetime_v1'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform pg_advisory_xact_lock(hashtext(p_user_id::text), hashtext(p_quota_version));

  update public.writing_feedback_quota_usage
  set status = 'released',
      released_at = now(),
      release_reason = coalesce(nullif(p_release_reason, ''), 'request_failed')
  where id = p_reservation_id
    and user_id = p_user_id
    and quota_version = p_quota_version
    and status = 'reserved';
end;
$$;

revoke all on function public.reserve_free_writing_feedback_quota(uuid, uuid, integer, text) from public;
revoke all on function public.reserve_free_writing_feedback_quota(uuid, uuid, integer, text) from anon;
revoke all on function public.reserve_free_writing_feedback_quota(uuid, uuid, integer, text) from authenticated;
grant execute on function public.reserve_free_writing_feedback_quota(uuid, uuid, integer, text) to service_role;

revoke all on function public.consume_free_writing_feedback_quota(uuid, uuid, uuid, text) from public;
revoke all on function public.consume_free_writing_feedback_quota(uuid, uuid, uuid, text) from anon;
revoke all on function public.consume_free_writing_feedback_quota(uuid, uuid, uuid, text) from authenticated;
grant execute on function public.consume_free_writing_feedback_quota(uuid, uuid, uuid, text) to service_role;

revoke all on function public.release_free_writing_feedback_quota(uuid, uuid, text, text) from public;
revoke all on function public.release_free_writing_feedback_quota(uuid, uuid, text, text) from anon;
revoke all on function public.release_free_writing_feedback_quota(uuid, uuid, text, text) from authenticated;
grant execute on function public.release_free_writing_feedback_quota(uuid, uuid, text, text) to service_role;
