create table if not exists public.writing_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  writing_task_id uuid not null references public.writing_tasks(id) on delete cascade,
  essay text not null,
  word_count int not null default 0,
  overall_band numeric(2, 1) not null,
  task_response numeric(2, 1) not null,
  coherence_cohesion numeric(2, 1) not null,
  lexical_resource numeric(2, 1) not null,
  grammatical_range_accuracy numeric(2, 1) not null,
  feedback_zh text not null,
  feedback_en text not null,
  grammar_issues jsonb not null default '[]'::jsonb,
  vocabulary_upgrades jsonb not null default '[]'::jsonb,
  sentence_improvements jsonb not null default '[]'::jsonb,
  next_steps jsonb not null default '[]'::jsonb,
  sample_answer_band_7 text not null,
  sample_answer_band_8 text not null,
  raw_ai_output jsonb not null default '{}'::jsonb,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  total_tokens int not null default 0,
  estimated_cost numeric(10, 6) not null default 0,
  time_spent_seconds int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.ai_usage_logs
add column if not exists user_id uuid references auth.users(id) on delete set null,
add column if not exists usage_type text not null default 'admin_generate',
add column if not exists target_type text,
add column if not exists target_id uuid;

create index if not exists writing_attempts_user_idx
on public.writing_attempts(user_id, created_at desc);

create index if not exists writing_attempts_task_idx
on public.writing_attempts(writing_task_id, created_at desc);

create index if not exists ai_usage_logs_user_idx
on public.ai_usage_logs(user_id, created_at desc);

alter table public.writing_attempts enable row level security;

drop policy if exists "Users can read own writing attempts" on public.writing_attempts;
create policy "Users can read own writing attempts"
on public.writing_attempts for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own writing attempts" on public.writing_attempts;
create policy "Users can insert own writing attempts"
on public.writing_attempts for insert
with check (auth.uid() = user_id);
