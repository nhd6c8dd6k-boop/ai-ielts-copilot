create table if not exists public.accountability_beta_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waitlisted',
  target_band text not null,
  exam_date date,
  exam_date_unknown boolean not null default false,
  weakest_skill text not null,
  daily_minutes integer not null,
  reminder_preference text not null,
  started_at timestamptz,
  completed_at timestamptz,
  current_day integer not null default 1,
  feedback_rating integer,
  feedback_text text,
  feedback_difficulty text,
  feedback_willingness text,
  reminder_sent_at timestamptz,
  reminder_channel text,
  reminder_sent_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accountability_beta_enrollments_status_check
    check (status in ('waitlisted', 'active', 'completed', 'withdrawn')),
  constraint accountability_beta_target_band_check
    check (target_band in ('6.0', '6.5', '7.0', '7.5', '8.0+')),
  constraint accountability_beta_weakest_skill_check
    check (weakest_skill in ('writing', 'reading', 'listening', 'speaking', 'not_sure')),
  constraint accountability_beta_daily_minutes_check
    check (daily_minutes in (15, 30, 45, 60)),
  constraint accountability_beta_reminder_preference_check
    check (reminder_preference in ('crisp', 'email', 'none')),
  constraint accountability_beta_feedback_rating_check
    check (feedback_rating is null or feedback_rating between 1 and 5),
  constraint accountability_beta_feedback_willingness_check
    check (feedback_willingness is null or feedback_willingness in ('yes', 'maybe', 'no')),
  constraint accountability_beta_exam_date_check
    check (
      (exam_date_unknown = true and exam_date is null)
      or
      (exam_date_unknown = false)
    )
);

create table if not exists public.accountability_beta_tasks (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.accountability_beta_enrollments(id) on delete cascade,
  day_number integer not null,
  skill text not null,
  task_type text not null,
  title text not null,
  description text not null,
  estimated_minutes integer not null,
  target_path text not null,
  source_content_id uuid,
  completion_mode text not null default 'manual',
  completed_at timestamptz,
  linked_attempt_id uuid references public.practice_history(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accountability_beta_tasks_day_check
    check (day_number between 1 and 7),
  constraint accountability_beta_tasks_skill_check
    check (skill in ('writing', 'reading', 'listening', 'speaking', 'review')),
  constraint accountability_beta_tasks_completion_mode_check
    check (completion_mode in ('manual', 'attempt')),
  constraint accountability_beta_tasks_estimated_minutes_check
    check (estimated_minutes > 0 and estimated_minutes <= 90),
  constraint accountability_beta_tasks_target_path_check
    check (
      target_path like '/practice/%'
      or target_path = '/practice'
      or target_path = '/accountability-beta'
    )
);

create unique index if not exists accountability_beta_one_open_enrollment_idx
on public.accountability_beta_enrollments(user_id)
where status in ('active', 'waitlisted');

create index if not exists accountability_beta_enrollments_status_idx
on public.accountability_beta_enrollments(status, created_at);

create unique index if not exists accountability_beta_tasks_enrollment_day_idx
on public.accountability_beta_tasks(enrollment_id, day_number);

create index if not exists accountability_beta_tasks_attempt_idx
on public.accountability_beta_tasks(linked_attempt_id)
where linked_attempt_id is not null;

alter table public.accountability_beta_enrollments enable row level security;
alter table public.accountability_beta_tasks enable row level security;

drop policy if exists "Users can read own accountability beta enrollment"
on public.accountability_beta_enrollments;
create policy "Users can read own accountability beta enrollment"
on public.accountability_beta_enrollments for select
using (auth.uid() = user_id);

drop policy if exists "Users can read own accountability beta tasks"
on public.accountability_beta_tasks;
create policy "Users can read own accountability beta tasks"
on public.accountability_beta_tasks for select
using (
  exists (
    select 1
    from public.accountability_beta_enrollments enrollment
    where enrollment.id = accountability_beta_tasks.enrollment_id
      and enrollment.user_id = auth.uid()
  )
);

revoke insert, update, delete on table public.accountability_beta_enrollments from public;
revoke insert, update, delete on table public.accountability_beta_enrollments from anon;
revoke insert, update, delete on table public.accountability_beta_enrollments from authenticated;
revoke insert, update, delete on table public.accountability_beta_tasks from public;
revoke insert, update, delete on table public.accountability_beta_tasks from anon;
revoke insert, update, delete on table public.accountability_beta_tasks from authenticated;
grant select on table public.accountability_beta_enrollments to authenticated;
grant select on table public.accountability_beta_tasks to authenticated;
grant all privileges on table public.accountability_beta_enrollments to service_role;
grant all privileges on table public.accountability_beta_tasks to service_role;

create or replace function public.join_accountability_beta(
  p_user_id uuid,
  p_target_band text,
  p_exam_date date,
  p_exam_date_unknown boolean,
  p_weakest_skill text,
  p_daily_minutes integer,
  p_reminder_preference text,
  p_tasks jsonb,
  p_active_limit integer default 10
)
returns table (
  enrollment_id uuid,
  enrollment_status text,
  active_count integer,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.accountability_beta_enrollments%rowtype;
  v_status text;
  v_enrollment_id uuid;
  v_active_count integer;
begin
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  perform pg_advisory_xact_lock(hashtext('accountability_beta_active_capacity'));

  select *
  into v_existing
  from public.accountability_beta_enrollments
  where user_id = p_user_id
    and status in ('active', 'waitlisted')
  order by created_at desc
  limit 1;

  if v_existing.id is not null then
    select count(*)::integer
    into v_active_count
    from public.accountability_beta_enrollments
    where status = 'active';

    return query select v_existing.id, v_existing.status, v_active_count, 'existing_enrollment'::text;
    return;
  end if;

  select count(*)::integer
  into v_active_count
  from public.accountability_beta_enrollments
  where status = 'active';

  v_status := case when v_active_count < p_active_limit then 'active' else 'waitlisted' end;

  insert into public.accountability_beta_enrollments (
    user_id,
    status,
    target_band,
    exam_date,
    exam_date_unknown,
    weakest_skill,
    daily_minutes,
    reminder_preference,
    started_at,
    current_day
  )
  values (
    p_user_id,
    v_status,
    p_target_band,
    case when p_exam_date_unknown then null else p_exam_date end,
    p_exam_date_unknown,
    p_weakest_skill,
    p_daily_minutes,
    p_reminder_preference,
    case when v_status = 'active' then now() else null end,
    1
  )
  returning id into v_enrollment_id;

  if v_status = 'active' then
    if jsonb_array_length(p_tasks) <> 7 then
      raise exception 'active enrollment requires exactly seven tasks';
    end if;

    insert into public.accountability_beta_tasks (
      enrollment_id,
      day_number,
      skill,
      task_type,
      title,
      description,
      estimated_minutes,
      target_path,
      source_content_id,
      completion_mode
    )
    select
      v_enrollment_id,
      task.day_number,
      task.skill,
      task.task_type,
      task.title,
      task.description,
      task.estimated_minutes,
      task.target_path,
      task.source_content_id,
      task.completion_mode
    from jsonb_to_recordset(p_tasks) as task(
      day_number integer,
      skill text,
      task_type text,
      title text,
      description text,
      estimated_minutes integer,
      target_path text,
      source_content_id uuid,
      completion_mode text
    );

    v_active_count := v_active_count + 1;
  end if;

  return query select v_enrollment_id, v_status, v_active_count, v_status;
end;
$$;

revoke all on function public.join_accountability_beta(uuid, text, date, boolean, text, integer, text, jsonb, integer) from public;
revoke all on function public.join_accountability_beta(uuid, text, date, boolean, text, integer, text, jsonb, integer) from anon;
revoke all on function public.join_accountability_beta(uuid, text, date, boolean, text, integer, text, jsonb, integer) from authenticated;
grant execute on function public.join_accountability_beta(uuid, text, date, boolean, text, integer, text, jsonb, integer) to service_role;

create or replace function public.activate_accountability_beta_waitlisted(
  p_enrollment_id uuid,
  p_tasks jsonb,
  p_active_limit integer default 10
)
returns table (
  enrollment_id uuid,
  enrollment_status text,
  active_count integer,
  reason text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing public.accountability_beta_enrollments%rowtype;
  v_active_count integer;
begin
  if p_enrollment_id is null then
    raise exception 'p_enrollment_id is required';
  end if;

  if jsonb_array_length(p_tasks) <> 7 then
    raise exception 'active enrollment requires exactly seven tasks';
  end if;

  perform pg_advisory_xact_lock(hashtext('accountability_beta_active_capacity'));

  select *
  into v_existing
  from public.accountability_beta_enrollments
  where id = p_enrollment_id
  for update;

  if v_existing.id is null or v_existing.status <> 'waitlisted' then
    return query select p_enrollment_id, coalesce(v_existing.status, 'missing'::text), 0, 'not_waitlisted'::text;
    return;
  end if;

  select count(*)::integer
  into v_active_count
  from public.accountability_beta_enrollments
  where status = 'active';

  if v_active_count >= p_active_limit then
    return query select p_enrollment_id, v_existing.status, v_active_count, 'full'::text;
    return;
  end if;

  update public.accountability_beta_enrollments
  set
    status = 'active',
    started_at = now(),
    updated_at = now(),
    current_day = 1
  where id = p_enrollment_id
    and status = 'waitlisted';

  insert into public.accountability_beta_tasks (
    enrollment_id,
    day_number,
    skill,
    task_type,
    title,
    description,
    estimated_minutes,
    target_path,
    source_content_id,
    completion_mode
  )
  select
    p_enrollment_id,
    task.day_number,
    task.skill,
    task.task_type,
    task.title,
    task.description,
    task.estimated_minutes,
    task.target_path,
    task.source_content_id,
    task.completion_mode
  from jsonb_to_recordset(p_tasks) as task(
    day_number integer,
    skill text,
    task_type text,
    title text,
    description text,
    estimated_minutes integer,
    target_path text,
    source_content_id uuid,
    completion_mode text
  )
  on conflict (enrollment_id, day_number) do update
  set
    skill = excluded.skill,
    task_type = excluded.task_type,
    title = excluded.title,
    description = excluded.description,
    estimated_minutes = excluded.estimated_minutes,
    target_path = excluded.target_path,
    source_content_id = excluded.source_content_id,
    completion_mode = excluded.completion_mode;

  return query select p_enrollment_id, 'active'::text, v_active_count + 1, 'activated'::text;
end;
$$;

revoke all on function public.activate_accountability_beta_waitlisted(uuid, jsonb, integer) from public;
revoke all on function public.activate_accountability_beta_waitlisted(uuid, jsonb, integer) from anon;
revoke all on function public.activate_accountability_beta_waitlisted(uuid, jsonb, integer) from authenticated;
grant execute on function public.activate_accountability_beta_waitlisted(uuid, jsonb, integer) to service_role;
