import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path) {
  return readFileSync(join(root, path), "utf8");
}

const marketingHeader = read("src/components/layout/marketing-header.tsx");
const headerAuthNav = read("src/components/layout/header-auth-nav.tsx");
const mobileAppNav = read("src/components/layout/mobile-app-nav.tsx");
const practiceNavigation = read("src/components/layout/practice-navigation.tsx");
const messages = read("src/lib/i18n/messages.ts");

const headerSources = [marketingHeader, headerAuthNav, mobileAppNav].join("\n");

assert.doesNotMatch(marketingHeader, /href:\s*"\/writing-feedback"/);
assert.doesNotMatch(headerAuthNav, /href:\s*"\/writing-feedback"/);
assert.doesNotMatch(mobileAppNav, /href:\s*"\/writing-feedback"/);
assert.doesNotMatch(headerSources, /nav\.writingFeedback/);
assert.doesNotMatch(headerSources, /nav\.tryWriting/);
assert.doesNotMatch(headerSources, /MobileTryWritingButton/);

assert.match(marketingHeader, /function PracticeMegaMenu/);
assert.match(marketingHeader, /aria-expanded=\{isOpen\}/);
assert.match(marketingHeader, /aria-controls=\{panelId\}/);
assert.match(marketingHeader, /aria-current=\{practiceActive \? "page" : undefined\}/);
assert.match(marketingHeader, /handlePointerDown/);
assert.match(marketingHeader, /event\.key === "Escape"/);
assert.match(marketingHeader, /triggerRef\.current\?\.focus/);
assert.match(marketingHeader, /firstLinkRef\.current\?\.focus/);
assert.match(marketingHeader, /onMouseEnter=\{scheduleOpen\}/);
assert.match(marketingHeader, /onMouseLeave=\{scheduleClose\}/);
assert.match(marketingHeader, /sm:grid-cols-2/);
assert.match(marketingHeader, /nav\.practiceMenu\.viewAll/);

assert.match(practiceNavigation, /href: "\/practice\/writing"/);
assert.match(practiceNavigation, /href: "\/practice\/reading"/);
assert.match(practiceNavigation, /href: "\/practice\/listening"/);
assert.match(practiceNavigation, /href: "\/practice\/speaking"/);
assert.match(practiceNavigation, /export const allPracticeHref = "\/practice"/);
assert.match(
  practiceNavigation,
  /pathname === allPracticeHref \|\| pathname\.startsWith\(`\$\{allPracticeHref\}\/`\)/,
);
assert.doesNotMatch(practiceNavigation, /writing-feedback/);
assert.match(practiceNavigation, /function PracticeMobileAccordion/);
assert.match(practiceNavigation, /aria-expanded=\{isOpen\}/);
assert.match(practiceNavigation, /aria-controls=\{panelId\}/);
assert.match(practiceNavigation, /setIsOpen\(\(open\) => !open\)/);
assert.match(practiceNavigation, /closeAfterNavigationStarts/);
assert.match(practiceNavigation, /window\.setTimeout\(onNavigate, 0\)/);

assert.match(headerAuthNav, /<PracticeMobileAccordion pathname=\{pathname\} onNavigate=\{onClose\} \/>/);
assert.match(mobileAppNav, /<PracticeMobileAccordion/);
assert.match(mobileAppNav, /onNavigate=\{closeAfterNavigationStarts\}/);
assert.match(mobileAppNav, /window\.setTimeout\(\(\) => setIsOpen\(false\), 0\)/);

assert.match(marketingHeader, /labelKey: "nav\.methodology"/);
assert.match(marketingHeader, /labelKey: "nav\.pricing"/);
assert.match(headerSources, /<LanguageSwitcher/);

assert.match(messages, /"nav\.practiceMenu\.writing\.title": "Writing"/);
assert.match(messages, /"nav\.practiceMenu\.writing\.title": "Writing 写作"/);
assert.match(messages, /"nav\.practiceMenu\.reading\.description"/);
assert.match(messages, /"nav\.practiceMenu\.listening\.description"/);
assert.match(messages, /"nav\.practiceMenu\.speaking\.description"/);
assert.match(messages, /"nav\.practiceMenu\.viewAll": "View all practice"/);
assert.match(messages, /"nav\.practiceMenu\.viewAll": "查看全部练习"/);

console.log("Header navigation checks passed.");
