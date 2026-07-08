"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Headphones,
  LineChart,
  PenLine,
  ShieldCheck,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { LanguageSwitcher } from "@/components/i18n/language-switcher";
import { useI18n } from "@/components/i18n/language-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { BetaRewardModal } from "@/components/marketing/beta-reward-modal";
import { SupportFooter } from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/i18n/messages";
import { supportEmail, xiaohongshuAccount } from "@/lib/support";

type Pillar = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type PracticeCard = {
  title: string;
  description: string;
  cta: string;
  href: string;
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
  oneLine: string;
  practiceCards: PracticeCard[];
  previewHeading: string;
  previewDescription: string;
  previewPassageLabel: string;
  previewScrollableBadge: string;
  previewAutoScoringBadge: string;
  previewAnswerPlaceholder: string;
  previewSubmitHint: string;
  previewSubmit: string;
  passageTitle: string;
  timer: string;
  answerSheet: string;
  previewTitle: string;
  previewParagraphs: string[];
  questions: string[];
  stepsBadge: string;
  stepsTitle: string;
  steps: string[][];
  betaFreeTitle: string;
  betaFreeText: string;
  betaRewardText: string;
  emailLabel: string;
  xiaohongshuLabel: string;
  pillars: Pillar[];
  complianceBadge: string;
  complianceTitle: string;
  complianceText: string;
  complianceItems: string[];
};

const copy = {
  zh: {
    beta: "Beta",
    brand: "AI IELTS Copilot",
    badge: "面向中国雅思学生",
    title: "电脑雅思练习，从这里开始",
    subtitle:
      "第一次准备雅思机考，不知道考试页面长什么样？AI IELTS Copilot 帮你提前熟悉 Reading、Listening 和 Writing 的练习流程。Beta 阶段免费使用，欢迎第一批同学体验。",
    availability: [
      "Reading / Listening 自动判分",
      "Writing AI 评分与反馈",
      "Beta 免费测试中",
    ],
    betaNotice:
      "当前是 Beta 测试版，欢迎反馈问题和建议。",
    primary: "开始练习",
    secondary: "查看练习项目",
    languageLabel: "首页语言",
    oneLine: "一站式练习 Reading、Listening 和 Writing。",
    practiceCards: [
      {
        title: "Reading Practice",
        description:
          "练习原创英文文章和题目，提交后自动判分并查看答案解析。",
        cta: "开始 Reading",
        href: "/practice/reading",
      },
      {
        title: "Listening Practice",
        description:
          "播放 IELTS-style 听力音频，完成题目后自动判分并查看复盘。",
        cta: "开始 Listening",
        href: "/practice/listening",
      },
      {
        title: "Writing Practice",
        description:
          "完成 Task 1 / Task 2 写作，提交后获得 AI band feedback、四项评分和改进建议。",
        cta: "开始 Writing",
        href: "/practice/writing",
      },
    ],
    previewHeading: "机考风格界面预览",
    previewDescription:
      "左右分栏、计时器、答题卡和题号导航，帮助学生熟悉机考操作感。",
    previewPassageLabel: "阅读文章",
    previewScrollableBadge: "可滚动文章",
    previewAutoScoringBadge: "自动判分预览",
    previewAnswerPlaceholder: "输入答案",
    previewSubmitHint: "标记、检查，然后提交练习。",
    previewSubmit: "提交练习",
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
    stepsBadge: "三步开始",
    stepsTitle: "三步开始练习",
    steps: [
      ["选择练习项目", "选择 Reading、Listening 或 Writing。"],
      ["完成练习", "在接近机考的页面中完成题目或写作任务。"],
      ["查看结果", "查看分数、答案解析，以及 Writing AI 反馈。"],
    ],
    betaFreeTitle: "Beta 免费测试中",
    betaFreeText:
      "AI IELTS Copilot 目前还在 Beta 测试阶段。你可以免费体验 Reading、Listening 和 Writing 练习功能。如果遇到问题、页面不好用，或者有建议，欢迎通过邮箱或小红书反馈。",
    betaRewardText:
      "Beta 测试福利：前 10 名注册并完成一次练习的用户，正式付费版上线后可获得 1 个月 Pro 体验。",
    emailLabel: "邮箱",
    xiaohongshuLabel: "小红书",
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
        title: "学习记录 Dashboard",
        description:
          "自动记录最近练习、分数和学习轨迹，帮助学生看见自己的进度。",
        icon: LineChart,
      },
      {
        title: "Writing AI 反馈",
        description:
          "选择 Task 1 / Task 2 题目完成写作，提交后获得 AI 评分、四项标准反馈、语法建议、词汇升级和参考范文。",
        icon: PenLine,
      },
    ],
    complianceBadge: "内容合规",
    complianceTitle: "原创 IELTS 风格练习内容",
    complianceText:
      "AI IELTS Copilot 使用原创 IELTS 风格练习内容，不提供盗版真题或考试回忆。",
    complianceItems: ["原创练习内容", "管理员审核发布", "不提供盗版真题"],
  },
  en: {
    beta: "Beta",
    brand: "AI IELTS Copilot",
    badge: "Built for Chinese IELTS candidates",
    title: "Computer IELTS practice starts here",
    subtitle:
      "New to the computer test and not sure what the practice flow looks like? AI IELTS Copilot helps you practise Reading, Listening, and Writing with original English tasks. Free during beta for early testers.",
    availability: [
      "Reading / Listening auto scoring",
      "Writing AI scoring and feedback",
      "Free beta testing",
    ],
    betaNotice:
      "This is a beta version. Your feedback helps us improve the practice experience.",
    primary: "Start Practicing",
    secondary: "View Practice Options",
    languageLabel: "Homepage language",
    oneLine: "Practice Reading, Listening, and Writing in one place.",
    practiceCards: [
      {
        title: "Reading Practice",
        description:
          "Practice original English passages and questions, then review your score, answers, and explanations.",
        cta: "Start Reading",
        href: "/practice/reading",
      },
      {
        title: "Listening Practice",
        description:
          "Play IELTS-style listening audio, answer questions, and review your score after submitting.",
        cta: "Start Listening",
        href: "/practice/listening",
      },
      {
        title: "Writing Practice",
        description:
          "Complete Task 1 or Task 2 and receive AI band feedback, criteria scores, and improvement advice.",
        cta: "Start Writing",
        href: "/practice/writing",
      },
    ],
    previewHeading: "Computer IELTS-style interface preview",
    previewDescription:
      "Split panes, timer, answer sheet, and question navigation help students get comfortable with the computer test flow.",
    previewPassageLabel: "Reading passage",
    previewScrollableBadge: "Scrollable passage",
    previewAutoScoringBadge: "Auto scoring preview",
    previewAnswerPlaceholder: "Type your answer",
    previewSubmitHint: "Flag, review, then submit when ready.",
    previewSubmit: "Submit Practice",
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
    stepsBadge: "3 steps",
    stepsTitle: "Start practicing in 3 steps",
    steps: [
      [
        "Choose a skill",
        "Pick Reading, Listening, or Writing based on what you want to practise.",
      ],
      [
        "Complete the practice",
        "Work through the questions or writing task in a computer-based IELTS-style interface.",
      ],
      [
        "Review your results",
        "Check your score, answers, explanations, and AI writing feedback where available.",
      ],
    ],
    betaFreeTitle: "Free beta testing",
    betaFreeText:
      "AI IELTS Copilot is currently in beta. You can try Reading, Listening, and Writing practice for free. If something feels unclear or inconvenient, please send feedback by email or Xiaohongshu.",
    betaRewardText:
      "Beta tester reward: The first 10 users who sign up and complete one practice session will receive 1 month of Pro access when paid plans launch.",
    emailLabel: "Email",
    xiaohongshuLabel: "Xiaohongshu",
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
        title: "Writing AI Feedback",
        description:
          "Choose a Task 1 or Task 2 prompt, submit your essay, and receive AI scoring, criteria feedback, grammar advice, vocabulary upgrades, and a sample answer.",
        icon: PenLine,
      },
    ],
    complianceBadge: "Compliance first",
    complianceTitle: "Built for original IELTS style training",
    complianceText:
      "AI IELTS Copilot uses original IELTS-style practice content and does not provide pirated test materials or exam recalls.",
    complianceItems: [
      "Original practice",
      "Checked before release",
      "No pirated tests",
    ],
  },
} satisfies Record<Language, HomeCopy>;

export default function Home() {
  const { language } = useI18n();
  const t = copy[language];
  const practiceIcons = [BookOpen, Headphones, PenLine];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <MarketingHeader />
      <BetaRewardModal />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f8faf8]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
          <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-center px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <Badge className="border-slate-950 bg-slate-950 text-white">
                  {t.beta}
                </Badge>
                <Badge className="bg-white/80">{t.badge}</Badge>
                <LanguageSwitcher compact />
              </div>
              <div className="mt-6 flex justify-center">
                <BrandLogo
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 shadow-sm"
                  textClassName="text-base"
                />
              </div>
              <h1 className="mt-6 break-words text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                {t.title}
              </h1>
              <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-600">
                {t.subtitle}
              </p>
              <p className="mt-3 text-sm font-medium text-teal-800">
                {t.oneLine}
              </p>
              <div className="mx-auto mt-6 grid max-w-3xl gap-2 sm:grid-cols-3">
                {t.availability.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
              <div className="mx-auto mt-5 max-w-3xl rounded-lg border border-teal-200 bg-white/85 p-4 text-sm leading-6 text-slate-700">
                <span className="font-medium text-teal-800">{t.beta}</span>
                <span className="ml-2">{t.betaNotice}</span>
              </div>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/practice">
                    {t.primary}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/practice">{t.secondary}</Link>
                </Button>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {t.practiceCards.map((card, index) => {
                const Icon = practiceIcons[index] ?? BookOpen;

                return (
                  <div
                    key={card.title}
                    className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white/90 p-5 text-left shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-slate-950">
                      {card.title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                      {card.description}
                    </p>
                    <Button asChild className="mt-5 w-full">
                      <Link href={card.href}>{card.cta}</Link>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <Badge>{t.previewHeading}</Badge>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                {t.previewDescription}
              </p>
            </div>

            <div className="mx-auto mt-8 min-w-0 max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
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
                      {t.previewPassageLabel}
                    </div>
                    <Badge className="bg-slate-50">
                      {t.previewScrollableBadge}
                    </Badge>
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
                    <Badge className="bg-white">
                      {t.previewAutoScoringBadge}
                    </Badge>
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
                                {t.previewAnswerPlaceholder}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0 text-xs text-slate-500">
                      {t.previewSubmitHint}
                    </div>
                    <Button className="shrink-0" size="sm">
                      {t.previewSubmit}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <Badge>{t.stepsBadge}</Badge>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
              {t.stepsTitle}
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

        <section className="border-t border-slate-200 bg-[#f8faf8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-teal-200 bg-white p-6">
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                <div>
                  <Badge className="bg-teal-50 text-teal-800">
                    {t.beta}
                  </Badge>
                  <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                    {t.betaFreeTitle}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {t.betaFreeText}
                  </p>
                  <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                    {t.betaRewardText}
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <Image
                      src="/brand/full-logo.png"
                      alt="AI IELTS Copilot logo"
                      width={1536}
                      height={1024}
                      sizes="(min-width: 1024px) 360px, calc(100vw - 4rem)"
                      className="mx-auto h-auto w-full max-w-[22rem]"
                    />
                  </div>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                    <p>
                      <span className="font-medium text-slate-950">
                        {t.emailLabel}:
                      </span>{" "}
                      <a
                        href={`mailto:${supportEmail}`}
                        className="font-medium text-teal-800 underline-offset-4 hover:underline"
                      >
                        {supportEmail}
                      </a>
                    </p>
                    <p className="mt-2">
                      <span className="font-medium text-slate-950">
                        {t.xiaohongshuLabel}:
                      </span>{" "}
                      {xiaohongshuAccount}
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
      <SupportFooter />
    </div>
  );
}
