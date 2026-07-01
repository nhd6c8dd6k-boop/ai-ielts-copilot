"use client";

import Link from "next/link";
import {
  BookOpen,
  CalendarDays,
  LineChart as LineChartIcon,
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

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getSkillAverage,
  type PracticeHistoryItem,
  type PracticeSkill,
} from "@/features/practice-history/storage";
import { useSyncedPracticeHistory } from "@/features/practice-history/use-practice-history";

const skillLabels: Record<PracticeSkill, string> = {
  reading: "Reading",
  writing: "Writing",
  listening: "Listening",
};

const syncLabels = {
  loading: "正在同步学习记录",
  local: "本地记录",
  supabase: "已同步到账号",
  anonymous: "未登录，本地记录",
  error: "云端同步失败",
};

export default function DashboardPage() {
  const { history, syncMode } = useSyncedPracticeHistory();

  const completedSets = history.length;
  const latestAttempt = history[0];
  const averageReadingScore = getAverageAccuracy(history, "reading");
  const averageListeningScore = getAverageAccuracy(history, "listening");
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
  const skillRows = buildSkillRows(history);
  const readingAttempts = history
    .filter((item) => item.skill === "reading")
    .slice(0, 5);
  const listeningAttempts = history
    .filter((item) => item.skill === "listening")
    .slice(0, 5);
  const writingAttempts = history
    .filter((item) => item.skill === "writing")
    .slice(0, 5);

  const stats = [
    {
      label: "Total Attempts",
      value: `${completedSets}`,
      icon: BookOpen,
    },
    {
      label: "Average Reading Score",
      value:
        averageReadingScore === null ? "Not started" : `${averageReadingScore}%`,
      icon: Target,
    },
    {
      label: "Average Listening Score",
      value:
        averageListeningScore === null
          ? "Not started"
          : `${averageListeningScore}%`,
      icon: Target,
    },
    {
      label: "Latest Practice",
      value: latestAttempt ? skillLabels[latestAttempt.skill] : "Not started",
      icon: CalendarDays,
    },
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Dashboard"
        title="你的 IELTS 学习驾驶舱"
        description="自动汇总 Reading、Listening 和 Writing 练习记录，展示预计分数、学习趋势、技能分布和下一步建议。"
      />

      <div className="mb-4 flex justify-end">
        <Badge
          className={
            syncMode === "error"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }
        >
          {syncLabels[syncMode]}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {stat.label}
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
            <CardTitle>Learning trend</CardTitle>
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
              <EmptyChart />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skill radar</CardTitle>
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
              <EmptyChart />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Skill focus</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {skillRows.map((row) => (
              <div
                key={row.skill}
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-950">
                    {row.skill}
                  </p>
                  <Badge className="bg-white">{row.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{row.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent practice</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length ? (
              history.slice(0, 6).map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-2 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>{skillLabels[item.skill]}</Badge>
                      <p className="text-sm font-medium text-slate-950">
                        {item.title}
                      </p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{item.detail}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-sm font-semibold text-slate-950">
                      {item.scoreLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <p className="text-sm text-slate-500">
                  完成一次 Reading、Listening 或 Writing 后，这里会显示学习记录。
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Reading attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {readingAttempts.length ? (
            readingAttempts.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Reading</Badge>
                    <Badge className="bg-white">
                      Band {item.bandEstimate.toFixed(1)}
                    </Badge>
                    <p className="text-sm font-medium text-slate-950">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.scoreLabel} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {item.resultUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.resultUrl}>View Result</Link>
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                完成一次真实 Reading Practice 后，这里会显示成绩和结果入口。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Writing attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {writingAttempts.length ? (
            writingAttempts.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Writing</Badge>
                    <Badge className="bg-white">
                      Band {item.bandEstimate.toFixed(1)}
                    </Badge>
                    <p className="text-sm font-medium text-slate-950">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.detail} · {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {item.resultUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.resultUrl}>View Result</Link>
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                完成一次真实 Writing Practice 后，这里会显示 AI 批改结果入口。
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Listening attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {listeningAttempts.length ? (
            listeningAttempts.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>Listening</Badge>
                    <Badge className="bg-white">
                      Band {item.bandEstimate.toFixed(1)}
                    </Badge>
                    <p className="text-sm font-medium text-slate-950">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {item.scoreLabel} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {item.resultUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.resultUrl}>View Result</Link>
                  </Button>
                ) : null}
              </div>
            ))
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-sm text-slate-500">
                完成一次真实 Listening Practice 后，这里会显示成绩和结果入口。
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-72 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50">
      <div className="text-center">
        <LineChartIcon
          className="mx-auto h-8 w-8 text-slate-400"
          aria-hidden="true"
        />
        <p className="mt-3 text-sm text-slate-500">
          完成第一次练习后，图表会自动出现。
        </p>
      </div>
    </div>
  );
}

function buildSkillRows(history: PracticeHistoryItem[]) {
  const readingAverage = getSkillAverage(history, "reading");
  const writingAverage = getSkillAverage(history, "writing");
  const listeningAverage = getSkillAverage(history, "listening");

  return [
    {
      skill: "Reading",
      status: readingAverage ? `Band ${readingAverage.toFixed(1)}` : "未开始",
      action: readingAverage
        ? "继续做一套不同题型的阅读，观察正确率是否稳定。"
        : "先选择一套已发布的 Reading 练习，建立初始阅读水平。",
    },
    {
      skill: "Writing",
      status: writingAverage ? `Band ${writingAverage.toFixed(1)}` : "未开始",
      action: writingAverage
        ? "根据 AI 反馈重写 introduction 和一个主体段。"
        : "选择一篇已发布的 Writing 题目，先完成作文练习。",
    },
    {
      skill: "Listening",
      status: listeningAverage ? `Band ${listeningAverage.toFixed(1)}` : "未开始",
      action: listeningAverage
        ? "继续练习不同 Section，特别关注拼写和数字信息。"
        : "选择一套已发布的 Listening 练习，建立听力基线。",
    },
  ];
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
