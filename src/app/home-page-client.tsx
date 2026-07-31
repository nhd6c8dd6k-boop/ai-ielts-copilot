"use client";

import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Headphones,
  LineChart,
  MessageSquareText,
  PenLine,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useI18n } from "@/components/i18n/language-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";
import { SupportFooter } from "@/components/layout/support-footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Language } from "@/lib/i18n/messages";

type PracticeCard = {
  slug: "writing" | "reading" | "listening" | "speaking";
  title: string;
  description: string;
  status: string;
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
  betaPrimary: string;
  betaSecondary: string;
  emailLabel: string;
  xiaohongshuLabel: string;
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
      "AI IELTS Copilot 帮你用电脑端页面练习 Reading、Listening、Writing 和 Speaking 备考，熟悉机考流程，并获得 Writing AI 评分与反馈。",
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
    oneLine: "一站式练习 Reading、Listening、Writing 和 Speaking 备考。",
    practiceCards: [
      {
        slug: "writing",
        title: "Writing",
        description: "预估分数、四项标准分析和句子修改建议。",
        status: "提供 AI Feedback",
        cta: "开始 Writing",
        href: "/practice/writing",
      },
      {
        slug: "reading",
        title: "Reading",
        description: "完成 IELTS-style Reading 练习，提交后自动检查答案。",
        status: "自动判分",
        cta: "开始 Reading",
        href: "/practice/reading",
      },
      {
        slug: "listening",
        title: "Listening",
        description: "使用经过审核脚本的 IELTS-style 听力音频练习。",
        status: "音频练习",
        cta: "开始 Listening",
        href: "/practice/listening",
      },
      {
        slug: "speaking",
        title: "Speaking",
        description: "使用 Part 1、Part 2 和 Part 3 备考材料练习。",
        status: "Speaking 题库",
        cta: "查看 Speaking 题库",
        href: "/practice/speaking",
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
    stepsBadge: "",
    stepsTitle: "",
    steps: [
      ["选择 Writing 题目", "选择 Task 1 或 Task 2，进入写作练习页面。"],
      ["提交作文", "完成作文后提交，系统会生成预估 Band 和详细反馈。"],
      ["查看下一步重点", "根据四项评分、句子改写和 task-specific feedback 调整下一篇作文。"],
    ],
    betaFreeTitle: "准备开始提升 IELTS Writing 吗？",
    betaFreeText:
      "选择一道题目，提交作文并查看预估分数、四项分析和句子修改建议。",
    betaPrimary: "免费体验 Writing 批改",
    betaSecondary: "查看反馈示例",
    emailLabel: "邮箱",
    xiaohongshuLabel: "小红书",
    complianceBadge: "",
    complianceTitle: "",
    complianceText: "",
    complianceItems: [],
  },
  en: {
    beta: "Free",
    brand: "AI IELTS Copilot",
    badge: "IELTS practice platform",
    title: "Start IELTS practice for free",
    subtitle:
      "AI IELTS Copilot helps you practise Reading, Listening, Writing, and Speaking preparation in a computer-based IELTS-style workspace, with AI-powered Writing scores and feedback.",
    availability: [
      "Reading / Listening auto scoring",
      "Writing AI scoring and feedback",
      "Free and Pro membership",
    ],
    betaNotice:
      "AI feedback is for study support and is not an official IELTS score.",
    primary: "Start Practicing",
    secondary: "View practice options",
    languageLabel: "Homepage language",
    oneLine: "Practice Reading, Listening, Writing, and Speaking preparation in one place.",
    practiceCards: [
      {
        slug: "writing",
        title: "Writing",
        description:
          "Estimated band, criteria-based feedback and sentence improvements.",
        status: "AI feedback available",
        cta: "Start Writing",
        href: "/practice/writing",
      },
      {
        slug: "reading",
        title: "Reading",
        description: "Practice with automatic answer checking.",
        status: "Automatic scoring",
        cta: "Start Reading",
        href: "/practice/reading",
      },
      {
        slug: "listening",
        title: "Listening",
        description: "IELTS-style audio practice with reviewed scripts.",
        status: "Audio practice",
        cta: "Start Listening",
        href: "/practice/listening",
      },
      {
        slug: "speaking",
        title: "Speaking",
        description: "Part 1, Part 2 and Part 3 preparation materials.",
        status: "Topic library",
        cta: "View Speaking Library",
        href: "/practice/speaking",
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
    previewSubmit: "Submit practice",
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
    stepsBadge: "",
    stepsTitle: "",
    steps: [
      [
        "Choose a Writing task",
        "Pick Task 1 or Task 2 and open the Writing practice editor.",
      ],
      [
        "Submit your response",
        "Write your essay and submit it to generate an estimated band and detailed feedback.",
      ],
      [
        "Review your next focus",
        "Use the criteria, sentence improvements, and task-specific feedback to plan your next essay.",
      ],
    ],
    betaFreeTitle: "Ready to improve your IELTS Writing?",
    betaFreeText:
      "Choose a task and receive an estimated band, criteria-based analysis and sentence improvement suggestions.",
    betaPrimary: "Try AI Writing Feedback",
    betaSecondary: "View Sample Feedback",
    emailLabel: "Email",
    xiaohongshuLabel: "Xiaohongshu",
    complianceBadge: "",
    complianceTitle: "",
    complianceText: "",
    complianceItems: [],
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
  const practiceIcons: Record<PracticeCard["slug"], LucideIcon> = {
    writing: PenLine,
    reading: BookOpen,
    listening: Headphones,
    speaking: MessageSquareText,
  };
  const heroPoints = [
    msg("home.hero.point.taskFeedback", "Task 1 and Task 2 specific feedback"),
    msg("home.hero.point.rewrite", "Original → Improved → Why"),
    msg("home.hero.point.criteria", "Criterion scores and score summary"),
    msg("home.hero.point.language", "Feedback in English or Chinese"),
  ];
  const whyCards = [
    {
      title: msg("home.why.card.task.title", "Task-specific feedback"),
      description: msg(
        "home.why.card.task.description",
        "Task 1 focuses on overview, key features, and comparisons. Task 2 focuses on position, idea development, and examples.",
      ),
      icon: PenLine,
    },
    {
      title: msg("home.why.card.rewrite.title", "Original → Improved → Why"),
      description: msg(
        "home.why.card.rewrite.description",
        "See a clearer version of your sentence and understand why the revision is more accurate and natural.",
      ),
      icon: CheckCircle2,
    },
    {
      title: msg("home.why.card.score.title", "Estimated band and four criteria"),
      description: msg(
        "home.why.card.score.description",
        "The report uses Task Achievement or Task Response, Coherence and Cohesion, Lexical Resource, and Grammar to explain the band estimate.",
      ),
      icon: LineChart,
    },
    {
      title: msg("home.why.card.language.title", "Clear next focus"),
      description: msg(
        "home.why.card.language.description",
        "Score summary and next steps point to what to practise in the next essay without turning the report into a long checklist.",
      ),
      icon: ShieldCheck,
    },
  ];
  const methodologyHighlights = [
    {
      title: msg(
        "home.methodology.criteria.title",
        "Criteria-based Writing analysis",
      ),
      description: msg(
        "home.methodology.criteria.description",
        "Writing feedback aligned with the four IELTS Writing assessment criteria.",
      ),
      icon: LineChart,
    },
    {
      title: msg(
        "home.methodology.calibration.title",
        "Task-specific score calibration",
      ),
      description: msg(
        "home.methodology.calibration.description",
        "Task type, response length, completion and score consistency are checked before presenting an estimated band.",
      ),
      icon: ShieldCheck,
    },
    {
      title: msg(
        "home.methodology.review.title",
        "Reviewed original practice content",
      ),
      description: msg(
        "home.methodology.review.description",
        "Original IELTS-style practice content is reviewed before publication.",
      ),
      icon: CheckCircle2,
    },
    {
      title: msg("home.methodology.audio.title", "Natural Listening audio"),
      description: msg(
        "home.methodology.audio.description",
        "Listening exercises use reviewed scripts and natural multi-speaker audio.",
      ),
      icon: Headphones,
    },
  ];
  const faqItems = [
    {
      question: msg(
        "home.faq.officialScore.question",
        "Is the AI Writing score an official IELTS score?",
      ),
      answer: msg(
        "home.faq.officialScore.answer",
        "No. AI scores are provided for practice and study guidance only. They do not replace an official IELTS result or assessment from a qualified examiner. The report combines criterion scores, task-specific feedback, and practical revisions to help identify key issues.",
      ),
    },
    {
      question: msg(
        "home.faq.essayPrivacy.question",
        "Will my essay be made public?",
      ),
      answer: msg(
        "home.faq.essayPrivacy.answer",
        "No. Your essay is used to generate feedback and save your personal practice history. The public Demo page uses original sample content created for the product, not a real user's essay.",
      ),
    },
    {
      question: msg(
        "home.faq.language.question",
        "Can I receive feedback in English or Chinese?",
      ),
      answer: msg(
        "home.faq.language.answer",
        "Yes. The site supports Chinese and English. New Writing feedback follows the interface language used when the essay is submitted, without displaying two full versions of the same report.",
      ),
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <MarketingHeader />
      <main>
        <section className="relative overflow-hidden border-b border-slate-200 bg-[#f8faf8]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:72px_72px] opacity-40" />
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
            <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-10">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge className="border-slate-950 bg-slate-950 text-white">
                    {t.beta}
                  </Badge>
                  <Badge className="bg-white/80">{t.badge}</Badge>
                </div>
                <div className="mt-5 hidden sm:flex">
                  <BrandLogo
                    className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 shadow-sm"
                    textClassName="text-base"
                  />
                </div>
                <h1 className="mt-5 max-w-3xl break-words text-3xl font-semibold tracking-tight text-slate-950 sm:mt-6 sm:text-5xl lg:text-6xl">
                  {msg(
                    "home.hero.title",
                    "Get IELTS Writing feedback you can actually use.",
                  )}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8">
                  {msg(
                    "home.hero.subtitle",
                    "Get criterion scores, task-specific feedback, sentence rewrites, and clear next steps. Try full AI Writing feedback on your first 3 submissions.",
                  )}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:mt-8 sm:flex-row">
                  <Button asChild size="lg">
                    <Link href="/practice/writing">
                      {msg(
                        "home.hero.primaryCta",
                        "Try AI Writing Feedback",
                      )}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/demo/writing-feedback">
                      {msg("home.hero.sampleLink", "View Sample Feedback")}
                    </Link>
                  </Button>
                </div>
                <p className="mt-4 inline-flex rounded-full border border-teal-200 bg-white/90 px-4 py-2 text-sm font-medium text-teal-800">
                  {msg(
                    "home.hero.freeWriting",
                    "3 full Writing feedback submissions included",
                  )}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500 sm:mt-4">
                  {msg(
                    "home.hero.disclaimer",
                    "AI scores are for study guidance and are not official IELTS results.",
                  )}
                </p>
                <div className="mt-5 grid max-w-2xl gap-2 sm:mt-6 sm:grid-cols-2">
                  {heroPoints.map((item) => (
                    <div
                      key={item}
                      className="rounded-md border border-slate-200 bg-white/80 p-3 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="min-w-0">
                <WritingFeedbackPreview t={msg} />
              </div>
            </div>

          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div className="min-w-0">
                <Badge className="bg-teal-50 text-teal-800">
                  {msg("home.why.eyebrow", "Why AI IELTS Copilot")}
                </Badge>
                <h2 className="mt-5 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {msg(
                    "home.why.title",
                    "Feedback you can use in your next essay.",
                  )}
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  {msg(
                    "home.why.description",
                    "From criterion scores and task-specific analysis to sentence rewrites and practical next steps, every part of the report is designed to help with your next essay.",
                  )}
                </p>
              </div>
              <div className="min-w-0 rounded-lg border border-slate-200 bg-[#f8faf8] p-4 text-sm leading-6 text-slate-700">
                {msg(
                  "home.why.note",
                  "You can also practise Reading and Listening in a computer-based IELTS-style interface.",
                )}
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {whyCards.map((card) => {
                const Icon = card.icon;

                return (
                  <div
                    key={card.title}
                    className="min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold leading-6 text-slate-950">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {card.description}
                    </p>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        <section className="border-b border-slate-200 bg-[#f8faf8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
              <div className="min-w-0">
                <Badge className="bg-slate-950 text-white">
                  {msg("home.methodology.eyebrow", "Methodology")}
                </Badge>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {msg(
                    "home.methodology.title",
                    "Built for serious IELTS practice",
                  )}
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  {msg(
                    "home.methodology.description",
                    "Our feedback and practice content are built around clear IELTS-focused methods, reviewed content and transparent limitations.",
                  )}
                </p>
                <Link
                  href="/methodology"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline"
                >
                  {msg("home.methodology.cta", "See our methodology")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {methodologyHighlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white text-teal-800 ring-1 ring-teal-200">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <h3 className="mt-4 text-base font-semibold leading-6 text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <Badge className="bg-slate-950 text-white">
                {msg("home.modules.eyebrow", "Practice modules")}
              </Badge>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {msg("home.modules.title", "Practise across IELTS skills")}
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                {msg(
                  "home.modules.description",
                  "Writing includes AI feedback. Reading and Listening use automatic scoring. Speaking is currently a preparation library.",
                )}
              </p>
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-4">
              {t.practiceCards.map((card) => {
                const Icon = practiceIcons[card.slug];
                const isFeatured = card.slug === "writing";
                const title = isFeatured
                  ? msg("home.practice.writingTitle", card.title)
                  : card.title;
                const description = isFeatured
                  ? msg("home.practice.writingDescription", card.description)
                  : card.description;
                const cta = isFeatured
                  ? msg("home.practice.writingCta", card.cta)
                  : card.cta;
                const status = isFeatured
                  ? msg("home.practice.aiFeedbackBadge", card.status)
                  : card.status;

                return (
                  <div
                    key={card.slug}
                    className={
                      isFeatured
                        ? "flex min-w-0 flex-col rounded-lg border border-teal-300 bg-[#f8faf8] p-5 text-left shadow-md lg:col-span-2"
                        : "flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm"
                    }
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <Badge
                        className={
                          isFeatured
                            ? "bg-teal-50 text-teal-800"
                            : "bg-white"
                        }
                      >
                        {status}
                      </Badge>
                    </div>
                    <h3 className="mt-5 text-lg font-semibold text-slate-950">
                      {title}
                    </h3>
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

            <div className="mt-8">
              <Button asChild variant="outline">
                <Link href="/practice">
                  {msg("home.modules.cta", "View all practice")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
              <div className="min-w-0">
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                  {msg(
                    "home.trust.title",
                    "Quick questions before you start",
                  )}
                </h2>
                <p className="mt-4 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                  {msg(
                    "home.trust.description",
                    "A short set of answers about estimated scores, privacy, and feedback language.",
                  )}
                </p>
              </div>

              <div className="min-w-0 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                {faqItems.map((item, index) => (
                  <details
                    key={item.question}
                    className="group p-5"
                    open={index === 0}
                  >
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold leading-6 text-slate-950">
                      <span>{item.question}</span>
                      <span
                        className="mt-0.5 text-xl leading-none text-slate-400 transition group-open:rotate-45"
                        aria-hidden="true"
                      >
                        +
                      </span>
                    </summary>
                    <div className="mt-3 text-sm leading-6 text-slate-600">
                      <p>{item.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-slate-200 bg-[#f8faf8]">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="rounded-lg border border-teal-200 bg-white p-6">
              <div className="mx-auto max-w-3xl text-center">
                <Badge className="bg-teal-50 text-teal-800">{t.beta}</Badge>
                <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                  {t.betaFreeTitle}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {t.betaFreeText}
                </p>
                <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button asChild>
                    <Link href="/practice/writing">
                      {t.betaPrimary}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/demo/writing-feedback">{t.betaSecondary}</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SupportFooter />
    </div>
  );
}
