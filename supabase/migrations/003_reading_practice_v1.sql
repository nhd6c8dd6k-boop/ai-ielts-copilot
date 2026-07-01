alter table public.practice_history
add column if not exists content_type text,
add column if not exists content_id uuid,
add column if not exists total_questions int not null default 0,
add column if not exists correct_count int not null default 0,
add column if not exists created_at timestamptz not null default now();

update public.practice_history
set
  content_type = coalesce(content_type, skill::text),
  content_id = coalesce(content_id, set_id),
  created_at = coalesce(created_at, submitted_at)
where content_type is null or content_id is null;

create table if not exists public.user_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.practice_history(id) on delete cascade,
  question_id uuid not null references public.generated_questions(id) on delete cascade,
  user_answer text not null default '',
  correct_answer text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists practice_history_user_content_idx
on public.practice_history(user_id, content_type, created_at desc);

create index if not exists user_answers_attempt_idx
on public.user_answers(attempt_id, question_id);

alter table public.user_answers enable row level security;

drop policy if exists "Users can read own answers" on public.user_answers;
create policy "Users can read own answers"
on public.user_answers for select
using (
  exists (
    select 1
    from public.practice_history
    where public.practice_history.id = public.user_answers.attempt_id
      and public.practice_history.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert own answers" on public.user_answers;
create policy "Users can insert own answers"
on public.user_answers for insert
with check (
  exists (
    select 1
    from public.practice_history
    where public.practice_history.id = public.user_answers.attempt_id
      and public.practice_history.user_id = auth.uid()
  )
);
