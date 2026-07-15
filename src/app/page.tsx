"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Headphones,
  LineChart,
  PenLine,
  ShieldCheck,
  Timer,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useI18n } from "@/components/i18n/language-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";
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
    beta: "Free",
    brand: "AI IELTS Copilot",
    badge: "IELTS 机考练习平台",
    title: "免费开始 IELTS 练习",
    subtitle:
      "AI IELTS Copilot 帮你用电脑端页面练习 Reading、Listening 和 Writing，熟悉机考流程，并获得 Writing AI 评分与反馈。",
    availability: [
      "Reading / Listening 自动判分",
      "Writing AI 评分与反馈",
      "Free / Pro 会员支持",
    ],
    betaNotice:
      "AI feedback 仅供学习参考，不代表官方 IELTS 成绩。",
    primary: "开始练习",
    secondary: "查看练习项目",
    languageLabel: "首页语言",
    oneLine: "一站式练习 Reading、Listening 和 Writing。",
    practiceCards: [
      {
        title: "Writing Practice",
        description:
          "完成 Task 1 / Task 2 写作，提交后获得 AI band feedback、四项评分、原句改写和下一步建议。",
        cta: "免费试一次 Writing 批改",
        href: "/practice/writing",
      },
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
    betaFreeTitle: "免费开始，Pro 可联系开通",
    betaFreeText:
      "你可以先使用免费账户开始练习 Reading、Listening 和 Writing。需要开通 Pro 会员时，请通过邮箱或小红书联系，我们会根据注册邮箱人工开通。",
    betaRewardText:
      "前 10 名注册并完成一次练习的用户可获得 1 个月 Pro 体验。符合条件的用户将由管理员人工开通。",
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
    beta: "Free",
    brand: "AI IELTS Copilot",
    badge: "IELTS practice platform",
    title: "Start IELTS practice for free",
    subtitle:
      "AI IELTS Copilot helps you practise Reading, Listening, and Writing in a computer-based IELTS-style workspace, with AI-powered Writing scores and feedback.",
    availability: [
      "Reading / Listening auto scoring",
      "Writing AI scoring and feedback",
      "Free and Pro membership",
    ],
    betaNotice:
      "AI feedback is for study support and is not an official IELTS score.",
    primary: "Start Practicing",
    secondary: "View Practice Options",
    languageLabel: "Homepage language",
    oneLine: "Practice Reading, Listening, and Writing in one place.",
    practiceCards: [
      {
        title: "Writing Practice",
        description:
          "Complete Task 1 or Task 2 and receive AI band feedback, criterion scores, sentence rewrites, and next steps.",
        cta: "Try Writing feedback free",
        href: "/practice/writing",
      },
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
    betaFreeTitle: "Start free, upgrade to Pro when ready",
    betaFreeText:
      "You can start with a free account and practise Reading, Listening, and Writing. If you want Pro membership, contact us by email or Xiaohongshu and we will activate it manually using your registered email.",
    betaRewardText:
      "The first 10 users who register and complete a practice will receive one month of Pro access. Eligible users will be activated manually.",
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

function WritingFeedbackPreview({
  t,
}: {
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-xl sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <Badge className="bg-teal-50 text-teal-800">
            {t("home.preview.badge", "Writing feedback preview")}
          </Badge>
          <h2 className="mt-3 text-xl font-semibold text-slate-950">
            {t("home.preview.title", "AI Writing feedback")}
          </h2>
        </div>
        <div className="rounded-md bg-slate-950 px-4 py-3 text-center text-white">
          <p className="text-xs text-white/70">
            {t("home.preview.overallBand", "Overall Band")}
          </p>
          <p className="text-3xl font-semibold">6.5</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <ScoreMiniCard
          label={t("home.preview.taskResponse", "Task Response")}
          score="6.5"
        />
        <ScoreMiniCard
          label={t(
            "home.preview.coherence",
            "Coherence and Cohesion",
          )}
          score="7.0"
        />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <PenLine className="h-4 w-4 text-teal-700" aria-hidden="true" />
          {t("home.preview.sentenceImprovement", "Sentence Improvement")}
        </div>
        <div className="mt-4 space-y-3 text-sm leading-6">
          <PreviewTextBlock
            label={t("home.preview.original", "Original")}
            text="Many people think work from home is good."
          />
          <PreviewTextBlock
            label={t("home.preview.improved", "Improved")}
            text="Many people believe working from home is beneficial because it provides greater flexibility."
          />
          <PreviewTextBlock
            label={t("home.preview.why", "Why")}
            text={t(
              "home.preview.whyText",
              "“Working from home” is more natural here, and the improved sentence develops the idea more clearly.",
            )}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-2 text-sm text-slate-600">
        {[
          t("home.preview.summaryPoint", "Score summary explains why the band is not higher."),
          t("home.preview.nextPoint", "Next steps show what to practise in the next essay."),
        ].map((item) => (
          <div key={item} className="flex gap-2">
            <CheckCircle2
              className="mt-0.5 h-4 w-4 shrink-0 text-teal-700"
              aria-hidden="true"
            />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScoreMiniCard({ label, score }: { label: string; score: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs leading-5 text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-950">{score}</p>
    </div>
  );
}

function PreviewTextBlock({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-slate-700">{text}</p>
    </div>
  );
}

export default function Home() {
  const { language, t: msg } = useI18n();
  const t = copy[language];
  const practiceIcons = [PenLine, BookOpen, Headphones];
  const heroPoints = [
    msg("home.hero.point.taskFeedback", "Task 1 and Task 2 specific feedback"),
    msg("home.hero.point.rewrite", "Original → Improved → Why"),
    msg("home.hero.point.criteria", "Criterion scores and score summary"),
    msg("home.hero.point.language", "Feedback in English or Chinese"),
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f8faf8]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                <Badge className="border-slate-950 bg-slate-950 text-white">
                  {t.beta}
                </Badge>
                <Badge className="bg-white/80">{t.badge}</Badge>
              </div>
                <div className="mt-6 flex">
                <BrandLogo
                  className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 shadow-sm"
                  textClassName="text-base"
                />
              </div>
                <h1 className="mt-6 max-w-3xl break-words text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                  {msg(
                    "home.hero.title",
                    "Go beyond the Band score.",
                  )}
              </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  {msg(
                    "home.hero.subtitle",
                    "Get criterion scores, task-specific feedback, sentence rewrites, and clear next steps. Try one AI Writing feedback for free each day.",
                  )}
              </p>
                <p className="mt-4 inline-flex rounded-full border border-teal-200 bg-white/90 px-4 py-2 text-sm font-medium text-teal-800">
                  {msg(
                    "home.hero.freeWriting",
                    "1 free AI Writing feedback each day",
                  )}
              </p>
                <div className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
                  {heroPoints.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
                <p className="mt-4 text-sm leading-6 text-slate-500">
                  {msg(
                    "home.hero.disclaimer",
                    "AI scores are for study guidance and are not official IELTS results.",
                  )}
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/practice/writing">
                      {msg(
                        "home.hero.primaryCta",
                        "Try Writing feedback free",
                      )}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/practice/writing">
                      {msg(
                        "home.hero.secondaryCta",
                        "Browse Writing tasks",
                      )}
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="min-w-0">
                <WritingFeedbackPreview t={msg} />
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {t.practiceCards.map((card, index) => {
                const Icon = practiceIcons[index] ?? BookOpen;
                const isFeatured = index === 0;
                const title = isFeatured
                  ? msg("home.practice.writingTitle", card.title)
                  : card.title;
                const description = isFeatured
                  ? msg("home.practice.writingDescription", card.description)
                  : card.description;
                const cta = isFeatured
                  ? msg("home.practice.writingCta", card.cta)
                  : card.cta;

                return (
                  <div
                    key={title}
                    className={
                      isFeatured
                        ? "flex min-w-0 flex-col rounded-lg border border-teal-300 bg-white p-5 text-left shadow-md"
                        : "flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white/90 p-5 text-left shadow-sm"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      {isFeatured ? (
                        <Badge className="bg-teal-50 text-teal-800">
                          {msg("home.practice.aiFeedbackBadge", "AI feedback")}
                        </Badge>
                      ) : null}
                    </div>
                    <h2 className="mt-5 text-lg font-semibold text-slate-950">
                      {title}
                    </h2>
                    <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
                      {description}
                    </p>
                    <Button asChild className="mt-5 w-full">
                      <Link href={card.href}>{cta}</Link>
                    </Button>
                  </div>
                );
              })}
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
