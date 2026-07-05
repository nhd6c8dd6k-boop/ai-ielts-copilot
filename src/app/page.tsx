"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Headphones,
  LineChart,
  PenLine,
  ShieldCheck,
  Sparkles,
  Timer,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Locale = "zh" | "en";

type Pillar = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type HomeCopy = {
  beta: string;
  brand: string;
  badge: string;
  title: string;
  subtitle: string;
  availability: string[];
  betaNotice: string;
  primary: string;
  secondary: string;
  languageLabel: string;
  passageTitle: string;
  timer: string;
  answerSheet: string;
  previewTitle: string;
  previewParagraphs: string[];
  questions: string[];
  steps: string[][];
  pillars: Pillar[];
  complianceBadge: string;
  complianceTitle: string;
  complianceText: string;
  complianceItems: string[];
  modules: string[][];
};

const copy = {
  zh: {
    beta: "Beta",
    brand: "AI IELTS Copilot",
    badge: "面向中国雅思学生",
    title: "电脑雅思练习，从这里开始",
    subtitle:
      "用原创英文题熟悉 Computer IELTS 的做题节奏。Reading / Listening 已开放练习并自动判分；Writing 题目、草稿保存和 AI 批改已可测试。Beta 阶段免费使用。",
    availability: [
      "Reading / Listening 已可练习并自动判分",
      "Writing 题目和草稿保存已开放",
      "AI 写作批改已可测试",
    ],
    betaNotice:
      "Beta 阶段免费使用。Reading、Listening 和 Writing 已开放给第一批用户测试。",
    primary: "开始免费练习",
    secondary: "查看练习中心",
    languageLabel: "首页语言",
    passageTitle: "Reading Passage 2",
    timer: "36:42",
    answerSheet: "答题卡",
    previewTitle: "Urban Green Spaces and Public Health",
    previewParagraphs: [
      "In many cities, public parks and tree-lined streets are no longer treated as decorative extras. Health researchers increasingly describe them as part of a city’s preventive infrastructure.",
      "The strongest benefits appear when green spaces are close to homes, safe to enter, and connected to daily routines such as walking to school or commuting.",
    ],
    questions: [
      "1. According to paragraph A, what is one role of green spaces?",
      "2. TRUE / FALSE / NOT GIVEN",
      "3. Complete the sentence below.",
      "4. Choose the correct answer.",
    ],
    steps: [
      ["选择练习", "进入 Practice，选择 Reading、Listening 或 Writing。"],
      ["完成做题", "在电脑雅思风格界面中计时、答题、标记和提交。"],
      ["查看复盘", "提交后查看分数、正确答案、解析和练习记录。"],
    ],
    pillars: [
      {
        title: "电脑雅思风格界面",
        description:
          "左右分栏、计时器、答题卡和题号导航，让学生先熟悉 Computer IELTS 的操作感。",
        icon: Timer,
      },
      {
        title: "Reading / Listening 自动判分",
        description:
          "完成练习后自动统计正确率、分数和预估表现，减少手动对答案的成本。",
        icon: CheckCircle2,
      },
      {
        title: "答案解析和复盘",
        description:
          "结果页展示用户答案、正确答案和解析，方便回看错误原因。",
        icon: ShieldCheck,
      },
      {
        title: "Dashboard 学习记录",
        description:
          "自动记录最近练习、分数和学习轨迹，帮助学生看见自己的进度。",
        icon: LineChart,
      },
      {
        title: "Writing practice",
        description:
          "选择已发布的 Task 1 / Task 2 题目，在浏览器中写作、保存草稿并测试 AI 批改。",
        icon: PenLine,
      },
    ],
    complianceBadge: "内容合规",
    complianceTitle: "原创 IELTS 风格练习内容",
    complianceText:
      "AI IELTS Copilot 使用原创 IELTS 风格练习内容，不提供盗版真题或考试回忆。",
    complianceItems: ["原创练习内容", "管理员审核发布", "不提供盗版真题"],
    modules: [
      ["阅读", "练习已发布的英文文章和题目，提交后自动判分并查看解析。"],
      ["听力", "练习已发布的英文听力题，使用音频播放器完成答题并自动判分。"],
      ["写作", "选择已发布的 Task 1 / Task 2 题目，完成作文并获取 AI 反馈。"],
    ],
  },
  en: {
    beta: "Beta",
    brand: "AI IELTS Copilot",
    badge: "Built for Chinese IELTS candidates",
    title: "Computer IELTS practice starts here",
    subtitle:
      "Practice with original English content in a Computer IELTS-style interface. Reading and Listening are available with automatic scoring; Writing tasks, draft saving, and AI feedback are available for beta testing.",
    availability: [
      "Reading / Listening practice and auto scoring are available.",
      "Writing prompts and draft saving are open.",
      "AI Writing Feedback is available for beta testing.",
    ],
    betaNotice:
      "Free during beta. Reading, Listening, and Writing are open for early user testing.",
    primary: "Start free practice",
    secondary: "View Practice center",
    languageLabel: "Homepage language",
    passageTitle: "Reading Passage 2",
    timer: "36:42",
    answerSheet: "Answer Sheet",
    previewTitle: "Urban Green Spaces and Public Health",
    previewParagraphs: [
      "In many cities, public parks and tree-lined streets are no longer treated as decorative extras. Health researchers increasingly describe them as part of a city’s preventive infrastructure.",
      "The strongest benefits appear when green spaces are close to homes, safe to enter, and connected to daily routines such as walking to school or commuting.",
    ],
    questions: [
      "1. According to paragraph A, what is one role of green spaces?",
      "2. TRUE / FALSE / NOT GIVEN",
      "3. Complete the sentence below.",
      "4. Choose the correct answer.",
    ],
    steps: [
      ["Choose a practice mode", "Open Practice and select Reading, Listening, or Writing."],
      ["Complete the test flow", "Use a Computer IELTS-style interface with timer, answers, flags, and submit."],
      ["Review your result", "See score, correct answers, explanations, and practice history."],
    ],
    pillars: [
      {
        title: "Computer IELTS-style interface",
        description:
          "Split panes, timer, answer sheet, and question navigation help students get used to the computer test flow.",
        icon: Timer,
      },
      {
        title: "Reading / Listening auto scoring",
        description:
          "Submissions are scored automatically with correct count, percentage, and estimated performance.",
        icon: CheckCircle2,
      },
      {
        title: "Answer review",
        description:
          "Result pages show user answers, correct answers, and explanations for review.",
        icon: ShieldCheck,
      },
      {
        title: "Dashboard history",
        description:
          "Track recent attempts, scores, and learning progress in one place.",
        icon: LineChart,
      },
      {
        title: "Writing practice",
        description:
          "Published Task 1 and Task 2 prompts, draft saving, and AI feedback are available for beta testing.",
        icon: PenLine,
      },
    ],
    complianceBadge: "Compliance first",
    complianceTitle: "Built for original IELTS style training",
    complianceText:
      "AI IELTS Copilot uses original IELTS-style practice content and does not provide pirated official tests or exam recalls.",
    complianceItems: ["Original practice", "Admin reviewed", "No pirated tests"],
    modules: [
      ["Reading", "Published passages and questions with automatic scoring."],
      ["Listening", "Published audio practice with answer inputs and automatic scoring."],
      ["Writing", "Published Task 1 and Task 2 prompts with draft saving and AI feedback."],
    ],
  },
} satisfies Record<Locale, HomeCopy>;

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh");
  const t = copy[locale];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f8faf8]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
            <div className="min-w-0 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-slate-950 bg-slate-950 text-white">
                  {t.beta}
                </Badge>
                <Badge className="bg-white/80">{t.brand}</Badge>
                <Badge className="bg-white/80">{t.badge}</Badge>
                <div
                  className="inline-flex rounded-md border border-slate-200 bg-white p-1"
                  aria-label={t.languageLabel}
                >
                  {(["zh", "en"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setLocale(item)}
                      className={cn(
                        "h-8 rounded px-3 text-xs font-medium transition-colors",
                        locale === item
                          ? "bg-slate-950 text-white"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950",
                      )}
                    >
                      {item === "zh" ? "中文" : "EN"}
                    </button>
                  ))}
                </div>
              </div>
              <h1 className="mt-6 max-w-4xl break-words text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                {t.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {t.subtitle}
              </p>
              <div className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-3">
                {t.availability.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-lg border border-teal-200 bg-white/85 p-4 text-sm leading-6 text-slate-700">
                <span className="font-medium text-teal-800">{t.beta}</span>
                <span className="ml-2">{t.betaNotice}</span>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/practice/reading">
                    {t.primary}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/practice">{t.secondary}</Link>
                </Button>
              </div>
            </div>

            <div className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-950 px-5 py-3 text-white">
                <div className="flex min-w-0 flex-wrap items-center gap-3">
                  <Badge className="border-white/20 bg-white/10 text-white">
                    Computer IELTS-style
                  </Badge>
                  <span className="text-sm font-medium">{t.passageTitle}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-950">
                  <Timer className="h-4 w-4" aria-hidden="true" />
                  {t.timer}
                </div>
              </div>

              <div className="grid min-h-[460px] min-w-0 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
                <div className="min-w-0 border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
                  <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
                    <div className="font-medium text-slate-950">
                      Reading passage
                    </div>
                    <Badge className="bg-slate-50">Scrollable passage</Badge>
                  </div>
                  <div className="space-y-4 text-sm leading-7 text-slate-700">
                    <p className="font-medium text-slate-950">{t.previewTitle}</p>
                    {t.previewParagraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    <p>
                      City planners now face a practical question: how can these
                      benefits be measured and protected as urban populations
                      grow?
                    </p>
                  </div>
                </div>

                <div className="min-w-0 bg-slate-50 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-950">
                      {t.answerSheet}
                    </div>
                    <Badge className="bg-white">Auto scoring preview</Badge>
                  </div>
                  <div className="space-y-3">
                    {t.questions.map((question, index) => (
                      <div
                        key={question}
                        className="rounded-md border border-slate-200 bg-white p-3"
                      >
                        <div className="flex items-start gap-3">
                          {index === 1 ? (
                            <CheckCircle2
                              className="mt-0.5 h-4 w-4 text-teal-700"
                              aria-hidden="true"
                            />
                          ) : (
                            <Circle
                              className="mt-0.5 h-4 w-4 text-slate-300"
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-6 text-slate-700">
                              {question}
                            </p>
                            {index === 0 ? (
                              <div className="mt-3 grid gap-2">
                                {["A. A design feature", "B. A health asset", "C. A tourism plan"].map(
                                  (option) => (
                                    <div
                                      key={option}
                                      className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600"
                                    >
                                      {option}
                                    </div>
                                  ),
                                )}
                              </div>
                            ) : (
                              <div className="mt-3 h-9 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                                Type your answer
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-xs text-slate-500">
                      Flag, review, then submit when ready.
                    </div>
                    <Button className="shrink-0" size="sm">
                      Submit Practice
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge>3 steps</Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              从选择练习到查看复盘，一条流程完成
            </h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {t.steps.map(([title, description], index) => (
              <div
                key={title}
                className="rounded-lg border border-slate-200 bg-white p-6"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-sm font-semibold text-white">
                  {index + 1}
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950">
                  {title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-16 sm:px-6 md:grid-cols-2 xl:grid-cols-5 lg:px-8">
          {t.pillars.map((pillar) => {
            const Icon = pillar.icon;

            return (
              <div
                key={pillar.title}
                className="rounded-lg border border-slate-200 bg-white p-6"
              >
                <Icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
                <h2 className="mt-5 text-base font-semibold text-slate-950">
                  {pillar.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 border-t border-slate-200 px-4 py-16 sm:px-6 lg:grid-cols-3 lg:px-8">
          {t.modules.map(([title, description], index) => (
            <div
              key={title}
              className="rounded-lg border border-slate-200 bg-white p-6"
            >
              <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                {index === 1 ? (
                  <Headphones className="h-5 w-5" aria-hidden="true" />
                ) : index === 2 ? (
                  <PenLine className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {description}
              </p>
            </div>
          ))}
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div>
              <Badge>{t.complianceBadge}</Badge>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                {t.complianceTitle}
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {t.complianceText}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {t.complianceItems.map((item) => (
                <div
                  key={item}
                  className="rounded-lg border border-slate-200 bg-[#fbfbf8] p-5"
                >
                  <ShieldCheck
                    className="h-5 w-5 text-teal-700"
                    aria-hidden="true"
                  />
                  <p className="mt-4 text-sm font-medium text-slate-950">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
