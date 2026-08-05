import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const migration = readFileSync(
  "supabase/migrations/017_accountability_beta.sql",
  "utf8",
);
const service = readFileSync("src/server/services/accountability-beta.ts", "utf8");
const userApi = readFileSync("src/app/api/accountability-beta/route.ts", "utf8");
const adminApi = readFileSync(
  "src/app/api/admin/accountability-beta/route.ts",
  "utf8",
);
const dashboard = readFileSync("src/app/dashboard/page.tsx", "utf8");
const adminConsole = readFileSync("src/app/admin/admin-console.tsx", "utf8");
const page = readFileSync(
  "src/app/accountability-beta/accountability-beta-client.tsx",
  "utf8",
);
const messages = readFileSync("src/lib/i18n/messages.ts", "utf8");
const readingSubmit = readFileSync(
  "src/app/api/practice/reading/submit/route.ts",
  "utf8",
);
const listeningSubmit = readFileSync(
  "src/app/api/practice/listening/submit/route.ts",
  "utf8",
);
const writingService = readFileSync(
  "src/server/services/writing-practice.ts",
  "utf8",
);
const packageJson = JSON.parse(readFileSync("package.json", "utf8"));

assert.match(migration, /create table if not exists public\.accountability_beta_enrollments/);
assert.match(migration, /create table if not exists public\.accountability_beta_tasks/);
assert.match(migration, /status in \('waitlisted', 'active', 'completed', 'withdrawn'\)/);
assert.match(migration, /where status in \('active', 'waitlisted'\)/);
assert.match(migration, /enable row level security/);
assert.match(migration, /pg_advisory_xact_lock\(hashtext\('accountability_beta_active_capacity'\)\)/);
assert.match(migration, /jsonb_array_length\(p_tasks\) <> 7/);
assert.match(migration, /grant execute on function public\.join_accountability_beta/);
assert.match(migration, /activate_accountability_beta_waitlisted/);
assert.match(migration, /grant execute on function public\.activate_accountability_beta_waitlisted/);

assert.match(service, /const defaultTimezone = "UTC"/);
assert.match(service, /getUnlockedDay\(startedAt: string \| null\)/);
assert.match(service, /return process\.env\.NODE_ENV !== "production"/);
assert.match(service, /z\.enum\(\["6\.0", "6\.5", "7\.0", "7\.5", "8\.0\+"\]\)/);
assert.match(service, /z\.literal\(15\)/);
assert.match(service, /z\.literal\(30\)/);
assert.match(service, /z\.literal\(45\)/);
assert.match(service, /z\.literal\(60\)/);
assert.match(service, /examDateUnknown \|\| Boolean\(input\.examDate\)/);
assert.match(service, /buildWritingPlan/);
assert.match(service, /buildReadingPlan/);
assert.match(service, /buildListeningPlan/);
assert.match(service, /buildSpeakingPlan/);
assert.match(service, /buildBalancedPlan/);
assert.match(service, /attemptTask\(1/);
assert.match(service, /manualTask\(7/);
assert.doesNotMatch(service, /Full Mock/i);
assert.doesNotMatch(service, /pronunciation feedback|examiner simulation|AI Speaking|Record yourself/i);

assert.match(service, /\.eq\("status", "published"\)/);
assert.match(service, /\.eq\("audio_status", "ready"\)/);
assert.match(service, /\.not\("audio_url", "is", null\)/);
assert.match(service, /join_accountability_beta/);
assert.match(service, /activate_accountability_beta_waitlisted/);
assert.doesNotMatch(service, /openai/i);
assert.doesNotMatch(service, /crisp-sdk-web|resend/);

assert.match(userApi, /createSupabaseServerClient/);
assert.match(userApi, /status: 401/);
assert.match(userApi, /accountabilityJoinSchema/);
assert.match(userApi, /completeAccountabilityTask/);
assert.match(adminApi, /requireAdminUser/);
assert.match(adminApi, /activate_waitlisted/);
assert.match(adminApi, /mark_reminder_sent/);

assert.match(dashboard, /DashboardAccountabilityCard/);
assert.match(page, /JoinForm/);
assert.match(page, /FeedbackCard/);
assert.match(page, /\/login\?redirect=\/accountability-beta/);
assert.match(adminConsole, /AccountabilityBetaAdminPanel/);
assert.match(adminConsole, /Copy reminder/);
assert.match(adminConsole, /Mark sent/);

assert.match(messages, /accountability\.title/);
assert.match(messages, /7-Day IELTS Accountability Beta/);
assert.match(messages, /7 天 IELTS 学习督促 Beta/);

assert.match(readingSubmit, /markAccountabilityAttemptCompleted/);
assert.match(listeningSubmit, /markAccountabilityAttemptCompleted/);
assert.match(writingService, /markAccountabilityAttemptCompleted/);

assert.match(
  packageJson.scripts.test,
  /test:accountability-beta/,
  "main test script includes accountability beta verification",
);

console.log("Accountability Beta verification passed.");
