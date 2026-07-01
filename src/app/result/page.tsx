"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Headphones, PenLine, Target } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type PracticeHistoryItem,
  type PracticeSkill,
} from "@/features/practice-history/storage";
import { useSyncedPracticeHistory } from "@/features/practice-history/use-practice-history";

const skillMeta: Record<
  PracticeSkill,
  { label: string; href: string; icon: typeof BookOpen }
> = {
  reading: { label: "Reading", href: "/practice/reading", icon: BookOpen },
  listening: {
    label: "Listening",
    href: "/practice/listening",
    icon: Headphones,
  },
  writing: { label: "Writing", href: "/practice/writing", icon: PenLine },
};

const syncLabels = {
  loading: "正在同步学习记录",
  local: "本地记录",
  supabase: "已同步到账号",
  anonymous: "未登录，本地记录",
  error: "云端同步失败",
};

export default function ResultPage() {
  const { history, syncMode } = useSyncedPracticeHistory();
  const [activeSkill, setActiveSkill] = useState<PracticeSkill | "all">("all");
  const filteredHistory =
    activeSkill === "all"
      ? history
      : history.filter((item) => item.skill === activeSkill);
  const latest = history[0];
  const averageBand = history.length
    ? history.reduce((total, item) => total + item.bandEstimate, 0) /
      history.length
    : 0;
  const averageAccuracyItems = history.filter(
    (item) => typeof item.accuracy === "number",
  );
  const averageAccuracy = averageAccuracyItems.length
    ? Math.round(
        averageAccuracyItems.reduce(
          (total, item) => total + (item.accuracy ?? 0),
          0,
        ) / averageAccuracyItems.length,
      )
    : null;
  const weakAreaCounts = getWeakAreaCounts(history);

  return (
    <AppShell>
      <PageHeader
        eyebrow="Results"
        title="练习结果复盘中心"
        description="集中查看 Reading、Listening 和 Writing 的成绩、弱项标签、下一步建议和最近练习记录。"
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

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          title="Estimated Band"
          value={history.length ? averageBand.toFixed(1) : "-"}
          detail={latest ? `Latest: ${latest.scoreLabel}` : "完成练习后自动更新"}
        />
        <SummaryCard
          title="Average Accuracy"
          value={averageAccuracy === null ? "-" : `${averageAccuracy}%`}
          detail="Reading / Listening 自动统计"
        />
        <SummaryCard
          title="Completed"
          value={`${history.length}`}
          detail="最多保留最近 50 次本地记录"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Weak areas</CardTitle>
          </CardHeader>
          <CardContent>
            {weakAreaCounts.length ? (
              <div className="space-y-3">
                {weakAreaCounts.map(([area, count]) => (
                  <div
                    key={area}
                    className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 p-3"
                  >
                    <span className="text-sm font-medium text-slate-950">
                      {area}
                    </span>
                    <Badge className="bg-white">{count}x</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="暂时没有弱项标签。完成一次提交后会自动生成。" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle>Result history</CardTitle>
              <div className="flex flex-wrap gap-2">
                {(["all", "reading", "listening", "writing"] as const).map(
                  (skill) => (
                    <Button
                      key={skill}
                      type="button"
                      size="sm"
                      variant={activeSkill === skill ? "default" : "outline"}
                      onClick={() => setActiveSkill(skill)}
                    >
                      {skill === "all" ? "All" : skillMeta[skill].label}
                    </Button>
                  ),
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredHistory.length ? (
              filteredHistory.map((item) => <ResultItem key={item.id} item={item} />)
            ) : (
              <EmptyState text="当前筛选下还没有记录。" />
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Target className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
        <p className="mt-2 text-xs text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}

function ResultItem({ item }: { item: PracticeHistoryItem }) {
  const meta = skillMeta[item.skill];
  const Icon = meta.icon;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>
              <Icon className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {meta.label}
            </Badge>
            <Badge className="bg-white">{item.scoreLabel}</Badge>
            <Badge className="bg-white">Band {item.bandEstimate.toFixed(1)}</Badge>
          </div>
          <h2 className="mt-3 text-sm font-semibold text-slate-950">
            {item.title}
          </h2>
          <p className="mt-2 text-xs text-slate-500">
            {item.detail} · {new Date(item.createdAt).toLocaleString()}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={meta.href}>
            继续练习
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      {item.weakAreas?.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {item.weakAreas.map((area) => (
            <Badge key={area} className="bg-amber-50 text-amber-800">
              {area}
            </Badge>
          ))}
        </div>
      ) : null}

      {item.nextAction ? (
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm leading-6 text-slate-600">
          下一步：{item.nextAction}
        </div>
      ) : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

function getWeakAreaCounts(history: PracticeHistoryItem[]) {
  const counts = new Map<string, number>();

  history.forEach((item) => {
    item.weakAreas?.forEach((area) => {
      counts.set(area, (counts.get(area) ?? 0) + 1);
    });
  });

  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}
