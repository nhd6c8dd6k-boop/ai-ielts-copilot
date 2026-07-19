"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Crown,
  Loader2,
  Save,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";

import { useI18n } from "@/components/i18n/language-provider";
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
import {
  getProfileHeroSummary,
  type ProfileHeroSummary,
} from "@/features/profile/hero-summary";
import {
  getBestScores,
  type BestScoreAttempt,
  type BestScores,
} from "@/features/profile/best-scores";

type ProfileSyncMode = "loading" | "local" | "supabase" | "anonymous" | "error";

type ApiProfile = {
  display_name?: string | null;
  target_band?: number | string | null;
  exam_date?: string | null;
  country?: string | null;
  timezone?: string | null;
  created_at?: string | null;
};

type ApiSubscription = {
  plan?: string | null;
  status?: string | null;
  started_at?: string | null;
  expires_at?: string | null;
  is_pro?: boolean;
};

type ApiUsage = {
  reading: {
    used: number;
    limit: number | null;
    unlimited: boolean;
  };
  listening: {
    used: number;
    limit: number | null;
    unlimited: boolean;
  };
  writing: {
    usedToday: number;
    limitToday: number | null;
    unlimited: boolean;
    resetsAt: string;
  };
};

type ApiBestScoreAttempt = {
  id?: string | null;
  skill?: string | null;
  band_estimate?: number | null;
};

type ApiAuthUser = {
  email?: string | null;
  created_at?: string | null;
  name?: string | null;
};

type ProfileApiResponse = {
  mode?: "demo" | "anonymous" | "supabase";
  profile?: ApiProfile | null;
  authUser?: ApiAuthUser | null;
  subscription?: ApiSubscription | null;
  subscription_error?: boolean;
  usage?: ApiUsage | null;
  practice_total?: number | null;
  practice_total_error?: boolean;
  best_score_attempts?: ApiBestScoreAttempt[] | null;
  best_scores_error?: boolean;
  error?: string;
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
  const { language, t } = useI18n();
  const [profile, setProfile] = useState<StudyProfile>(() => readStudyProfile());
  const [saved, setSaved] = useState(false);
  const [syncMode, setSyncMode] = useState<ProfileSyncMode>("loading");
  const [isSaving, setIsSaving] = useState(false);
  const [authUser, setAuthUser] = useState<ApiAuthUser | null>(null);
  const [profileCreatedAt, setProfileCreatedAt] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<ApiSubscription | null>(null);
  const [subscriptionError, setSubscriptionError] = useState(false);
  const [usage, setUsage] = useState<ApiUsage | null>(null);
  const [totalPractice, setTotalPractice] = useState<number | null>(null);
  const [totalPracticeError, setTotalPracticeError] = useState(false);
  const [bestScoreAttempts, setBestScoreAttempts] = useState<
    BestScoreAttempt[] | null
  >(null);
  const [bestScoresError, setBestScoresError] = useState(false);

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
          setAuthUser(payload.authUser ?? null);
          setProfileCreatedAt(payload.profile?.created_at ?? null);
          setSubscription(payload.subscription ?? null);
          setSubscriptionError(Boolean(payload.subscription_error));
          setUsage(payload.usage ?? null);
          setTotalPractice(payload.practice_total ?? null);
          setTotalPracticeError(Boolean(payload.practice_total_error));
          setBestScoreAttempts(
            (payload.best_score_attempts ?? []).map((attempt) => ({
              id: attempt.id,
              skill: attempt.skill,
              bandEstimate: attempt.band_estimate,
              overallBand:
                attempt.skill === "writing" ? attempt.band_estimate : null,
            })),
          );
          setBestScoresError(Boolean(payload.best_scores_error));
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

        setAuthUser(null);
        setProfileCreatedAt(null);
        setSubscription(null);
        setSubscriptionError(false);
        setUsage(null);
        setTotalPractice(0);
        setTotalPracticeError(false);
        setBestScoreAttempts([]);
        setBestScoresError(false);
        setSyncMode(payload.mode === "anonymous" ? "anonymous" : "local");
      } catch {
        if (isActive) {
          setSyncMode("error");
          setSubscriptionError(true);
          setTotalPracticeError(true);
          setBestScoreAttempts(null);
          setBestScoresError(true);
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

  const syncLabels: Record<ProfileSyncMode, string> = {
    loading: t("profile.sync.loading", "Checking sync status"),
    local: t("profile.sync.local", "Saved locally"),
    supabase: t("profile.sync.supabase", "Synced to account"),
    anonymous: t("profile.sync.anonymous", "Not signed in, saved locally"),
    error: t("profile.sync.error", "Cloud sync failed"),
  };

  const learningPreferences = [
    t("profile.preference.englishContent", "Practice content stays in English"),
    t("profile.preference.chineseSupport", "Chinese explanations and study advice"),
    t(
      "profile.preference.computerIelts",
      "Computer IELTS-style practice first",
    ),
  ];
  const subscriptionSummary = getSubscriptionSummary(subscription, t);
  const heroSummary = getProfileHeroSummary({
    profile: {
      displayName: profile.displayName,
      createdAt: profileCreatedAt,
    },
    authUser: {
      email: authUser?.email,
      createdAt: authUser?.created_at,
      name: authUser?.name,
    },
    subscription: subscription
      ? {
          isPro: subscription.is_pro,
        }
      : null,
    isMembershipLoading: syncMode === "loading",
    isMembershipError: subscriptionError || syncMode === "error",
    totalPracticeCount: totalPractice,
    isPracticeCountLoading: syncMode === "loading",
    isPracticeCountError: totalPracticeError || syncMode === "error",
    fallbackName: t("profile.hero.fallbackName", "IELTS learner"),
  });
  const bestScores = getBestScores(bestScoreAttempts);

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
        eyebrow={t("profile.eyebrow", "Profile")}
        title={t("profile.title", "Profile")}
        description={t(
          "profile.description",
          "Manage your target band, exam date, region, and membership. When signed in, your profile syncs to your account.",
        )}
      />

      {syncMode === "loading" ? (
        <ProfileHeroStatusCard
          icon="loading"
          title={t("profile.hero.loadingTitle", "Loading your overview")}
          description={t(
            "profile.hero.loadingDescription",
            "We are checking your account, membership, and completed practice history.",
          )}
        />
      ) : syncMode === "error" ? (
        <ProfileHeroStatusCard
          icon="error"
          title={t("profile.hero.errorTitle", "Profile overview unavailable")}
          description={t(
            "profile.hero.errorDescription",
            "We could not load your account overview. Please refresh the page or try again later.",
          )}
        />
      ) : (
        <ProfileHeroSummaryCard
          summary={heroSummary}
          language={language}
          t={t}
        />
      )}

      <BestScoresCard
        scores={bestScores}
        isLoading={syncMode === "loading"}
        hasError={bestScoresError || syncMode === "error"}
        t={t}
      />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>
                {t("profile.accountInformation", "Account information")}
              </CardTitle>
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
                <Label htmlFor="displayName">
                  {t("profile.displayName", "Display name")}
                </Label>
                <Input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(event) =>
                    updateProfile("displayName", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetBand">
                  {t("profile.targetBand", "Target band")}
                </Label>
                <Input
                  id="targetBand"
                  value={profile.targetBand}
                  onChange={(event) =>
                    updateProfile("targetBand", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">
                  {t("profile.examDate", "Exam date")}
                </Label>
                <Input
                  id="examDate"
                  type="date"
                  value={profile.examDate}
                  onChange={(event) => updateProfile("examDate", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">
                  {t("profile.country", "Country")}
                </Label>
                <Input
                  id="country"
                  value={profile.country}
                  onChange={(event) => updateProfile("country", event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="timezone">
                  {t("profile.timezone", "Timezone")}
                </Label>
                <Input
                  id="timezone"
                  value={profile.timezone}
                  onChange={(event) =>
                    updateProfile("timezone", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("profile.currentPlan", "Current Plan")}</Label>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={
                        subscriptionSummary.isPro
                          ? "bg-teal-50 text-teal-800"
                          : "bg-slate-100 text-slate-600"
                      }
                    >
                      {subscriptionSummary.planLabel}
                    </Badge>
                    {subscriptionSummary.statusLabel ? (
                      <span className="text-sm text-slate-600">
                        {subscriptionSummary.statusLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {subscriptionSummary.detail}
                  </p>
                  {!subscriptionSummary.isPro ? (
                    <Button asChild variant="outline" size="sm" className="mt-4">
                      <Link href="/pricing">
                        {t("profile.viewPro", "View Pro")}
                      </Link>
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={isSaving}>
                  <Save className="h-4 w-4" aria-hidden="true" />
                  {isSaving
                    ? t("profile.saving", "Saving")
                    : t("profile.saveProfile", "Save profile")}
                </Button>
                {saved ? (
                  <span className="ml-3 inline-flex items-center gap-1 text-sm text-teal-700">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {syncMode === "supabase"
                      ? t("profile.savedSynced", "Saved and synced")
                      : t("profile.savedLocal", "Saved locally")}
                  </span>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-1">
          <ProfileStat
            title={t("profile.targetBand", "Target band")}
            value={profile.targetBand || "-"}
            detail={t(
              "profile.targetBandDetail",
              "Your target band helps shape future practice recommendations.",
            )}
            icon={Target}
          />
          <ProfileStat
            title={t("profile.examCountdown", "Exam countdown")}
            value={
              daysUntilExam === null
                ? t("profile.notSet", "Not set")
                : daysUntilExam >= 0
                  ? t("profile.days", "{count} days").replace(
                      "{count}",
                      String(daysUntilExam),
                    )
                  : t("profile.past", "Past")
            }
            detail={
              profile.examDate ||
              t(
                "profile.examDateDetail",
                "Set an exam date to show the countdown.",
              )
            }
            icon={CalendarDays}
          />
          <ProfileStat
            title={t("profile.currentPlan", "Current Plan")}
            value={subscriptionSummary.planLabel}
            detail={subscriptionSummary.detail}
            icon={Crown}
          />
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{t("profile.usage", "Usage")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <ProfileUsageItem
              label="Reading"
              value={formatPracticeUsage(
                usage?.reading.used ?? 0,
                usage?.reading.limit ?? 5,
                Boolean(usage?.reading.unlimited),
                t,
              )}
            />
            <ProfileUsageItem
              label="Listening"
              value={formatPracticeUsage(
                usage?.listening.used ?? 0,
                usage?.listening.limit ?? 5,
                Boolean(usage?.listening.unlimited),
                t,
              )}
            />
            <ProfileUsageItem
              label="Writing"
              value={formatWritingUsage(
                usage?.writing.usedToday ?? 0,
                usage?.writing.limitToday ?? 1,
                Boolean(usage?.writing.unlimited),
                t,
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            {t("profile.practiceProgress", "Practice progress")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            {learningPreferences.map((item) => (
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

function ProfileUsageItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-950">{label}</p>
      <p className="mt-2 text-sm text-slate-600">{value}</p>
    </div>
  );
}

function BestScoresCard({
  scores,
  isLoading,
  hasError,
  t,
}: {
  scores: BestScores;
  isLoading: boolean;
  hasError: boolean;
  t: (key: string, fallback: string) => string;
}) {
  const items = [
    {
      key: "reading",
      label: t("profile.bestScores.reading", "Reading"),
      value: scores.reading,
    },
    {
      key: "listening",
      label: t("profile.bestScores.listening", "Listening"),
      value: scores.listening,
    },
    {
      key: "writing",
      label: t("profile.bestScores.writing", "Writing"),
      value: scores.writing,
    },
    {
      key: "personal-best",
      label: t("profile.bestScores.personalBest", "Personal Best"),
      value: scores.personalBest,
    },
  ];
  const noScoreLabel = t("profile.bestScores.noScoreYet", "No score yet");

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t("profile.bestScores.title", "Best Scores")}</CardTitle>
        <Trophy className="h-5 w-5 text-slate-400" aria-hidden="true" />
      </CardHeader>
      <CardContent aria-busy={isLoading}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.key}
              className="rounded-md border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-600">
                {item.label}
              </p>
              {isLoading ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                <p
                  className="mt-2 text-3xl font-semibold text-slate-950"
                  aria-label={
                    hasError || item.value === null ? noScoreLabel : undefined
                  }
                >
                  {hasError || item.value === null
                    ? "—"
                    : formatBestBand(item.value)}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileHeroStatusCard({
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
    <Card className="mb-6">
      <CardContent className="flex min-h-36 flex-col justify-center p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
            <Icon
              className={icon === "loading" ? "h-5 w-5 animate-spin" : "h-5 w-5"}
              aria-hidden="true"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileHeroSummaryCard({
  summary,
  language,
  t,
}: {
  summary: ProfileHeroSummary;
  language: "zh" | "en";
  t: (key: string, fallback: string) => string;
}) {
  const membershipLabel =
    summary.membershipStatus === "pro"
      ? t("profile.hero.proMember", "Pro Member")
      : summary.membershipStatus === "free"
        ? t("profile.hero.freeMember", "Free Member")
        : null;
  const formattedMemberSince = summary.memberSince
    ? formatMemberSince(summary.memberSince, language)
    : null;

  return (
    <Card className="mb-6 overflow-hidden">
      <CardContent className="grid gap-6 p-6 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-slate-950 text-white">
              <UserRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500">
                {t("profile.hero.overview", "Personal overview")}
              </p>
              <h2 className="mt-1 break-words text-2xl font-semibold leading-tight text-slate-950">
                {summary.displayName}
              </h2>
              {summary.email ? (
                <p className="mt-2 break-all text-sm text-slate-600">
                  {summary.email}
                </p>
              ) : null}
              {formattedMemberSince ? (
                <p className="mt-2 text-sm text-slate-500">
                  {t("profile.hero.memberSince", "Member since {date}").replace(
                    "{date}",
                    formattedMemberSince,
                  )}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">
              {t("profile.currentPlan", "Current Plan")}
            </p>
            {membershipLabel ? (
              <Badge
                className={
                  summary.membershipStatus === "pro"
                    ? "mt-3 bg-teal-50 text-teal-800"
                    : "mt-3 bg-white text-slate-700"
                }
              >
                {membershipLabel}
              </Badge>
            ) : (
              <p className="mt-3 text-lg font-semibold text-slate-950">-</p>
            )}
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">
              {t("profile.hero.totalPractice", "Total Practice")}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-950">
              {summary.totalPractice === null ? "-" : summary.totalPractice}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatBestBand(value: number | null) {
  return value === null ? "—" : value.toFixed(1);
}

function formatMemberSince(date: Date, language: "zh" | "en") {
  return new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en", {
    month: language === "zh" ? "numeric" : "short",
    year: "numeric",
  }).format(date);
}

function formatPracticeUsage(
  used: number,
  limit: number,
  unlimited: boolean,
  t: (key: string, fallback: string) => string,
) {
  if (unlimited) {
    return t("usage.unlimited", "Unlimited");
  }

  if (used > limit) {
    return t("usage.practiceOverLimit", "{used} completed · Free limit {limit}")
      .replace("{used}", String(used))
      .replace("{limit}", String(limit));
  }

  return t("usage.profilePractice", "{used} / {limit} different sets")
    .replace("{used}", String(used))
    .replace("{limit}", String(limit));
}

function formatWritingUsage(
  used: number,
  limit: number,
  unlimited: boolean,
  t: (key: string, fallback: string) => string,
) {
  if (unlimited) {
    return t("usage.unlimited", "Unlimited");
  }

  return t("usage.profileWriting", "{used} / {limit} today")
    .replace("{used}", String(used))
    .replace("{limit}", String(limit));
}

function getSubscriptionSummary(
  subscription: ApiSubscription | null,
  t: (key: string, fallback: string) => string,
) {
  const expiresAt = subscription?.expires_at
    ? new Date(subscription.expires_at)
    : null;
  const hasValidExpiry = Boolean(expiresAt && !Number.isNaN(expiresAt.getTime()));
  const isExpired = Boolean(
    subscription?.plan !== "free" &&
      subscription?.status !== "cancelled" &&
      subscription?.status !== "canceled" &&
      hasValidExpiry &&
      expiresAt &&
      expiresAt.getTime() <= Date.now(),
  );
  const isPro = Boolean(subscription?.is_pro && !isExpired);

  if (isPro) {
    const formattedExpiry =
      hasValidExpiry && expiresAt
        ? expiresAt.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        : null;

    return {
      isPro: true,
      planLabel: t("profile.plan.pro", "Pro"),
      statusLabel: formattedExpiry
        ? t("profile.activeUntil", "Active until {date}").replace(
            "{date}",
            formattedExpiry,
          )
        : t("profile.active", "Active"),
      detail: t(
          "profile.subscriptionDetailPro",
        "Your Pro access is active.",
      ),
    };
  }

  if (isExpired) {
    return {
      isPro: false,
      planLabel: t("profile.plan.expired", "Expired"),
      statusLabel: t("profile.expired", "Expired"),
      detail: t(
        "profile.subscriptionDetailExpired",
        "Your Pro access has expired. You can keep using the free plan.",
      ),
    };
  }

  return {
    isPro: false,
    planLabel: t("profile.plan.free", "Free"),
    statusLabel: null,
    detail: t(
      "profile.subscriptionDetail",
      "You are using the free plan. You can upgrade to Pro manually from the pricing page.",
    ),
  };
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
