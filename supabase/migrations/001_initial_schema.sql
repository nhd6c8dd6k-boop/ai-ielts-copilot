create extension if not exists "pgcrypto";

create type public.user_role as enum ('student', 'admin');
create type public.subscription_plan as enum ('free', 'pro_monthly', 'pro_yearly');
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete'
);
create type public.content_status as enum ('draft', 'review', 'published', 'archived');
create type public.skill_type as enum ('reading', 'listening', 'writing', 'speaking');
create type public.content_source_type as enum (
  'ai_generated',
  'admin_original',
  'user_private_upload',
  'official_public_link'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'student',
  status text not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'student',
  display_name text,
  avatar_url text,
  target_band numeric(2, 1),
  exam_date date,
  country text,
  timezone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'incomplete',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reading_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  topic text not null,
  band int not null check (band between 5 and 9),
  length_words int not null check (length_words in (600, 800, 1000)),
  passage text not null,
  source_type public.content_source_type not null default 'ai_generated',
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.listening_sets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  section int not null check (section between 1 and 4),
  topic text not null,
  band int check (band between 5 and 9),
  script text not null,
  audio_url text,
  audio_status text not null default 'pending',
  voice text,
  duration_seconds int,
  source_type public.content_source_type not null default 'ai_generated',
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.writing_tasks (
  id uuid primary key default gen_random_uuid(),
  task_type int not null check (task_type in (1, 2)),
  topic text not null,
  prompt text not null,
  band_target int check (band_target between 5 and 9),
  sample_answer_band_7 text,
  sample_answer_band_8 text,
  sample_answer_band_9 text,
  scoring_notes jsonb not null default '[]'::jsonb,
  source_type public.content_source_type not null default 'ai_generated',
  status public.content_status not null default 'draft',
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.generated_questions (
  id uuid primary key default gen_random_uuid(),
  set_type public.skill_type not null,
  set_id uuid not null,
  question_type text not null,
  question_number int not null,
  prompt text not null,
  options jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.generated_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.generated_questions(id) on delete cascade,
  correct_answer text not null,
  explanation_zh text,
  explanation_en text,
  synonyms jsonb not null default '[]'::jsonb,
  vocabulary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table public.practice_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill public.skill_type not null,
  content_type text,
  content_id uuid,
  set_type text not null,
  set_id uuid,
  title text,
  score_label text,
  score numeric(5, 2),
  band_estimate numeric(2, 1),
  accuracy numeric(5, 2),
  total_questions int not null default 0,
  correct_count int not null default 0,
  detail text,
  weak_areas text[] not null default '{}',
  next_action text,
  time_spent_seconds int not null default 0,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  submitted_at timestamptz not null default now()
);

create table public.user_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.practice_history(id) on delete cascade,
  question_id uuid not null references public.generated_questions(id) on delete cascade,
  user_answer text not null default '',
  correct_answer text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.ai_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid,
  feedback_type text not null,
  band_overall numeric(2, 1),
  criteria_scores jsonb not null default '{}'::jsonb,
  feedback_zh text,
  feedback_en text,
  raw_ai_output jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.writing_attempts (
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

create table public.wrong_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references public.generated_questions(id) on delete cascade,
  user_answer text,
  correct_answer text,
  error_type text,
  review_status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,
  target_id uuid not null,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  provider text not null default 'stripe',
  stripe_invoice_id text unique,
  stripe_subscription_id text,
  stripe_payment_intent_id text unique,
  amount int not null,
  currency text not null default 'usd',
  status text not null,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.prompt_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  version int not null,
  skill public.skill_type not null,
  template text not null,
  schema jsonb not null default '{}'::jsonb,
  active boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name, version)
);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  skill public.skill_type not null,
  feature text,
  model text not null,
  prompt_version int,
  input_tokens int,
  output_tokens int,
  cost_estimate numeric(10, 4),
  latency_ms int,
  status text not null,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  usage_type text not null default 'admin_generate',
  content_type text not null,
  target_type text,
  target_id uuid,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  total_tokens int not null default 0,
  estimated_cost numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create table public.learning_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  skill public.skill_type not null,
  weakness_type text not null,
  confidence numeric(4, 3) not null default 0,
  recommended_action text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill, weakness_type)
);

create table public.admin_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles(role);
create index users_role_status_idx on public.users(role, status);
create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_status_idx on public.subscriptions(status);
create index reading_sets_status_topic_idx on public.reading_sets(status, topic);
create index listening_sets_status_section_idx on public.listening_sets(status, section);
create index writing_tasks_status_task_type_idx on public.writing_tasks(status, task_type);
create index generated_questions_set_idx on public.generated_questions(set_type, set_id);
create index practice_history_user_skill_idx on public.practice_history(user_id, skill, submitted_at desc);
create index practice_history_user_content_idx on public.practice_history(user_id, content_type, created_at desc);
create index user_answers_attempt_idx on public.user_answers(attempt_id, question_id);
create index ai_feedback_user_idx on public.ai_feedback(user_id, created_at desc);
create index writing_attempts_user_idx on public.writing_attempts(user_id, created_at desc);
create index writing_attempts_task_idx on public.writing_attempts(writing_task_id, created_at desc);
create index wrong_questions_user_idx on public.wrong_questions(user_id, review_status);
create index bookmarks_user_idx on public.bookmarks(user_id, target_type);
create index ai_generation_logs_user_idx on public.ai_generation_logs(user_id, created_at desc);
create index ai_generation_logs_user_feature_idx on public.ai_generation_logs(user_id, feature, created_at desc);
create index ai_usage_logs_admin_idx on public.ai_usage_logs(admin_user_id, created_at desc);
create index ai_usage_logs_user_idx on public.ai_usage_logs(user_id, created_at desc);

create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row execute function public.set_updated_at();

create trigger set_reading_sets_updated_at
before update on public.reading_sets
for each row execute function public.set_updated_at();

create trigger set_listening_sets_updated_at
before update on public.listening_sets
for each row execute function public.set_updated_at();

create trigger set_writing_tasks_updated_at
before update on public.writing_tasks
for each row execute function public.set_updated_at();

create trigger set_wrong_questions_updated_at
before update on public.wrong_questions
for each row execute function public.set_updated_at();

create trigger set_prompt_templates_updated_at
before update on public.prompt_templates
for each row execute function public.set_updated_at();

create trigger set_learning_insights_updated_at
before update on public.learning_insights
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;

  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name')
  on conflict (id) do nothing;

  insert into public.subscriptions (user_id, plan, status)
  values (new.id, 'free', 'active')
  on conflict do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.reading_sets enable row level security;
alter table public.listening_sets enable row level security;
alter table public.writing_tasks enable row level security;
alter table public.generated_questions enable row level security;
alter table public.generated_answers enable row level security;
alter table public.practice_history enable row level security;
alter table public.user_answers enable row level security;
alter table public.ai_feedback enable row level security;
alter table public.writing_attempts enable row level security;
alter table public.wrong_questions enable row level security;
alter table public.bookmarks enable row level security;
alter table public.payments enable row level security;
alter table public.prompt_templates enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.ai_usage_logs enable row level security;
alter table public.learning_insights enable row level security;
alter table public.admin_logs enable row level security;

create policy "Users can read own user record"
on public.users for select
using (auth.uid() = id);

create policy "Users can update own user record"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read own profile"
on public.profiles for select
using (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Users can read own subscriptions"
on public.subscriptions for select
using (auth.uid() = user_id);

create policy "Published reading sets are readable"
on public.reading_sets for select
using (status = 'published' or auth.uid() = created_by);

create policy "Published listening sets are readable"
on public.listening_sets for select
using (status = 'published' or auth.uid() = created_by);

create policy "Published writing tasks are readable"
on public.writing_tasks for select
using (status = 'published' or auth.uid() = created_by);

create policy "Users can read own practice history"
on public.practice_history for select
using (auth.uid() = user_id);

create policy "Users can insert own practice history"
on public.practice_history for insert
with check (auth.uid() = user_id);

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

create policy "Users can read own feedback"
on public.ai_feedback for select
using (auth.uid() = user_id);

create policy "Users can read own writing attempts"
on public.writing_attempts for select
using (auth.uid() = user_id);

create policy "Users can insert own writing attempts"
on public.writing_attempts for insert
with check (auth.uid() = user_id);

create policy "Users can manage own wrong questions"
on public.wrong_questions for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can manage own bookmarks"
on public.bookmarks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read own payments"
on public.payments for select
using (auth.uid() = user_id);

create policy "Users can read own insights"
on public.learning_insights for select
using (auth.uid() = user_id);
