import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { proPricing } from "../src/config/pricing.ts";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

assert.equal(proPricing.yearly.cad, "CA$79.99");
assert.equal(proPricing.yearly.display, "CA$79.99 / year");
assert.equal(proPricing.yearly.monthlyEquivalent, "About CA$6.67/month");
assert.equal(proPricing.yearly.savingsPercent, "Save 33%");
assert.equal(
  proPricing.yearly.savingsAmount,
  "Save CA$39.89 compared with monthly",
);

const messages = read("src/lib/i18n/messages.ts");
assert.match(messages, /CA\$79\.99\/year/);
assert.match(messages, /CA\$79\.99\/年/);
assert.match(messages, /About CA\$6\.67\/month/);
assert.match(messages, /约 CA\$6\.67 \/ 月/);
assert.match(messages, /Save 33%/);
assert.match(messages, /节省 33%/);

const upgradeButton = read("src/features/payments/contact-to-upgrade-button.tsx");
assert.match(upgradeButton, /Pro Yearly plan for \$\{proPricing\.yearly\.cad\}/);

const migration = read(
  "supabase/migrations/014_speaking_question_unlock_limits.sql",
);
assert.match(
  migration,
  /create table if not exists public\.speaking_question_unlocks/,
);
assert.match(migration, /unique \(user_id, question_id, usage_date\)/);
assert.match(migration, /create or replace function public\.unlock_speaking_question\(p_question_id uuid\)/);
assert.match(migration, /pg_advisory_xact_lock/);
assert.match(
  migration,
  /drop policy if exists "Published speaking questions are readable"/,
);
assert.match(migration, /grant execute on function public\.unlock_speaking_question\(uuid\) to authenticated/);
assert.doesNotMatch(migration, /p_user_id/);

const speakingService = read("src/server/services/speaking-practice.ts");
const topicDetailFunction = speakingService
  .split("export const getPublishedSpeakingTopicBySlug")[1]
  .split("export async function getPublishedSpeakingQuestionById")[0];
assert.match(topicDetailFunction, /\.select\("id,question_order"\)/);
assert.doesNotMatch(topicDetailFunction, /\.select\([^)]*sample_band_6/);
assert.doesNotMatch(topicDetailFunction, /\.select\([^)]*useful_phrases/);
assert.doesNotMatch(topicDetailFunction, /\.select\([^)]*vocabulary/);

const speakingPage = read("src/app/practice/speaking/[slug]/page.tsx");
assert.match(speakingPage, /getSpeakingUsageSummary/);
assert.match(speakingPage, /<SpeakingTopicPractice/);
assert.doesNotMatch(speakingPage, /<SpeakingQuestionCard/);

console.log("Speaking pricing and daily limit checks passed.");
