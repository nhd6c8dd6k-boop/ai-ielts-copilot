# AI IELTS Copilot

AI IELTS Copilot is an AI native IELTS preparation SaaS MVP. The product is
designed around original AI generated practice, estimated AI feedback, Computer
IELTS simulation, and adaptive learning.

## MVP scope

- Next.js App Router with TypeScript and Tailwind CSS
- shadcn style UI primitives
- Chinese first product UI for Chinese IELTS learners
- English IELTS practice content with Chinese explanations
- Reading, Listening, Writing and Computer IELTS style exam flows
- Dashboard, result review, profile and admin MVP pages
- Supabase Auth, profile and practice history integration
- OpenAI generation boundaries with demo fallbacks
- RMB pricing with Stripe / Apple Pay / WeChat / Alipay entry points
- Initial Supabase schema with RLS and audit focused tables

## Local setup

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app can render without configured API keys. Supabase, OpenAI, and Stripe
actions require environment variables before they are called.

Useful checks:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_initial_schema.sql` in the SQL editor or via the Supabase CLI.
3. Add these values to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Set the auth redirect URLs to:

```text
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

When Supabase is not configured, auth and profile APIs return demo-safe responses
so the local MVP remains usable.

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full launch checklist:

- Supabase Auth and database setup
- OpenAI configuration
- Stripe / Apple Pay setup
- WeChat Pay and Alipay readiness notes
- Vercel deployment
- Commercial launch blockers

## Compliance stance

The platform must not copy Cambridge IELTS content, official answers, exam
recalls, protected PDFs, or real test questions. Generated content should be
original and should imitate IELTS difficulty, structure, and reasoning patterns
without copying source material.
