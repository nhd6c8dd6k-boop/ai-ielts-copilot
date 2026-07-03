alter table public.listening_sets
add column if not exists tts_voice_mapping jsonb not null default '{}'::jsonb;
