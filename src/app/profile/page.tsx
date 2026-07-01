"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Crown, Save, Target } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  readStudyProfile,
  saveStudyProfile,
  type StudyProfile,
} from "@/features/profile/storage";

type ProfileSyncMode = "loading" | "local" | "supabase" | "anonymous" | "error";

type ApiProfile = {
  display_name?: string | null;
  target_band?: number | string | null;
  exam_date?: string | null;
  country?: string | null;
  timezone?: string | null;
};

type ProfileApiResponse = {
  mode?: "demo" | "anonymous" | "supabase";
  profile?: ApiProfile | null;
  error?: string;
};

const syncLabels: Record<ProfileSyncMode, string> = {
  loading: "正在检查同步状态",
  local: "本地保存",
  supabase: "已同步到账号",
  anonymous: "未登录，本地保存",
  error: "云端同步失败",
};

function mergeApiProfile(
  currentProfile: StudyProfile,
  apiProfile: ApiProfile | null | undefined,
): StudyProfile {
  if (!apiProfile) {
    return currentProfile;
  }

  return {
    ...currentProfile,
    displayName: apiProfile.display_name ?? currentProfile.displayName,
    targetBand:
      apiProfile.target_band === null || apiProfile.target_band === undefined
        ? currentProfile.targetBand
        : String(apiProfile.target_band),
    examDate: apiProfile.exam_date ?? currentProfile.examDate,
    country: apiProfile.country ?? currentProfile.country,
    timezone: apiProfile.timezone ?? currentProfile.timezone,
  };
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<StudyProfile>(() => readStudyProfile());
  const [saved, setSaved] = useState(false);
  const [syncMode, setSyncMode] = useState<ProfileSyncMode>("loading");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadProfile() {
      try {
        const response = await fetch("/api/profile", { cache: "no-store" });
        const payload = (await response.json()) as ProfileApiResponse;

        if (!isActive) {
          return;
        }

        if (!response.ok) {
          setSyncMode("error");
          return;
        }

        if (payload.mode === "supabase") {
          setProfile((currentProfile) => {
            const nextProfile = mergeApiProfile(
              currentProfile,
              payload.profile,
            );
            saveStudyProfile(nextProfile);
            return nextProfile;
          });
          setSyncMode("supabase");
          return;
        }

        setSyncMode(payload.mode === "anonymous" ? "anonymous" : "local");
      } catch {
        if (isActive) {
          setSyncMode("error");
        }
      }
    }

    void loadProfile();

    return () => {
      isActive = false;
    };
  }, []);

  const daysUntilExam = useMemo(() => {
    if (!profile.examDate) {
      return null;
    }

    const today = new Date();
    const examDate = new Date(`${profile.examDate}T00:00:00`);
    const diff = examDate.getTime() - today.getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [profile.examDate]);

  const updateProfile = <Key extends keyof StudyProfile>(
    key: Key,
    value: StudyProfile[Key],
  ) => {
    setSaved(false);
    setProfile((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submitProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveStudyProfile(profile);
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          displayName: profile.displayName,
          targetBand: profile.targetBand,
          examDate: profile.examDate,
          country: profile.country,
          timezone: profile.timezone,
        }),
      });
      const payload = (await response.json()) as ProfileApiResponse;

      if (response.status === 401) {
        setSyncMode("anonymous");
      } else if (!response.ok) {
        setSyncMode("error");
      } else if (payload.mode === "supabase") {
        setSyncMode("supabase");
      } else {
        setSyncMode(payload.mode === "anonymous" ? "anonymous" : "local");
      }

      setSaved(true);
    } catch {
      setSyncMode("error");
      setSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Profile"
        title="个人学习资料"
        description="保存目标分、考试日期、地区和会员状态。未登录时保存在本机，登录后会同步到账号。"
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Candidate details</CardTitle>
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
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={submitProfile}>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="displayName">Display name</Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(event) =>
                    updateProfile("displayName", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetBand">Target band</Label>
                <Input
                  id="targetBand"
                  value={profile.targetBand}
                  onChange={(event) =>
                    updateProfile("targetBand", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam date</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={profile.examDate}
                  onChange={(event) => updateProfile("examDate", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={profile.country}
                  onChange={(event) => updateProfile("country", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={profile.timezone}
                  onChange={(event) =>
                    updateProfile("timezone", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="plan">Membership</Label>
                <select
                  id="plan"
                  value={profile.plan}
                  onChange={(event) =>
                    updateProfile("plan", event.target.value as StudyProfile["plan"])
                  }
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                >
                  <option>Free</option>
                  <option>Pro Monthly</option>
                  <option>Pro Yearly</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {isSaving ? "保存中" : "保存资料"}
                </Button>
                {saved ? (
                  <span className="ml-3 inline-flex items-center gap-1 text-sm text-teal-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {syncMode === "supabase" ? "已保存并同步" : "已保存到本地"}
                  </span>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <ProfileStat
            title="Target Band"
            value={profile.targetBand || "-"}
            detail="目标分会用于后续自适应推荐"
            icon={Target}
          />
          <ProfileStat
            title="Exam Countdown"
            value={
              daysUntilExam === null
                ? "Not set"
                : daysUntilExam >= 0
                  ? `${daysUntilExam} days`
                  : "Past"
            }
            detail={profile.examDate || "设置考试日期后显示倒计时"}
            icon={CalendarDays}
          />
          <ProfileStat
            title="Membership"
            value={profile.plan}
            detail="Stripe 接入后会自动同步真实订阅状态"
            icon={Crown}
          />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Learning preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              "题目保持英文",
              "中文解析和学习建议",
              "优先电脑雅思模拟体验",
            ].map((item) => (
              <div
                key={item}
                className="rounded-md border border-slate-200 bg-slate-50 p-4"
              >
                <Badge className="bg-white">{item}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}

function ProfileStat({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof Target;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold text-slate-950">{value}</div>
        <p className="mt-2 text-xs text-slate-500">{detail}</p>
      </CardContent>
    </Card>
  );
}
