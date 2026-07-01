# AI IELTS Copilot Vercel Deployment Guide

This guide prepares the current MVP for a Vercel Preview deployment.

Current V1 product mode:

- Reading practice uses `published` rows from Supabase.
- Listening practice uses `published` rows from Supabase.
- Writing practice uses `published` rows from Supabase.
- User-side AI generation is disabled in V1.
- Writing AI feedback and Admin Listening TTS require `OPENAI_API_KEY`; without it, both features degrade safely.
- Admin content generation remains available only for admin users.

## 1. Local Preflight

Run these checks before deploying:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

The Vercel build command should be:

```bash
pnpm build
```

The install command can stay as Vercel default, or be set explicitly:

```bash
pnpm install
```

The project is a standard Next.js app and does not require a custom `output` setting.

## 2. Files That Must Not Be Committed

The existing `.gitignore` already excludes:

- `.env*`
- `node_modules`
- `.next`
- `out`
- `build`
- `.vercel`
- `*.pem`
- `*.tsbuildinfo`

Do not commit `.env.local`, `.env.local.save`, service role keys, database passwords, or OpenAI keys.

## 3. Vercel Environment Variables

Add these in Vercel:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
```

Recommended values:

- `NEXT_PUBLIC_SITE_URL`: your Vercel Preview URL first, then your production URL later.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard -> Project Settings -> API -> Project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard -> Project Settings -> API -> anon public key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard -> Project Settings -> API -> service_role key.
- `OPENAI_API_KEY`: optional for preview. Leave empty if you only want Reading, Listening, and Writing practice preview.

Optional payment variables can stay empty until payment testing:

```text
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRO_MONTHLY_PRICE_ID
STRIPE_PRO_YEARLY_PRICE_ID
WECHAT_PAY_MCH_ID
WECHAT_PAY_APP_ID
ALIPAY_APP_ID
```

## 4. Supabase Auth URL Settings

In Supabase Dashboard -> Authentication -> URL Configuration:

Set Site URL:

```text
https://your-vercel-production-url.vercel.app
```

Add Redirect URLs:

```text
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
https://your-vercel-preview-url.vercel.app/auth/callback
https://your-vercel-production-url.vercel.app/auth/callback
```

For Vercel preview deployments, add the actual preview URL after the first deploy.

If you later connect a custom domain, add:

```text
https://your-domain.com/auth/callback
```

The app uses `NEXT_PUBLIC_SITE_URL` for auth redirects and checkout redirects, so keep this value aligned with the environment you are testing.

## 5. Supabase Database

The production Supabase database must have migrations `001`, `002`, `003`, and `004` applied.

Current required tables include:

- `profiles`
- `users`
- `subscriptions`
- `reading_sets`
- `listening_sets`
- `writing_tasks`
- `generated_questions`
- `generated_answers`
- `practice_history`
- `user_answers`
- `writing_attempts`
- `admin_logs`
- `ai_usage_logs`

For preview testing, make sure there is at least one `published` row for:

- `reading_sets`
- `listening_sets`
- `writing_tasks`

Seed files currently used for local/manual test content:

- `supabase/seed_test_content.sql`
- `supabase/seed_writing_test_task.sql`

These seed files are safe to keep, but do not run destructive database commands in production.

## 6. Supabase Storage

Admin Listening TTS uploads MP3 files to Supabase Storage.

Bucket:

```text
listening-audio
```

Path format:

```text
listening/{listening_set_id}.mp3
```

The Admin TTS API will try to create the bucket automatically if it does not exist.

If automatic creation fails, create it manually:

- Bucket name: `listening-audio`
- Public bucket: enabled
- MIME type: `audio/mpeg`

The app stores only the file URL in `listening_sets.audio_url`; audio files are not stored in the database.

## 7. Security Checklist

Confirmed by code inspection:

- `SUPABASE_SERVICE_ROLE_KEY` is used only through server-side Supabase admin helpers.
- `OPENAI_API_KEY` is used only by server-side API/services.
- `/api/admin/*` routes call `requireAdminUser()`.
- Admin access requires `profiles.role = 'admin'`.
- User-side AI generation endpoints are disabled for V1.
- Writing AI feedback returns a friendly disabled message if `OPENAI_API_KEY` is not configured.
- Listening TTS returns a friendly disabled message if `OPENAI_API_KEY` is not configured.
- No secrets should be printed in logs or committed to source control.

Important:

- Never expose `SUPABASE_SERVICE_ROLE_KEY` as a `NEXT_PUBLIC_*` variable.
- Do not paste service role keys into client-side code.
- Do not commit `.env.local` or `.env.local.save`.

## 8. Vercel Deployment Steps

1. Put the project into a GitHub repository.
2. Import the repository in Vercel.
3. Framework preset: Next.js.
4. Install command: `pnpm install`.
5. Build command: `pnpm build`.
6. Add environment variables listed above.
7. Deploy.
8. Copy the Vercel Preview URL.
9. Add the Preview URL callback to Supabase Auth Redirect URLs.
10. Update Vercel `NEXT_PUBLIC_SITE_URL` to the Preview URL for that environment.
11. Redeploy after environment variable changes.

If the folder is not yet a Git repository, initialize Git and push to GitHub before using Vercel's Git integration.

## 9. Post-Deploy Test Checklist

Open the Vercel Preview URL and test:

- `/` loads without local-only errors.
- `/register` creates a Supabase Auth user.
- `/login` signs in.
- `/dashboard` loads real user data.
- `/practice` shows real published counts.
- `/practice/reading` shows only published Reading sets.
- `/practice/reading/[id]` submits and opens `/result/reading/[attemptId]`.
- `/practice/listening` shows only published Listening sets.
- `/practice/listening/[id]` plays audio if `audio_status = ready`; otherwise script preview works.
- `/result/listening/[attemptId]` shows scoring details.
- `/practice/writing` shows only published Writing tasks.
- `/practice/writing/[id]` allows writing and draft saving.
- Writing AI feedback shows a friendly coming soon message when `OPENAI_API_KEY` is missing.
- `/admin` is blocked for normal users.
- `/admin` works only after the user's `profiles.role` is set to `admin`.
- Admin Publish / Archive / Delete still works.
- Admin Listening Generate Audio returns a friendly TTS unavailable message if `OPENAI_API_KEY` is missing.

## 10. Common Issues

### Auth redirects to localhost

Check:

- Vercel `NEXT_PUBLIC_SITE_URL`
- Supabase Site URL
- Supabase Redirect URLs

After changing Vercel environment variables, redeploy.

### Published content does not appear

Check the row status:

```sql
select id, title, status from public.reading_sets;
select id, title, status, audio_status from public.listening_sets;
select id, topic, status from public.writing_tasks;
```

Only `status = 'published'` appears on user practice pages.

### Admin page says forbidden

Set your own registered account as admin:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'your-email@example.com'
);

update public.users
set role = 'admin'
where id = (
  select id
  from auth.users
  where email = 'your-email@example.com'
);
```

Then sign out and sign in again.

### Writing AI feedback is unavailable

This is expected if `OPENAI_API_KEY` is empty. Add the key in Vercel and redeploy when ready.

### Listening audio generation is unavailable

This is expected if `OPENAI_API_KEY` is empty. Add the key in Vercel and redeploy when ready.

If the key exists but upload fails, manually create the `listening-audio` bucket.

### Stripe checkout is unavailable

Payment variables are optional for this preview. Configure Stripe later when testing subscriptions.

## 11. Compliance Reminder

The product must continue to follow these rules:

- Do not copy Cambridge IELTS content.
- Do not upload pirated PDFs.
- Do not use exam recalls.
- Do not copy official answers.
- AI-generated content must be original.
- Any AI score must be labeled as an estimate and not an official IELTS score.
