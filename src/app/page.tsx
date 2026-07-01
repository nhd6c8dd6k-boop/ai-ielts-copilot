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
  badge: string;
  title: string;
  subtitle: string;
  primary: string;
  secondary: string;
  languageLabel: string;
  passageTitle: string;
  timer: string;
  answerSheet: string;
  previewTitle: string;
  previewParagraphs: string[];
  questions: string[];
  pillars: Pillar[];
  complianceBadge: string;
  complianceTitle: string;
  complianceText: string;
  complianceItems: string[];
  modules: string[][];
};

const copy = {
  zh: {
    badge: "面向中国学生的 AI 雅思学习平台",
    title: "AI IELTS Copilot",
    subtitle:
      "Computer IELTS-style Reading and Listening practice，配合后台审核发布的原创英文练习内容。Writing 练习模式已可用，AI 写作反馈即将开放。",
    primary: "免费开始",
    secondary: "体验练习工作台",
    languageLabel: "首页语言",
    passageTitle: "Reading Passage 2",
    timer: "36:42",
    answerSheet: "答题卡",
    previewTitle: "The changing economics of urban learning",
    previewParagraphs: [
      "In many large cities, education has become less attached to a single classroom and more dependent on flexible networks of mentors, software, and public institutions.",
      "Researchers argue that this shift is not simply technical. It changes how learners measure progress, choose materials, and recover from mistakes.",
    ],
    questions: [
      "1. According to paragraph B, what caused the first shift?",
      "2. TRUE / FALSE / NOT GIVEN",
      "3. Match the heading to paragraph C",
      "4. Complete the summary below",
    ],
    pillars: [
      {
        title: "已发布原创题库",
        description:
          "管理员审核后发布原创 IELTS 风格 Reading、Listening 和 Writing 内容。",
        icon: Sparkles,
      },
      {
        title: "自动判分",
        description:
          "Reading 和 Listening 提交后自动判分，结果页展示答案、解析和复盘入口。",
        icon: CheckCircle2,
      },
      {
        title: "电脑雅思体验",
        description:
          "左右分栏、计时器、答题导航、标记题目和提交结果，贴近电脑端练习习惯。",
        icon: Timer,
      },
      {
        title: "学习进度看板",
        description:
          "Dashboard 汇总真实练习记录、最近成绩、技能分布和下一步练习建议。",
        icon: LineChart,
      },
    ],
    complianceBadge: "合规优先",
    complianceTitle: "只做原创雅思风格训练",
    complianceText:
      "内容系统围绕原创生成、管理员审核和发布流程设计。Cambridge 真题、考试回忆和盗版 PDF 不进入产品。",
    complianceItems: ["原创练习内容", "管理员审核发布", "官方公开样题仅做链接"],
    modules: [
      ["阅读", "练习已发布的英文文章和题目，提交后自动判分并查看解析。"],
      ["听力", "练习已发布的英文听力题；音频未就绪时可用 script preview 测试流程。"],
      ["写作", "选择已发布的 Task 1 / Task 2 题目，在浏览器中写作并保存草稿。"],
    ],
  },
  en: {
    badge: "AI IELTS platform for Chinese candidates",
    title: "AI IELTS Copilot",
    subtitle:
      "Computer IELTS-style Reading and Listening practice with admin-reviewed original content. Writing practice mode is available, with AI feedback coming soon.",
    primary: "Start free",
    secondary: "View practice workspace",
    languageLabel: "Homepage language",
    passageTitle: "Reading Passage 2",
    timer: "36:42",
    answerSheet: "Answer Sheet",
    previewTitle: "The changing economics of urban learning",
    previewParagraphs: [
      "In many large cities, education has become less attached to a single classroom and more dependent on flexible networks of mentors, software, and public institutions.",
      "Researchers argue that this shift is not simply technical. It changes how learners measure progress, choose materials, and recover from mistakes.",
    ],
    questions: [
      "1. According to paragraph B, what caused the first shift?",
      "2. TRUE / FALSE / NOT GIVEN",
      "3. Match the heading to paragraph C",
      "4. Complete the summary below",
    ],
    pillars: [
      {
        title: "Reviewed content library",
        description:
          "Admins review and publish original IELTS-style Reading, Listening, and Writing content.",
        icon: Sparkles,
      },
      {
        title: "Automatic scoring",
        description:
          "Reading and Listening submissions are scored automatically with answer review.",
        icon: CheckCircle2,
      },
      {
        title: "Computer IELTS flow",
        description:
          "Split-pane practice, timer, answer navigation, flags, and focused result review.",
        icon: Timer,
      },
      {
        title: "Progress dashboard",
        description:
          "Track real attempts, recent scores, skill trends, and next practice focus.",
        icon: LineChart,
      },
    ],
    complianceBadge: "Compliance first",
    complianceTitle: "Built for original IELTS style training",
    complianceText:
      "The content system is designed around original generation, admin review, and published practice sets. Protected Cambridge content and exam recalls stay outside the product.",
    complianceItems: ["Original practice", "Admin reviewed", "Official samples as links only"],
    modules: [
      ["Reading", "Published passages and questions with automatic scoring."],
      ["Listening", "Published scripts and questions with script preview when audio is pending."],
      ["Writing", "Published Task 1 and Task 2 prompts with draft saving."],
    ],
  },
} satisfies Record<Locale, HomeCopy>;

export default function Home() {
  const [locale, setLocale] = useState<Locale>("zh");
  const t = copy[locale];

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f8faf8]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
          <div className="relative mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl content-center gap-10 px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
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
              <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                {t.title}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {t.subtitle}
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/register">
                    {t.primary}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/practice/reading">{t.secondary}</Link>
                </Button>
              </div>
            </div>

            <div className="grid overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r">
                <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3 text-sm">
                  <div className="font-medium text-slate-950">
                    {t.passageTitle}
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Timer className="h-4 w-4" aria-hidden="true" />
                    {t.timer}
                  </div>
                </div>
                <div className="space-y-4 text-sm leading-7 text-slate-700">
                  <p className="font-medium text-slate-950">{t.previewTitle}</p>
                  {t.previewParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <div className="bg-slate-50 p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-sm font-medium text-slate-950">
                    {t.answerSheet}
                  </div>
                  <Badge className="bg-white">Practice preview</Badge>
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
                        <p className="text-sm leading-6 text-slate-700">
                          {question}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-20 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
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

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div>
              <Badge>{t.complianceBadge}</Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                {t.complianceTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
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

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-20 sm:px-6 lg:grid-cols-3 lg:px-8">
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
      </main>
    </div>
  );
}
