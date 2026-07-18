import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import ts from "typescript";

const tempDir = await mkdtemp(join(tmpdir(), "pro-activation-email-"));
const compilerOptions = {
  module: ts.ModuleKind.ES2022,
  target: ts.ScriptTarget.ES2022,
};

async function compileSource(sourceFileName, outputFileName, replacements = []) {
  const sourcePath = new URL(`../src/${sourceFileName}`, import.meta.url);
  let source = await readFile(sourcePath, "utf8");

  for (const [from, to] of replacements) {
    source = source.replaceAll(from, to);
  }

  const compiled = ts.transpileModule(source, { compilerOptions });
  const compiledPath = join(tempDir, outputFileName);
  await writeFile(compiledPath, compiled.outputText);
  return compiledPath;
}

await compileSource("lib/env.ts", "env.mjs");
await compileSource("lib/seo.ts", "seo.mjs");
const emailModulePath = await compileSource(
  "server/services/email.ts",
  "email.mjs",
  [
    [
      'import { Resend } from "resend";',
      "class Resend { emails = { send: async () => ({ data: { id: 'stubbed' }, error: null }) }; }",
    ],
    ['from "@/lib/env";', 'from "./env.mjs";'],
    ['from "@/lib/seo";', 'from "./seo.mjs";'],
  ],
);

const {
  buildProActivatedEmail,
  sendProActivatedEmail,
  shouldSendProActivationEmail,
} = await import(`file://${emailModulePath}`);

const expiresAt = "2026-08-15T23:59:59.000Z";
const siteUrl = "https://www.aiieltscopilot.com";

const englishTemplate = buildProActivatedEmail({
  displayName: "Alex",
  locale: "en",
  expiresAt,
  siteUrl,
});
assert.equal(
  englishTemplate.subject,
  "Your AI IELTS Copilot Pro membership is now active",
);
assert.match(englishTemplate.text, /Hi Alex,/);
assert.match(englishTemplate.text, /August 15, 2026/);
assert.match(englishTemplate.text, /Unlimited Reading practice/);
assert.match(englishTemplate.text, /Unlimited Listening practice/);
assert.match(englishTemplate.text, /Up to 10 AI Writing feedbacks per day/);
assert.match(
  englishTemplate.text,
  /https:\/\/www\.aiieltscopilot\.com\/practice\/writing/,
);
assert.match(
  englishTemplate.text,
  /https:\/\/www\.aiieltscopilot\.com\/profile/,
);
assert.doesNotMatch(englishTemplate.text, /guaranteed score improvement/i);

const chineseTemplate = buildProActivatedEmail({
  locale: "zh",
  expiresAt,
  siteUrl,
});
assert.match(chineseTemplate.text, /你好，/);
assert.match(chineseTemplate.text, /2026年8月15日/);
assert.match(chineseTemplate.text, /Reading 无限练习/);
assert.match(chineseTemplate.text, /Listening 无限练习/);
assert.match(chineseTemplate.text, /每天最多 10 次 AI Writing feedback/);

let calls = 0;
const sent = await sendProActivatedEmail(
  {
    to: "student@example.com",
    displayName: "Alex",
    locale: "en",
    expiresAt,
  },
  {
    config: {
      deliveryEnabled: "true",
      apiKey: "test-key",
      fromEmail: "AI IELTS Copilot <support@example.com>",
      replyToEmail: "support@example.com",
      siteUrl,
    },
    sender: async (payload) => {
      calls += 1;
      assert.equal(payload.to, "student@example.com");
      assert.match(
        payload.html,
        /Your AI IELTS Copilot Pro membership is now active/,
      );
      assert.match(payload.text, /August 15, 2026/);
      return { id: "email_test_123" };
    },
  },
);
assert.equal(sent.status, "sent");
assert.equal(sent.providerMessageId, "email_test_123");
assert.equal(calls, 1);

calls = 0;
const disabled = await sendProActivatedEmail(
  {
    to: "student@example.com",
    locale: "en",
    expiresAt,
  },
  {
    config: {
      deliveryEnabled: "false",
      apiKey: "test-key",
      fromEmail: "AI IELTS Copilot <support@example.com>",
      siteUrl,
    },
    sender: async () => {
      calls += 1;
      return { id: "should_not_send" };
    },
  },
);
assert.deepEqual(disabled, {
  status: "skipped",
  reason: "unsupported_environment",
});
assert.equal(calls, 0);

const notConfigured = await sendProActivatedEmail(
  {
    to: "student@example.com",
    locale: "en",
    expiresAt,
  },
  {
    config: {
      deliveryEnabled: "true",
      siteUrl,
    },
  },
);
assert.deepEqual(notConfigured, {
  status: "skipped",
  reason: "not_configured",
});

const missingRecipient = await sendProActivatedEmail(
  {
    to: null,
    locale: "en",
    expiresAt,
  },
  {
    config: {
      deliveryEnabled: "true",
      apiKey: "test-key",
      fromEmail: "AI IELTS Copilot <support@example.com>",
      siteUrl,
    },
  },
);
assert.deepEqual(missingRecipient, {
  status: "skipped",
  reason: "missing_recipient",
});

const failed = await sendProActivatedEmail(
  {
    to: "student@example.com",
    locale: "en",
    expiresAt,
  },
  {
    config: {
      deliveryEnabled: "true",
      apiKey: "test-key",
      fromEmail: "AI IELTS Copilot <support@example.com>",
      siteUrl,
    },
    sender: async () => {
      throw Object.assign(new Error("Provider failed"), {
        name: "ResendProviderError",
      });
    },
  },
);
assert.equal(failed.status, "failed");
assert.equal(failed.errorCode, "ResendProviderError");

assert.equal(shouldSendProActivationEmail(false), true);
assert.equal(shouldSendProActivationEmail(true), false);

console.log("Pro activation email checks passed.");
