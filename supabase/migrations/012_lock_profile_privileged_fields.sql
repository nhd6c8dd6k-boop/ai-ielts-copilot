-- Stripe Phase 0 security hardening:
-- keep ordinary users from updating privileged profile/user columns through the
-- Supabase client while preserving own-row profile edits for safe fields.

revoke update on table public.users from public;
revoke update on table public.users from anon;
revoke update on table public.users from authenticated;

revoke update on table public.profiles from public;
revoke update on table public.profiles from anon;
revoke update on table public.profiles from authenticated;

grant update (
  display_name,
  avatar_url,
  target_band,
  exam_date,
  country,
  timezone
) on table public.profiles to authenticated;

grant all privileges on table public.users to service_role;
grant all privileges on table public.profiles to service_role;
