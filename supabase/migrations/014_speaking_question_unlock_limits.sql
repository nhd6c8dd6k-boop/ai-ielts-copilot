create table if not exists public.speaking_question_unlocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.speaking_questions(id) on delete cascade,
  usage_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, question_id, usage_date)
);

create index if not exists speaking_question_unlocks_user_date_idx
on public.speaking_question_unlocks(user_id, usage_date);

create index if not exists speaking_question_unlocks_question_idx
on public.speaking_question_unlocks(question_id);

alter table public.speaking_question_unlocks enable row level security;

drop policy if exists "Users can read their own speaking unlocks" on public.speaking_question_unlocks;
create policy "Users can read their own speaking unlocks"
on public.speaking_question_unlocks for select
using (auth.uid() = user_id);

revoke insert, update, delete on table public.speaking_question_unlocks from public;
revoke insert, update, delete on table public.speaking_question_unlocks from anon;
revoke insert, update, delete on table public.speaking_question_unlocks from authenticated;
grant select on table public.speaking_question_unlocks to authenticated;
grant all privileges on table public.speaking_question_unlocks to service_role;

drop policy if exists "Published speaking questions are readable" on public.speaking_questions;

create or replace function public.unlock_speaking_question(p_question_id uuid)
returns table (
  allowed boolean,
  already_unlocked boolean,
  used_today integer,
  limit_today integer,
  remaining_today integer,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_usage_date date := (now() at time zone 'utc')::date;
  v_limit integer := 5;
  v_used integer := 0;
  v_question_exists boolean := false;
begin
  if v_user_id is null then
    return query select false, false, 0, v_limit, v_limit, 'unauthenticated'::text;
    return;
  end if;

  select exists (
    select 1
    from public.speaking_questions question
    join public.speaking_topics topic on topic.id = question.topic_id
    where question.id = p_question_id
      and topic.status = 'published'
  ) into v_question_exists;

  if not v_question_exists then
    return query select false, false, 0, v_limit, v_limit, 'not_found'::text;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtext(v_user_id::text), hashtext(v_usage_date::text));

  select count(*)::integer
  into v_used
  from public.speaking_question_unlocks
  where user_id = v_user_id
    and usage_date = v_usage_date;

  if exists (
    select 1
    from public.speaking_question_unlocks
    where user_id = v_user_id
      and question_id = p_question_id
      and usage_date = v_usage_date
  ) then
    return query select true, true, v_used, v_limit, greatest(v_limit - v_used, 0), 'already_unlocked'::text;
    return;
  end if;

  if v_used >= v_limit then
    return query select false, false, v_used, v_limit, 0, 'limit_reached'::text;
    return;
  end if;

  insert into public.speaking_question_unlocks (user_id, question_id, usage_date)
  values (v_user_id, p_question_id, v_usage_date)
  on conflict (user_id, question_id, usage_date) do nothing;

  select count(*)::integer
  into v_used
  from public.speaking_question_unlocks
  where user_id = v_user_id
    and usage_date = v_usage_date;

  return query select true, false, v_used, v_limit, greatest(v_limit - v_used, 0), 'unlocked'::text;
end;
$$;

revoke all on function public.unlock_speaking_question(uuid) from public;
revoke all on function public.unlock_speaking_question(uuid) from anon;
grant execute on function public.unlock_speaking_question(uuid) to authenticated;
