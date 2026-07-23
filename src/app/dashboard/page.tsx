"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Headphones,
  LineChart as LineChartIcon,
  Loader2,
  MessageSquareText,
  PencilLine,
  Target,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";

import { useI18n } from "@/components/i18n/language-provider";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getSkillAverage,
  type PracticeHistoryItem,
  type PracticeSkill,
} from "@/features/practice-history/storage";
import { useSyncedPracticeHistory } from "@/features/practice-history/use-practice-history";
import {
  getDashboardNextAction,
  type DashboardNextAction,
  type DashboardWritingDraft,
} from "@/features/dashboard/next-action";
import { getSkillFocusInsights } from "@/features/dashboard/skill-focus";
import {
  mapPracticeHistoryToWeeklyAttempts,
  type WeeklyPracticeProgress,
  type WeeklyProgressItem,
  WEEKLY_GOALS,
  getWeeklyPracticeProgress,
} from "@/features/dashboard/weekly-progress";
import { countWords } from "@/lib/word-count";

const skillLabels: Record<PracticeSkill, string> = {
  reading: "Reading",
  writing: "Writing",
  listening: "Listening",
};

const recentPracticeTabs = [
  { skill: "reading", label: "Reading", href: "/practice/reading" },
  { skill: "listening", label: "Listening", href: "/practice/listening" },
  { skill: "writing", label: "Writing", href: "/practice/writing" },
] as const;

const syncLabels = {
  loading: "正在同步学习记录",
  local: "本地记录",
  supabase: "已同步到账号",
  anonymous: "未登录，本地记录",
  error: "云端同步失败",
};

const writingDraftStoragePrefix = "ai-ielts-writing-draft-";

type DashboardSpeakingStats = {
  topicCount: number;
  questionCount: number;
  partCounts: Record<"1" | "2" | "3", number>;
};

export default function DashboardPage() {
  const { t } = useI18n();
  const { history, syncMode } = useSyncedPracticeHistory();
  const [activeRecentSkill, setActiveRecentSkill] =
    useState<PracticeSkill>("reading");
  const [writingDraft, setWritingDraft] = useState<DashboardWritingDraft | null>(
    null,
  );
  const [dashboardNow, setDashboardNow] = useState<Date | null>(null);
  const [speakingStats, setSpeakingStats] =
    useState<DashboardSpeakingStats | null>(null);
  const [isSpeakingStatsLoading, setIsSpeakingStatsLoading] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setWritingDraft(findWritingDraft());
      setDashboardNow(new Date());
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadSpeakingStats() {
      try {
        const response = await fetch("/api/practice/library-stats", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load speaking stats");
        }

        const payload = (await response.json()) as {
          speaking?: DashboardSpeakingStats | null;
        };

        if (isActive) {
          setSpeakingStats(payload.speaking ?? null);
        }
      } catch {
        if (isActive) {
          setSpeakingStats(null);
        }
      } finally {
        if (isActive) {
          setIsSpeakingStatsLoading(false);
        }
      }
    }

    void loadSpeakingStats();

    return () => {
      isActive = false;
    };
  }, []);

  const totalCompletedAttempts = history.length;
  const latestAttempt = history[0];
  const averageReadingScore = getAverageAccuracy(history, "reading");
  const averageListeningScore = getAverageAccuracy(history, "listening");
  const isLoading = syncMode === "loading";
  const isSyncError = syncMode === "error";
  const shouldShowOnboarding =
    totalCompletedAttempts === 0 && !isLoading && !isSyncError;
  const nextAction = getDashboardNextAction({
    history,
    writingDraft,
    isLoading,
    isError: isSyncError,
  });
  const weeklyProgress =
    dashboardNow && totalCompletedAttempts > 0 && !isLoading && !isSyncError
      ? getWeeklyPracticeProgress({
          attempts: mapPracticeHistoryToWeeklyAttempts(history),
          now: dashboardNow,
          goals: WEEKLY_GOALS,
        })
      : null;
  const trendData = history
    .slice(0, 8)
    .reverse()
    .map((item, index) => ({
      name: `${index + 1}`,
      band: Number(item.bandEstimate.toFixed(1)),
    }));
  const radarData = (["reading", "writing", "listening"] as const).map(
    (skill) => ({
      skill: skillLabels[skill],
      band: Number((getSkillAverage(history, skill) ?? 0).toFixed(1)),
    }),
  );
  const skillRows = getSkillFocusInsights(history);
  const recentAttemptsBySkill = recentPracticeTabs.reduce(
    (groups, tab) => ({
      ...groups,
      [tab.skill]: history.filter((item) => item.skill === tab.skill),
    }),
    {} as Record<PracticeSkill, PracticeHistoryItem[]>,
  );
  const activeRecentAttempts =
    recentAttemptsBySkill[activeRecentSkill].slice(0, 6);
  const activeRecentTab = recentPracticeTabs.find(
    (tab) => tab.skill === activeRecentSkill,
  );

  const stats = [
    {
      label: "Total Attempts",
      labelKey: "dashboard.totalAttempts",
      value: `${totalCompletedAttempts}`,
      icon: BookOpen,
    },
    {
      label: "Average Reading Score",
      labelKey: "dashboard.averageReading",
      value:
        averageReadingScore === null
          ? t("dashboard.notStarted", "Not started")
          : `${averageReadingScore}%`,
      icon: Target,
    },
    {
      label: "Average Listening Score",
      labelKey: "dashboard.averageListening",
      value:
        averageListeningScore === null
          ? t("dashboard.notStarted", "Not started")
          : `${averageListeningScore}%`,
      icon: Target,
    },
    {
      label: "Latest Practice",
      labelKey: "dashboard.latestPractice",
      value: latestAttempt
        ? skillLabels[latestAttempt.skill]
        : t("dashboard.notStarted", "Not started"),
      icon: CalendarDays,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        eyebrowKey="dashboard.eyebrow"
        title="你的 IELTS 学习驾驶舱"
        titleKey="dashboard.title"
        description="自动汇总 Reading、Listening 和 Writing 练习记录，展示预计分数、学习趋势、技能分布和下一步建议。"
        descriptionKey="dashboard.description"
      />

      <div className="mb-4 flex justify-end">
        <Badge
          className={
            syncMode === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }
        >
          {t(`dashboard.sync.${syncMode}`, syncLabels[syncMode])}
        </Badge>
      </div>

      {isLoading ? (
        <DashboardStatusPanel
          icon="loading"
          title={t("dashboard.loadingTitle", "Loading your dashboard")}
          description={t(
            "dashboard.loadingDescription",
            "We are syncing your practice history before showing insights.",
          )}
        />
      ) : isSyncError && !history.length ? (
        <DashboardStatusPanel
          icon="error"
          title={t("dashboard.errorTitle", "Dashboard is temporarily unavailable")}
          description={t(
            "dashboard.errorDescription",
            "We could not load your practice history. Please refresh the page or try again later.",
          )}
        />
      ) : shouldShowOnboarding ? (
        <>
          <NewUserOnboarding writingDraft={writingDraft} t={t} />
          <DashboardSpeakingPreparationCard
            stats={speakingStats}
            isLoading={isSpeakingStatsLoading}
            t={t}
          />
        </>
      ) : (
        <>
          {nextAction ? (
            <DashboardNextActionCard action={nextAction} t={t} />
          ) : null}

          {weeklyProgress ? (
            <DashboardWeeklyProgressCard progress={weeklyProgress} t={t} />
          ) : null}

          <DashboardSpeakingPreparationCard
            stats={speakingStats}
            isLoading={isSpeakingStatsLoading}
            t={t}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-600">
                      {t(stat.labelKey, stat.label)}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-slate-950">
                      {stat.value}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("dashboard.learningTrend", "Learning trend")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {trendData.length ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis domain={[4, 9]} stroke="#64748b" />
                        <Line
                          type="monotone"
                          dataKey="band"
                          stroke="#0f766e"
                          strokeWidth={2}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label={t("dashboard.emptyChart")} />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.skillRadar", "Skill radar")}</CardTitle>
              </CardHeader>
              <CardContent>
                {history.length ? (
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="skill" />
                        <Radar
                          dataKey="band"
                          stroke="#0f766e"
                          fill="#0f766e"
                          fillOpacity={0.18}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyChart label={t("dashboard.emptyChart")} />
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <Card>
              <CardHeader>
                <CardTitle>{t("dashboard.skillFocus", "Skill focus")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {skillRows.map((row) => (
                  <div
                    key={row.skill}
                    className="rounded-md border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-slate-950">
                          {renderSkillIcon(row.skill)}
                        </div>
                        <p className="text-sm font-medium text-slate-950">
                          {t(row.titleKey, row.titleFallback)}
                        </p>
                      </div>
                      <Badge className="bg-white">
                        {t(row.statusKey, row.statusFallback)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      {t(row.descriptionKey, row.descriptionFallback)}
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link href={row.href}>
                        {t(row.buttonKey, row.buttonFallback)}
                      </Link>
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <CardTitle>
                    {t("dashboard.recentPractice", "Recent Practice")}
                  </CardTitle>
                  <div className="flex max-w-full gap-2 overflow-x-auto rounded-md bg-slate-100 p-1">
                    {recentPracticeTabs.map((tab) => {
                      const isActive = activeRecentSkill === tab.skill;

                      return (
                        <button
                          key={tab.skill}
                          type="button"
                          className={
                            isActive
                              ? "whitespace-nowrap rounded px-3 py-2 text-sm font-medium text-white bg-slate-950"
                              : "whitespace-nowrap rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-950"
                          }
                          onClick={() => setActiveRecentSkill(tab.skill)}
                        >
                          {tab.label} ({recentAttemptsBySkill[tab.skill].length})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeRecentAttempts.length ? (
                  activeRecentAttempts.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>{skillLabels[item.skill]}</Badge>
                          <p className="text-sm font-medium text-slate-950">
                            {getDisplayTitle(item.title)}
                          </p>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {item.detail}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-sm font-semibold text-slate-950">
                          {item.scoreLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                        {item.resultUrl ? (
                          <Button asChild variant="outline" size="sm" className="mt-2">
                            <Link href={item.resultUrl}>
                              {t("dashboard.viewResult", "View Result")}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-medium text-slate-950">
                      {t(
                        `dashboard.${activeRecentSkill}Empty`,
                        `No ${skillLabels[activeRecentSkill]} practice yet.`,
                      )}
                    </p>
                    {activeRecentTab ? (
                      <Button asChild className="mt-5">
                        <Link href={activeRecentTab.href}>
                          {t(
                            `dashboard.start${capitalize(activeRecentTab.label)}`,
                            `Start ${activeRecentTab.label}`,
                          )}
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}

function DashboardStatusPanel({
  icon,
  title,
  description,
}: {
  icon: "loading" | "error";
  title: string;
  description: string;
}) {
  const Icon = icon === "loading" ? Loader2 : AlertCircle;

  return (
    <Card>
      <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
        <Icon
          className={
            icon === "loading"
              ? "h-8 w-8 animate-spin text-slate-400"
              : "h-8 w-8 text-amber-600"
          }
          aria-hidden="true"
        />
        <h2 className="mt-4 text-lg font-semibold text-slate-950">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function NewUserOnboarding({
  writingDraft,
  t,
}: {
  writingDraft: DashboardWritingDraft | null;
  t: (key: string, fallback?: string) => string;
}) {
  const skillActions = [
    {
      title: "Reading",
      description: t(
        "dashboard.onboarding.readingDescription",
        "Practice with timed IELTS-style reading sets and detailed answer explanations.",
      ),
      button: t("dashboard.onboarding.startReading", "Start Reading"),
      href: "/practice/reading",
      icon: BookOpen,
    },
    {
      title: "Listening",
      description: t(
        "dashboard.onboarding.listeningDescription",
        "Complete IELTS-style listening practice with instant scoring and answer review.",
      ),
      button: t("dashboard.onboarding.startListening", "Start Listening"),
      href: "/practice/listening",
      icon: Headphones,
    },
    {
      title: "Writing",
      description: t(
        "dashboard.onboarding.writingDescription",
        "Write a Task 1 or Task 2 response and receive AI-powered feedback.",
      ),
      button: t("dashboard.onboarding.startWriting", "Start Writing"),
      href: "/practice/writing",
      icon: PencilLine,
    },
  ];

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/70">
          <CardTitle className="text-2xl leading-tight">
            {writingDraft
              ? t(
                  "dashboard.onboarding.draftTitle",
                  "Finish a scored task to unlock dashboard insights",
                )
              : t(
                  "dashboard.onboarding.title",
                  "Start building your IELTS baseline",
                )}
          </CardTitle>
          <CardDescription className="max-w-2xl text-base leading-7">
            {writingDraft
              ? t(
                  "dashboard.onboarding.draftDescription",
                  "You have a Writing draft saved in this browser. Finish it or submit a scored task to unlock score trends, skill insights, and clearer next-step recommendations.",
                )
              : t(
                  "dashboard.onboarding.description",
                  "Finish scored tasks in each skill to unlock score trends, skill insights, and personalized recommendations.",
                )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              t(
                "dashboard.onboarding.benefitProgress",
                "Track your score progress",
              ),
              t(
                "dashboard.onboarding.benefitCompare",
                "Compare your IELTS skills",
              ),
              t(
                "dashboard.onboarding.benefitNextSteps",
                "Get clearer next-step recommendations",
              ),
            ].map((benefit) => (
              <div
                key={benefit}
                className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
              >
                {benefit}
              </div>
            ))}
          </div>
          {writingDraft ? (
            <Button asChild variant="outline" className="mt-5">
              <Link href={writingDraft.href}>
                {t("dashboard.onboarding.continueDraft", "Continue Writing draft")}
              </Link>
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {skillActions.map((action) => {
          const Icon = action.icon;

          return (
            <Card key={action.title} className="h-full">
              <CardHeader>
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-950 text-white">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <CardTitle className="text-xl">{action.title}</CardTitle>
                <CardDescription className="leading-6">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link href={action.href}>
                    {action.button}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function DashboardSpeakingPreparationCard({
  stats,
  isLoading,
  t,
}: {
  stats: DashboardSpeakingStats | null;
  isLoading: boolean;
  t: (key: string, fallback?: string) => string;
}) {
  const partItems = [
    {
      label: t("dashboard.speakingPreparation.part1", "Part 1"),
      count: stats?.partCounts["1"],
    },
    {
      label: t("dashboard.speakingPreparation.part2", "Part 2"),
      count: stats?.partCounts["2"],
    },
    {
      label: t("dashboard.speakingPreparation.part3", "Part 3"),
      count: stats?.partCounts["3"],
    },
  ];

  return (
    <Card className="mb-6 overflow-hidden border-slate-300">
      <CardContent
        className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center"
        aria-busy={isLoading}
      >
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <MessageSquareText className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t(
                "dashboard.speakingPreparation.eyebrow",
                "Speaking preparation",
              )}
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">
              {t(
                "dashboard.speakingPreparation.title",
                "Build your Speaking answer bank",
              )}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {t(
                "dashboard.speakingPreparation.description",
                "Practise IELTS-style Part 1, Part 2, and Part 3 questions with Band 6-8 sample answers and useful language.",
              )}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {isLoading ? (
                <Badge className="border-slate-200 bg-slate-50 text-slate-600">
                  {t("dashboard.speakingPreparation.loading", "Loading library")}
                </Badge>
              ) : stats ? (
                <>
                  <Badge className="border-slate-200 bg-white text-slate-700">
                    {formatMessage(
                      t(
                        "dashboard.speakingPreparation.topicCount",
                        "{count} topics",
                      ),
                      { count: `${stats.topicCount}` },
                    )}
                  </Badge>
                  <Badge className="border-slate-200 bg-white text-slate-700">
                    {formatMessage(
                      t(
                        "dashboard.speakingPreparation.questionCount",
                        "{count} questions",
                      ),
                      { count: `${stats.questionCount}` },
                    )}
                  </Badge>
                </>
              ) : (
                <Badge className="border-slate-200 bg-white text-slate-700">
                  {t(
                    "dashboard.speakingPreparation.libraryAvailable",
                    "Preparation library",
                  )}
                </Badge>
              )}
              {partItems.map((item) => (
                <Badge
                  key={item.label}
                  className="border-slate-200 bg-slate-50 text-slate-700"
                >
                  {typeof item.count === "number"
                    ? `${item.label}: ${item.count}`
                    : item.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <Button asChild className="w-full lg:w-auto">
          <Link href="/practice/speaking">
            {t(
              "dashboard.speakingPreparation.cta",
              "Start Speaking Practice",
            )}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardNextActionCard({
  action,
  t,
}: {
  action: DashboardNextAction;
  t: (key: string, fallback?: string) => string;
}) {
  const description = formatMessage(
    t(action.descriptionKey, action.descriptionFallback),
    {
      count: `${action.metadata?.wordCount ?? 0}`,
    },
  );

  return (
    <Card className="mb-6 overflow-hidden border-slate-300">
      <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            {renderSkillIcon(action.skill)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t(action.eyebrowKey, action.eyebrowFallback)}
              </p>
              {action.reasonKey ? (
                <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                  {t(action.reasonKey, action.reasonFallback)}
                </Badge>
              ) : null}
            </div>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">
              {t(action.titleKey, action.titleFallback)}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>
        <Button asChild className="w-full shrink-0 md:w-auto">
          <Link href={action.href}>
            {t(action.buttonKey, action.buttonFallback)}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function DashboardWeeklyProgressCard({
  progress,
  t,
}: {
  progress: WeeklyPracticeProgress;
  t: (key: string, fallback?: string) => string;
}) {
  const skillProgress = [
    {
      skill: "reading" as const,
      label: t("dashboard.weeklyProgress.reading", "Reading"),
      item: progress.reading,
    },
    {
      skill: "listening" as const,
      label: t("dashboard.weeklyProgress.listening", "Listening"),
      item: progress.listening,
    },
    {
      skill: "writing" as const,
      label: t("dashboard.weeklyProgress.writing", "Writing"),
      item: progress.writing,
    },
  ];
  const description = progress.isGoalComplete
    ? t(
        "dashboard.weeklyProgress.description.completed",
        "Weekly goal completed. Keep practising if you would like to build more consistency.",
      )
    : t(
        "dashboard.weeklyProgress.description.inProgress",
        "You are making progress. Complete a few more practices to reach this week's goal.",
      );

  return (
    <Card className="mb-6">
      <CardContent className="grid gap-6 p-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("dashboard.weeklyProgress.eyebrow", "This week")}
          </p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">
            {t(
              "dashboard.weeklyProgress.title",
              "Weekly practice progress",
            )}
          </h2>
          <p className="mt-2 text-2xl font-semibold text-slate-950">
            {formatMessage(
              t(
                "dashboard.weeklyProgress.summary",
                "{completed} of {goal} practices completed",
              ),
              {
                completed: `${progress.total.completed}`,
                goal: `${progress.total.goal}`,
              },
            )}
          </p>
          <div className="mt-4">
            <ProgressBar
              item={progress.total}
              ariaLabel={formatMessage(
                t(
                  "dashboard.weeklyProgress.aria.totalProgress",
                  "Total weekly progress: {completed} of {goal} practices completed",
                ),
                {
                  completed: `${progress.total.completed}`,
                  goal: `${progress.total.goal}`,
                },
              )}
            />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {description}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-5">
            <Link href="/practice">
              {t("dashboard.weeklyProgress.viewPractice", "View all practice")}
            </Link>
          </Button>
        </div>

        <div className="space-y-4">
          {skillProgress.map(({ skill, label, item }) => (
            <div
              key={skill}
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-950">{label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-950">
                    {item.completed} / {item.goal}
                  </span>
                  {item.completed >= item.goal ? (
                    <Badge className="border-slate-200 bg-white text-slate-700">
                      {t("dashboard.weeklyProgress.completed", "Completed")}
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="mt-3">
                <ProgressBar
                  item={item}
                  ariaLabel={formatMessage(
                    t(
                      "dashboard.weeklyProgress.aria.skillProgress",
                      "{skill} weekly progress: {completed} of {goal}",
                    ),
                    {
                      skill: label,
                      completed: `${item.completed}`,
                      goal: `${item.goal}`,
                    },
                  )}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProgressBar({
  item,
  ariaLabel,
}: {
  item: WeeklyProgressItem;
  ariaLabel: string;
}) {
  const ariaValue = Math.min(item.completed, item.goal);

  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-slate-200"
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={item.goal}
      aria-valuenow={ariaValue}
    >
      <div
        className="h-full rounded-full bg-slate-950"
        style={{ width: `${item.percent}%` }}
      />
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
      <div className="text-center">
        <LineChartIcon
          className="mx-auto h-8 w-8 text-slate-400"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-slate-500">
          {label}
        </p>
      </div>
    </div>
  );
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function findWritingDraft(): DashboardWritingDraft | null {
  if (typeof window === "undefined") {
    return null;
  }

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index);

    if (!key?.startsWith(writingDraftStoragePrefix)) {
      continue;
    }

    const draft = window.localStorage.getItem(key)?.trim();

    if (!draft) {
      continue;
    }

    const taskId = key.slice(writingDraftStoragePrefix.length);

    return {
      href: taskId ? `/practice/writing/${taskId}` : "/practice/writing",
      wordCount: countWords(draft),
    };
  }

  return null;
}

function renderSkillIcon(skill: PracticeSkill) {
  if (skill === "reading") {
    return <BookOpen className="h-5 w-5" aria-hidden="true" />;
  }

  if (skill === "listening") {
    return <Headphones className="h-5 w-5" aria-hidden="true" />;
  }

  return <PencilLine className="h-5 w-5" aria-hidden="true" />;
}

function formatMessage(
  template: string,
  values: Record<string, string>,
) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, value),
    template,
  );
}

function getAverageAccuracy(
  history: PracticeHistoryItem[],
  skill: PracticeSkill,
) {
  const items = history.filter(
    (item) => item.skill === skill && typeof item.accuracy === "number",
  );

  if (!items.length) {
    return null;
  }

  return Math.round(
    items.reduce((total, item) => total + (item.accuracy ?? 0), 0) /
      items.length,
  );
}

function getDisplayTitle(title: string) {
  const normalizedTitle = title.trim();
  const legacyTitles: Record<string, string> = {
    "Test Reading Set - Urban Green Spaces":
      "Urban Green Spaces and Public Health",
    "Test Listening Set - Library Membership": "Library Membership Application",
  };

  if (legacyTitles[normalizedTitle]) {
    return legacyTitles[normalizedTitle];
  }

  return normalizedTitle
    .replace(/^Test\s+/i, "")
    .replace(/^Demo\s+/i, "")
    .replace(/^Sample\s+/i, "")
    .replace(/\s+-\s+Demo$/i, "")
    .replace(/\s+-\s+Sample$/i, "");
}
