import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const practicePage = read("src/app/practice/page.tsx");
const messages = read("src/lib/i18n/messages.ts");

assert.match(practicePage, /title="Practice every IELTS skill"/);
assert.match(
  practicePage,
  /description="Choose a skill and start an IELTS-style practice activity\."/,
);
assert.match(practicePage, /"Four skills\. One practice hub\."/);

const cardOrder = [
  practicePage.indexOf('slug: "writing"'),
  practicePage.indexOf('slug: "reading"'),
  practicePage.indexOf('slug: "listening"'),
  practicePage.indexOf('slug: "speaking"'),
];
assert.ok(cardOrder.every((index) => index > -1));
assert.deepEqual([...cardOrder].sort((a, b) => a - b), cardOrder);

assert.match(practicePage, /badge: "AI Feedback"/);
assert.match(practicePage, /isFeatured: true/);
assert.match(practicePage, /badge: "Auto scoring"/);
assert.match(practicePage, /badge: "Audio practice"/);
assert.match(practicePage, /badge: "Preparation"/);

assert.match(practicePage, /cta: "Start Writing practice"/);
assert.match(practicePage, /cta: "Start Reading practice"/);
assert.match(practicePage, /cta: "Start Listening practice"/);
assert.match(practicePage, /cta: "Open Speaking preparation"/);
assert.match(practicePage, /href: "\/practice\/writing"/);
assert.match(practicePage, /href: "\/practice\/reading"/);
assert.match(practicePage, /href: "\/practice\/listening"/);
assert.match(practicePage, /href: "\/practice\/speaking"/);

assert.match(practicePage, /title: "Full Mock Test"/);
assert.match(practicePage, /badge: "Coming soon"/);
const fullExamBlock =
  practicePage.match(/const fullExamCard = \{[\s\S]*?\n  \};/)?.[0] ?? "";
assert.doesNotMatch(fullExamBlock, /href:/);
assert.doesNotMatch(fullExamBlock, /cta:/);
assert.doesNotMatch(practicePage, /buildLoginRedirectHref\(fullExamCard/);

assert.match(messages, /"practice\.title": "Practice every IELTS skill"/);
assert.match(messages, /"practice\.title": "练习 IELTS 四项能力"/);
assert.match(messages, /"practice\.aiFeedbackAvailable": "AI Feedback"/);
assert.match(messages, /"practice\.topicLibrary": "Preparation"/);
assert.match(messages, /"practice\.topicLibrary": "备考资料"/);
assert.match(messages, /"practice\.fullExam\.title": "Full Mock Test"/);
assert.match(messages, /"practice\.fullExam\.title": "完整模考"/);
assert.match(
  messages,
  /"practice\.speaking\.cta": "Open Speaking preparation"/,
);
assert.match(messages, /"practice\.speaking\.cta": "进入 Speaking 备考"/);

console.log("Practice hub checks passed.");
