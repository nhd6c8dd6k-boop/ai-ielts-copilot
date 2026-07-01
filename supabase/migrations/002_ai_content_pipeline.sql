alter table public.writing_tasks
add column if not exists sample_answer_band_7 text,
add column if not exists sample_answer_band_8 text,
add column if not exists sample_answer_band_9 text,
add column if not exists scoring_notes jsonb not null default '[]'::jsonb;

alter table public.listening_sets
add column if not exists audio_status text not null default 'pending';

create table if not exists public.ai_usage_logs (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  content_type text not null,
  model text not null,
  input_tokens int not null default 0,
  output_tokens int not null default 0,
  total_tokens int not null default 0,
  estimated_cost numeric(10, 6) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_logs_admin_idx
on public.ai_usage_logs(admin_user_id, created_at desc);

alter table public.ai_usage_logs enable row level security;
