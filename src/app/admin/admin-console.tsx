"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Activity,
  Crown,
  Eye,
  FileCheck2,
  Headphones,
  ListChecks,
  Loader2,
  MessageSquareText,
  Pencil,
  ShieldCheck,
  Trash2,
  Users,
  WandSparkles,
  X,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WritingTaskVisual } from "@/components/writing/writing-task-visual";
import type {
  AdminContentItem,
  AdminContentStatus,
  AdminContentType,
  AdminDashboardData,
  AdminMembershipItem,
  AdminUserActivityItem,
} from "@/server/services/admin-dashboard";
import { readingBands, readingQuestionTypes, readingTopics } from "@/features/ai-reading/constants";
import {
  listeningQuestionTypes,
  listeningSections,
  listeningTopics,
} from "@/features/ai-listening/constants";
import {
  writingTaskTypes,
  writingTopics,
} from "@/features/ai-writing/constants";

type AdminTab =
  | "generate"
  | "content"
  | "users"
  | "userActivity"
  | "memberships"
  | "prompts"
  | "logs";
type GenerateMode = "reading" | "listening" | "writing";
type MembershipAction = "grant" | "extend" | "revoke";
type MembershipModalState = {
  action: MembershipAction;
  user: AdminMembershipItem;
};

const contentTypeTabs: Array<{
  type: AdminContentType;
  label: string;
}> = [
  { type: "reading", label: "Reading" },
  { type: "listening", label: "Listening" },
  { type: "writing", label: "Writing" },
];

type GenerateApiResponse = {
  results: Array<{
    id: string;
    title: string;
    band: number;
    topic: string;
    status: "pending_review";
  }>;
  usage: {
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
};

type GenerateAudioApiResponse =
  | {
      ok: true;
      id: string;
      title: string;
      audioStatus: "ready";
      audioUrl: string;
      usage: {
        model: string;
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        estimatedCost: number;
      };
    }
  | {
      error?: string;
    };

type AdminReviewQuestion = {
  id: string;
  number: number;
  type: string;
  prompt: string;
  options: unknown[];
  metadata: unknown;
  correctAnswer: string;
  acceptableAnswers: string[];
  explanationZh: string | null;
  explanationEn: string | null;
  synonyms: unknown[];
  vocabulary: unknown[];
};

type AdminContentDetail =
  | {
      type: "reading";
      content: {
        id: string;
        title: string;
        topic: string;
        band: number;
        lengthWords: number;
        passage: string;
        source: string;
        status: AdminContentStatus;
        createdAt: string;
        updatedAt: string;
        questions: AdminReviewQuestion[];
      };
    }
  | {
      type: "listening";
      content: {
        id: string;
        title: string;
        topic: string;
        band: number | null;
        section: number;
        script: string;
        audioUrl: string | null;
        audioStatus: string;
        ttsVoiceMapping: unknown;
        source: string;
        status: AdminContentStatus;
        createdAt: string;
        updatedAt: string;
        questions: AdminReviewQuestion[];
      };
    }
  | {
      type: "writing";
      content: {
        id: string;
        title: string;
        taskType: number;
        topic: string;
        prompt: string;
        visualData: unknown;
        bandTarget: number | null;
        suggestedTimeMinutes: number;
        minimumWords: number;
        sampleAnswerBand7: string | null;
        sampleAnswerBand8: string | null;
        sampleAnswerBand9: string | null;
        scoringNotes: unknown;
        source: string;
        status: AdminContentStatus;
        createdAt: string;
        updatedAt: string;
      };
    };

type AdminEditDraft =
  | {
      type: "reading";
      id: string;
      title: string;
      band: string;
      topic: string;
      passage: string;
      questionsJson: string;
    }
  | {
      type: "listening";
      id: string;
      title: string;
      band: string;
      topic: string;
      section: string;
      script: string;
      questionsJson: string;
      audioStatus: string;
      audioUrl: string | null;
      ttsVoiceMapping: unknown;
    }
  | {
      type: "writing";
      id: string;
      taskType: string;
      bandTarget: string;
      topic: string;
      prompt: string;
      sampleAnswerBand7: string;
      sampleAnswerBand8: string;
      sampleAnswerBand9: string;
      scoringNotesJson: string;
      visualDataJson: string;
    };

type PublishValidationResponse =
  | { ok: true }
  | {
      error?: string;
      validation?: {
        errors: string[];
        warnings: string[];
      };
    };

type PublishChecklistItem = {
  label: string;
  status: "pass" | "warning" | "fail";
  message: string;
};

const demoContent: AdminContentItem[] = [
  {
    id: "reading-urban-learning",
    type: "reading",
    title: "The quiet redesign of urban learning",
    skill: "Reading",
    source: "AI Generated",
    status: "review",
  },
  {
    id: "listening-student-housing",
    type: "listening",
    title: "Student services conversation",
    skill: "Listening",
    source: "AI Generated",
    status: "review",
  },
  {
    id: "writing-ai-education",
    type: "writing",
    title: "Task 2: AI in education and work",
    skill: "Writing",
    source: "Admin Original",
    status: "published",
  },
];

const users = [
  ["michael@example.com", "Pro Monthly", "Active"],
  ["student.demo@example.com", "Free", "Active"],
  ["reviewer@example.com", "Admin", "Active"],
];

const demoUserActivity: AdminUserActivityItem[] = [
  {
    userId: "demo-student",
    email: "student.demo@example.com",
    signedUpAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    readingAttempts: 1,
    listeningAttempts: 1,
    writingAttempts: 0,
    totalAttempts: 2,
    latestAttemptType: "Listening",
    latestAttemptScore: "Band 6.5",
    betaRewardEligible: true,
  },
  {
    userId: "new-user",
    email: "new.user@example.com",
    signedUpAt: new Date().toISOString(),
    lastActivityAt: null,
    readingAttempts: 0,
    listeningAttempts: 0,
    writingAttempts: 0,
    totalAttempts: 0,
    latestAttemptType: null,
    latestAttemptScore: null,
    betaRewardEligible: false,
  },
];

const demoMemberships: AdminMembershipItem[] = [
  {
    userId: "demo-student",
    email: "student.demo@example.com",
    signedUpAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    plan: "pro",
    status: "active",
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
    grantedBy: null,
    notes: "Demo manual grant",
    isPro: true,
    isExpired: false,
  },
];

const prompts = [
  ["reading-generator", "v1", "English questions, Chinese explanations"],
  ["writing-grader", "v1", "IELTS criteria estimate with bilingual feedback"],
  ["listening-generator", "v1", "English script and answer key"],
];

const demoData: AdminDashboardData = {
  content: demoContent,
  users,
  userActivity: demoUserActivity,
  memberships: demoMemberships,
  prompts,
  promptTemplates: [],
  logs: ["Admin console opened", "Demo prompt templates loaded"],
};

export function AdminConsole({
  mode,
  adminEmail,
  data = demoData,
}: {
  mode: "demo" | "admin";
  adminEmail?: string | null;
  data?: AdminDashboardData;
}) {
  const [activeTab, setActiveTab] = useState<AdminTab>("generate");
  const [content, setContent] = useState(data.content);
  const [memberships, setMemberships] = useState(data.memberships);
  const [membershipSearch, setMembershipSearch] = useState("");
  const [membershipModal, setMembershipModal] =
    useState<MembershipModalState | null>(null);
  const [isMembershipSaving, setIsMembershipSaving] = useState(false);
  const [activeContentType, setActiveContentType] =
    useState<AdminContentType>("reading");
  const [logs, setLogs] = useState<string[]>(data.logs);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);
  const [isAudioGeneratingId, setIsAudioGeneratingId] = useState<string | null>(
    null,
  );
  const [isDetailLoadingId, setIsDetailLoadingId] = useState<string | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] =
    useState<AdminContentItem | null>(null);
  const [contentDetail, setContentDetail] = useState<AdminContentDetail | null>(
    null,
  );
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<AdminEditDraft | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingDetail, setIsSavingDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generateMode, setGenerateMode] = useState<GenerateMode>("reading");
  const [band, setBand] = useState(7);
  const [topic, setTopic] = useState("education");
  const [section, setSection] = useState(1);
  const [taskType, setTaskType] = useState(2);
  const [quantity, setQuantity] = useState(1);
  const [promptTemplateId, setPromptTemplateId] = useState("");
  const [readingTypes, setReadingTypes] = useState<string[]>([
    "multiple_choice",
    "true_false_not_given",
    "sentence_completion",
  ]);
  const [listeningTypes, setListeningTypes] = useState<string[]>([
    "form_completion",
    "multiple_choice",
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResult, setGenerationResult] =
    useState<GenerateApiResponse | null>(null);

  const counts = useMemo(
    () => ({
      content: content.length,
      review: content.filter((item) => item.status === "review").length,
      users: data.users.length,
      prompts: data.prompts.length,
    }),
    [content, data.prompts.length, data.users.length],
  );
  const contentTypeCounts = useMemo(
    () =>
      contentTypeTabs.reduce(
        (result, tab) => ({
          ...result,
          [tab.type]: content.filter((item) => item.type === tab.type).length,
        }),
        {} as Record<AdminContentType, number>,
      ),
    [content],
  );
  const filteredContent = useMemo(
    () => content.filter((item) => item.type === activeContentType),
    [activeContentType, content],
  );
  const filteredMemberships = useMemo(() => {
    const normalizedSearch = membershipSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return memberships;
    }

    return memberships.filter((membership) =>
      membership.email.toLowerCase().includes(normalizedSearch),
    );
  }, [membershipSearch, memberships]);

  const updateContentStatus = async (
    item: AdminContentItem,
    status: AdminContentStatus,
  ) => {
    setError(null);

    if (mode === "admin") {
      setIsMutatingId(item.id);

      try {
        const response = await fetch("/api/admin/content", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
            status,
          }),
        });

        const payload = (await response.json()) as PublishValidationResponse;

        if (!response.ok || !("ok" in payload)) {
          const validationMessage =
            "validation" in payload && payload.validation
              ? [
                  ...(payload.validation.errors ?? []),
                  ...(payload.validation.warnings ?? []).map(
                    (warning) => `Warning: ${warning}`,
                  ),
                ].join(" ")
              : "";

          throw new Error(
            validationMessage ||
              ("error" in payload && payload.error
                ? payload.error
                : "Content update failed."),
          );
        }
      } catch (mutationError) {
        const message =
          mutationError instanceof Error
            ? mutationError.message
            : "Content update failed.";

        setError(message);
        setToastMessage(message);
        setIsMutatingId(null);
        return;
      }

      setIsMutatingId(null);
    }

    setContent((current) =>
      current.map((contentItem) =>
        contentItem.id === item.id ? { ...contentItem, status } : contentItem,
      ),
    );
    setLogs((current) => [`${item.title} marked as ${status}`, ...current]);
  };

  const deleteContent = async (item: AdminContentItem) => {
    setError(null);

    if (mode === "admin") {
      setIsMutatingId(item.id);

      try {
        const response = await fetch("/api/admin/content", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: item.id,
            type: item.type,
          }),
        });

        if (!response.ok) {
          throw new Error("Content delete failed.");
        }
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Content delete failed.",
        );
        setIsMutatingId(null);
        return;
      }

      setIsMutatingId(null);
    }

    setContent((current) =>
      current.filter((contentItem) => contentItem.id !== item.id),
    );
    setLogs((current) => [`${item.title} deleted`, ...current]);
  };

  const loadContentDetail = async (item: AdminContentItem) => {
    const response = await fetch(
      `/api/admin/content/detail?type=${item.type}&id=${item.id}`,
      { cache: "no-store" },
    );
    const payload = (await response.json()) as AdminContentDetail | { error?: string };

    if (!response.ok) {
      throw new Error(
        "error" in payload && payload.error
          ? payload.error
          : "Failed to load content detail.",
      );
    }

    if (!("content" in payload)) {
      throw new Error("Failed to load content detail.");
    }

    return payload;
  };

  const viewContentDetail = async (item: AdminContentItem) => {
    setSelectedDetailItem(item);
    setContentDetail(null);
    setDetailError(null);
    setEditDraft(null);
    setEditError(null);
    setIsDetailLoadingId(item.id);

    if (mode !== "admin") {
      setIsDetailLoadingId(null);
      setDetailError("Content detail is available after admin login.");
      return;
    }

    try {
      const payload = await loadContentDetail(item);
      setContentDetail(payload);
    } catch (viewError) {
      setDetailError(
        viewError instanceof Error
          ? viewError.message
          : "Failed to load content detail.",
      );
    } finally {
      setIsDetailLoadingId(null);
    }
  };

  const editContentDetail = async (item: AdminContentItem) => {
    setSelectedDetailItem(item);
    setContentDetail(null);
    setDetailError(null);
    setEditDraft(null);
    setEditError(null);
    setIsDetailLoadingId(item.id);

    if (mode !== "admin") {
      setIsDetailLoadingId(null);
      setDetailError("Content detail is available after admin login.");
      return;
    }

    try {
      const payload = await loadContentDetail(item);
      setContentDetail(payload);
      setEditDraft(createEditDraft(payload));
    } catch (viewError) {
      setDetailError(
        viewError instanceof Error
          ? viewError.message
          : "Failed to load content detail.",
      );
    } finally {
      setIsDetailLoadingId(null);
    }
  };

  const saveContentDetail = async () => {
    if (!editDraft || !selectedDetailItem) {
      return;
    }

    setEditError(null);
    setIsSavingDetail(true);

    try {
      const payload = buildEditPatchPayload(editDraft);
      const response = await fetch("/api/admin/content/detail", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as
        | {
            ok: true;
            changedFields: string[];
            audioStatus?: string | null;
            audioUrl?: string | null;
          }
        | { error?: string };

      if (!response.ok || !("ok" in result)) {
        throw new Error(
          "error" in result && result.error
            ? result.error
            : "Content update failed.",
        );
      }

      const refreshed = await loadContentDetail(selectedDetailItem);
      setContentDetail(refreshed);
      setEditDraft(null);
      setContent((current) =>
        current.map((contentItem) =>
          contentItem.id === selectedDetailItem.id
            ? {
                ...contentItem,
                title: refreshed.content.title,
                audioStatus:
                  refreshed.type === "listening"
                    ? refreshed.content.audioStatus
                    : contentItem.audioStatus,
                audioUrl:
                  refreshed.type === "listening"
                    ? refreshed.content.audioUrl
                    : contentItem.audioUrl,
              }
            : contentItem,
        ),
      );
      setLogs((current) => [
        `${selectedDetailItem.title} updated · ${
          result.changedFields.length ? result.changedFields.join(", ") : "saved"
        }`,
        ...current,
      ]);
      setToastMessage("Content updated. Review status was preserved.");
    } catch (saveError) {
      setEditError(
        saveError instanceof Error ? saveError.message : "Content update failed.",
      );
    } finally {
      setIsSavingDetail(false);
    }
  };

  const generateListeningAudio = async (
    item: AdminContentItem,
    regenerateWithNewVoices = false,
  ) => {
    if (item.type !== "listening") {
      return;
    }

    setError(null);
    setToastMessage(null);

    if (mode !== "admin") {
      setToastMessage("Audio generation is available after admin login.");
      return;
    }

    setIsAudioGeneratingId(item.id);

    try {
      const response = await fetch("/api/admin/listening/generate-audio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listening_set_id: item.id,
          regenerate_with_new_voices: regenerateWithNewVoices,
        }),
      });
      const payload = (await response.json()) as GenerateAudioApiResponse;

      if (!response.ok || !("ok" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Audio generation failed.",
        );
      }

      setContent((current) =>
        current.map((contentItem) =>
          contentItem.id === item.id
            ? {
                ...contentItem,
                audioStatus: payload.audioStatus,
                audioUrl: payload.audioUrl,
              }
            : contentItem,
        ),
      );
      setLogs((current) => [
        `${item.title} audio generated${
          regenerateWithNewVoices ? " with new voices" : ""
        }`,
        ...current,
      ]);
      setToastMessage(
        `Audio ready${
          regenerateWithNewVoices ? " · new voices" : ""
        } · ${payload.usage.totalTokens} estimated input tokens · $${payload.usage.estimatedCost.toFixed(
          4,
        )}`,
      );
    } catch (audioError) {
      const message =
        audioError instanceof Error
          ? audioError.message
          : "Audio generation failed.";

      setError(message);
      setToastMessage(message);
    } finally {
      setIsAudioGeneratingId(null);
    }
  };

  const saveMembershipAction = async ({
    action,
    user,
    durationDays,
    customExpiryDate,
    notes,
  }: {
    action: MembershipAction;
    user: AdminMembershipItem;
    durationDays: number;
    customExpiryDate?: string;
    notes?: string;
  }) => {
    setError(null);
    setToastMessage(null);

    if (mode !== "admin") {
      setToastMessage("Membership management is available after admin login.");
      setMembershipModal(null);
      return;
    }

    setIsMembershipSaving(true);

    try {
      const body: Record<string, unknown> = {
        action,
        targetUserId: user.userId,
        notes,
      };

      if (action === "grant") {
        if (customExpiryDate) {
          body.customExpiry = new Date(
            `${customExpiryDate}T23:59:59`,
          ).toISOString();
        } else {
          body.durationDays = durationDays;
        }
      }

      if (action === "extend") {
        body.durationDays = durationDays;
      }

      const response = await fetch("/api/admin/memberships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as
        | { ok: true; memberships: AdminMembershipItem[] }
        | { error?: string };

      if (!response.ok || !("ok" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Membership update failed.",
        );
      }

      setMemberships(payload.memberships);
      setLogs((current) => [
        `${user.email} · ${formatMembershipAction(action)}`,
        ...current,
      ]);
      setToastMessage(`${user.email} membership updated.`);
      setMembershipModal(null);
    } catch (membershipError) {
      const message =
        membershipError instanceof Error
          ? membershipError.message
          : "Membership update failed.";

      setError(message);
      setToastMessage(message);
    } finally {
      setIsMembershipSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="Admin"
        title="运营管理后台"
        description="审核 AI 内容、管理 Prompt、查看用户订阅和操作日志。上线后仅 admin 角色可以访问。"
      />

      <div className="mb-6 rounded-md border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-950">
                {mode === "admin" ? "Admin access verified" : "Demo admin preview"}
              </p>
              <p className="text-xs text-slate-500">
                {mode === "admin"
                  ? adminEmail
                  : "Supabase 未配置时保留本地后台预览。"}
              </p>
            </div>
          </div>
          <Badge className={mode === "admin" ? "bg-teal-50 text-teal-800" : "bg-amber-50 text-amber-800"}>
            {mode === "admin" ? "Protected" : "Demo"}
          </Badge>
        </div>
      </div>

      {error ? (
        <div className="mb-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Content", `${counts.content}`, FileCheck2],
          ["Needs Review", `${counts.review}`, ListChecks],
          ["Users", `${counts.users}`, Users],
          ["Prompts", `${counts.prompts}`, MessageSquareText],
        ].map(([label, value, Icon]) => (
          <Card key={label as string}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {label as string}
              </CardTitle>
              <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold text-slate-950">
                {value as string}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ["generate", "Generate"],
          ["content", "Content"],
          ["users", "Users"],
          ["userActivity", "User Activity"],
          ["memberships", "Memberships"],
          ["prompts", "Prompts"],
          ["logs", "Logs"],
        ].map(([value, label]) => (
          <Button
            key={value}
            type="button"
            variant={activeTab === value ? "default" : "outline"}
            onClick={() => setActiveTab(value as AdminTab)}
          >
            {label}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === "generate" ? (
          <GeneratePanel
            mode={generateMode}
            setMode={setGenerateMode}
            band={band}
            setBand={setBand}
            topic={topic}
            setTopic={setTopic}
            section={section}
            setSection={setSection}
            taskType={taskType}
            setTaskType={setTaskType}
            quantity={quantity}
            setQuantity={setQuantity}
            promptTemplateId={promptTemplateId}
            setPromptTemplateId={setPromptTemplateId}
            promptTemplates={data.promptTemplates}
            readingTypes={readingTypes}
            setReadingTypes={setReadingTypes}
            listeningTypes={listeningTypes}
            setListeningTypes={setListeningTypes}
            isGenerating={isGenerating}
            result={generationResult}
            onViewDrafts={() => setActiveTab("content")}
            onGenerate={async () => {
              setError(null);
              setToastMessage(null);
              setIsGenerating(true);

              try {
                const response = await fetch(`/api/admin/generate/${generateMode}`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(
                    buildGeneratePayload({
                      mode: generateMode,
                      band,
                      topic,
                      section,
                      taskType,
                      quantity,
                      promptTemplateId,
                      readingTypes,
                      listeningTypes,
                    }),
                  ),
                });
                const payload = (await response.json()) as
                  | GenerateApiResponse
                  | { error?: string };

                if (!response.ok || !("results" in payload)) {
                  throw new Error(
                    "error" in payload && payload.error
                      ? payload.error
                      : "AI generation failed.",
                  );
                }

                setGenerationResult(payload);
                setContent((current) => [
                  ...payload.results.map((item) => ({
                    id: item.id,
                    type: generateMode,
                    title: item.title,
                    skill:
                      generateMode === "reading"
                        ? ("Reading" as const)
                        : generateMode === "listening"
                          ? ("Listening" as const)
                          : ("Writing" as const),
                    source: "AI Generated",
                    status: "review" as const,
                    audioStatus:
                      generateMode === "listening" ? "pending" : undefined,
                  })),
                  ...current,
                ]);
                setLogs((current) => [
                  `${generateMode} generated · ${payload.results.length} draft(s)`,
                  ...current,
                ]);
                setToastMessage("AI 内容已生成并进入 pending review。");
              } catch (generationError) {
                const message =
                  generationError instanceof Error
                    ? generationError.message
                    : "AI generation failed.";

                setError(message);
                setToastMessage(message);
              } finally {
                setIsGenerating(false);
              }
            }}
          />
        ) : null}

        {activeTab === "content" ? (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <CardTitle>Content review queue</CardTitle>
                <div className="flex max-w-full gap-2 overflow-x-auto rounded-md bg-slate-100 p-1">
                  {contentTypeTabs.map((tab) => {
                    const isActive = activeContentType === tab.type;

                    return (
                      <button
                        key={tab.type}
                        type="button"
                        className={
                          isActive
                            ? "whitespace-nowrap rounded px-3 py-2 text-sm font-medium text-white bg-slate-950"
                            : "whitespace-nowrap rounded px-3 py-2 text-sm font-medium text-slate-600 hover:bg-white hover:text-slate-950"
                        }
                        onClick={() => setActiveContentType(tab.type)}
                      >
                        {tab.label} ({contentTypeCounts[tab.type]})
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredContent.length ? (
                filteredContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge>{item.skill}</Badge>
                        <Badge className="bg-white">{item.source}</Badge>
                        <Badge
                          className={
                            item.status === "published"
                              ? "bg-teal-50 text-teal-800"
                              : item.status === "archived"
                                ? "bg-slate-100 text-slate-500"
                                : "bg-amber-50 text-amber-800"
                          }
                        >
                          {formatContentStatus(item.status)}
                        </Badge>
                        {item.type === "listening" ? (
                          <Badge className="bg-slate-50 text-slate-700">
                            <Headphones
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            {formatAudioStatus(item.audioStatus)}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-950">
                        {item.title}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDetailLoadingId === item.id}
                        onClick={() => viewContentDetail(item)}
                      >
                        {isDetailLoadingId === item.id ? (
                          <Loader2
                            className="h-4 w-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isDetailLoadingId === item.id}
                        onClick={() => editContentDetail(item)}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                        Edit
                      </Button>
                      {item.type === "listening" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            isMutatingId === item.id ||
                            isAudioGeneratingId === item.id
                          }
                          onClick={() => generateListeningAudio(item)}
                        >
                          {isAudioGeneratingId === item.id ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Headphones className="h-4 w-4" aria-hidden="true" />
                          )}
                          {item.audioStatus === "ready"
                            ? "Regenerate Audio"
                            : "Generate Audio"}
                        </Button>
                      ) : null}
                      {item.type === "listening" &&
                      item.audioStatus === "ready" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={
                            isMutatingId === item.id ||
                            isAudioGeneratingId === item.id
                          }
                          onClick={() => generateListeningAudio(item, true)}
                        >
                          {isAudioGeneratingId === item.id ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Headphones className="h-4 w-4" aria-hidden="true" />
                          )}
                          Regenerate with new voices
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isMutatingId === item.id}
                        onClick={() => updateContentStatus(item, "published")}
                      >
                        Publish
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isMutatingId === item.id}
                        onClick={() => updateContentStatus(item, "archived")}
                      >
                        Archive
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isMutatingId === item.id}
                        onClick={() => deleteContent(item)}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-sm font-medium text-slate-950">
                    No{" "}
                    {
                      contentTypeTabs.find(
                        (tab) => tab.type === activeContentType,
                      )?.label
                    }{" "}
                    content yet.
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Generate or create content, then it will appear in this
                    category.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}

        {activeTab === "users" ? (
          <DataTable
            title="Users and subscriptions"
            headers={["Email", "Plan", "Status"]}
            rows={data.users}
          />
        ) : null}

        {activeTab === "userActivity" ? (
          <UserActivityTable rows={data.userActivity} />
        ) : null}

        {activeTab === "memberships" ? (
          <MembershipsTable
            rows={filteredMemberships}
            search={membershipSearch}
            onSearchChange={setMembershipSearch}
            onOpenAction={(action, user) => setMembershipModal({ action, user })}
          />
        ) : null}

        {activeTab === "prompts" ? (
          <DataTable
            title="Prompt templates"
            headers={["Name", "Version", "Policy"]}
            rows={data.prompts}
          />
        ) : null}

        {activeTab === "logs" ? (
          <Card>
            <CardHeader>
              <CardTitle>Admin logs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs.map((log, index) => (
                <div
                  key={`${log}-${index}`}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                >
                  <Activity className="h-4 w-4 text-slate-400" aria-hidden="true" />
                  {log}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}
      </div>

      {toastMessage ? (
        <div className="fixed right-4 top-4 z-50 max-w-sm rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
          {toastMessage}
        </div>
      ) : null}

      {selectedDetailItem ? (
        <AdminContentDetailModal
          item={selectedDetailItem}
          detail={contentDetail}
          error={detailError}
          isLoading={isDetailLoadingId === selectedDetailItem.id}
          onClose={() => {
            setSelectedDetailItem(null);
            setContentDetail(null);
            setDetailError(null);
            setEditDraft(null);
            setEditError(null);
          }}
          editDraft={editDraft}
          editError={editError}
          isSaving={isSavingDetail}
          onEdit={() => {
            if (contentDetail) {
              setEditDraft(createEditDraft(contentDetail));
              setEditError(null);
            }
          }}
          onCancelEdit={() => {
            setEditDraft(null);
            setEditError(null);
          }}
          onChangeEditDraft={setEditDraft}
          onSave={saveContentDetail}
          onPublish={() => updateContentStatus(selectedDetailItem, "published")}
          onArchive={() => updateContentStatus(selectedDetailItem, "archived")}
          onDelete={() => {
            void deleteContent(selectedDetailItem);
            setSelectedDetailItem(null);
            setContentDetail(null);
            setDetailError(null);
          }}
          isMutating={isMutatingId === selectedDetailItem.id}
        />
      ) : null}

      {membershipModal ? (
        <MembershipActionModal
          state={membershipModal}
          isSaving={isMembershipSaving}
          onClose={() => setMembershipModal(null)}
          onSave={saveMembershipAction}
        />
      ) : null}
    </AppShell>
  );
}

function AdminContentDetailModal({
  item,
  detail,
  error,
  isLoading,
  isMutating,
  editDraft,
  editError,
  isSaving,
  onClose,
  onEdit,
  onCancelEdit,
  onChangeEditDraft,
  onSave,
  onPublish,
  onArchive,
  onDelete,
}: {
  item: AdminContentItem;
  detail: AdminContentDetail | null;
  error: string | null;
  isLoading: boolean;
  isMutating: boolean;
  editDraft: AdminEditDraft | null;
  editError: string | null;
  isSaving: boolean;
  onClose: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onChangeEditDraft: (draft: AdminEditDraft) => void;
  onSave: () => void;
  onPublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const isEditing = Boolean(editDraft);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-4">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-6xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{item.skill}</Badge>
              <Badge className="bg-white">{item.source}</Badge>
              <Badge className="bg-amber-50 text-amber-800">
                {detail ? formatContentStatus(detail.content.status) : item.status}
              </Badge>
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-950">
              {detail?.content.title ?? item.title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Admin review detail · {item.type}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={isEditing ? onCancelEdit : onEdit}
              disabled={!detail || isLoading || isSaving}
            >
              <Pencil className="h-4 w-4" aria-hidden="true" />
              {isEditing ? "Cancel Edit" : "Edit"}
            </Button>
            {isEditing ? (
              <Button
                type="button"
                size="sm"
                disabled={isSaving}
                onClick={onSave}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isMutating || isEditing}
              onClick={onPublish}
            >
              Publish
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isMutating || isEditing}
              onClick={onArchive}
            >
              Archive
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isMutating || isEditing}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-6 w-48 rounded-md bg-slate-100" />
              <div className="h-28 rounded-md bg-slate-100" />
              <div className="h-28 rounded-md bg-slate-100" />
            </div>
          ) : null}

          {error ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          {editError ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {editError}
            </div>
          ) : null}

          {!isLoading && !error && detail && editDraft ? (
            <div className="space-y-6">
              <PublishChecklist detail={detail} />
              <AdminContentEditForm
                draft={editDraft}
                onChange={onChangeEditDraft}
              />
            </div>
          ) : null}

          {!isLoading && !error && detail && !editDraft ? (
            <div className="space-y-6">
              <DetailMeta detail={detail} />
              <PublishChecklist detail={detail} />
              {detail.type === "reading" ? (
                <ReadingDetail detail={detail} />
              ) : null}
              {detail.type === "listening" ? (
                <ListeningDetail detail={detail} />
              ) : null}
              {detail.type === "writing" ? (
                <WritingDetail detail={detail} />
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function PublishChecklist({ detail }: { detail: AdminContentDetail }) {
  const checklist = getPublishChecklist(detail);

  return (
    <ReviewSection title="Publish safety checklist">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checklist.map((item) => (
          <div
            key={item.label}
            className="rounded-md border border-slate-200 bg-white p-3"
          >
            <div className="flex items-center gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  item.status === "pass"
                    ? "bg-teal-500"
                    : item.status === "warning"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                }`}
              />
              <p className="text-sm font-medium text-slate-950">{item.label}</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.message}</p>
          </div>
        ))}
      </div>
    </ReviewSection>
  );
}

function AdminContentEditForm({
  draft,
  onChange,
}: {
  draft: AdminEditDraft;
  onChange: (draft: AdminEditDraft) => void;
}) {
  if (draft.type === "reading") {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_140px_1fr]">
          <AdminInput
            label="Title"
            value={draft.title}
            onChange={(title) => onChange({ ...draft, title })}
          />
          <AdminInput
            label="Band"
            type="number"
            value={draft.band}
            onChange={(band) => onChange({ ...draft, band })}
          />
          <AdminInput
            label="Topic"
            value={draft.topic}
            onChange={(topic) => onChange({ ...draft, topic })}
          />
        </div>
        <AdminTextarea
          label="Passage"
          value={draft.passage}
          rows={12}
          onChange={(passage) => onChange({ ...draft, passage })}
        />
        <JsonEditBlock
          value={draft.questionsJson}
          onChange={(questionsJson) => onChange({ ...draft, questionsJson })}
        />
      </div>
    );
  }

  if (draft.type === "listening") {
    return (
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-[1fr_120px_120px_1fr]">
          <AdminInput
            label="Title"
            value={draft.title}
            onChange={(title) => onChange({ ...draft, title })}
          />
          <AdminInput
            label="Band"
            type="number"
            value={draft.band}
            onChange={(band) => onChange({ ...draft, band })}
          />
          <AdminInput
            label="Section"
            type="number"
            value={draft.section}
            onChange={(section) => onChange({ ...draft, section })}
          />
          <AdminInput
            label="Topic"
            value={draft.topic}
            onChange={(topic) => onChange({ ...draft, topic })}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ReadOnlyField label="Audio status" value={draft.audioStatus} />
          <ReadOnlyField label="Audio URL" value={draft.audioUrl ?? "-"} />
        </div>
        <AdminTextarea
          label="Script / transcript"
          value={draft.script}
          rows={10}
          onChange={(script) => onChange({ ...draft, script })}
        />
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Speaker / voice mapping (read only)
          </p>
          <JsonBlock value={draft.ttsVoiceMapping} />
        </div>
        <JsonEditBlock
          value={draft.questionsJson}
          onChange={(questionsJson) => onChange({ ...draft, questionsJson })}
        />
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          If you change the script, audio will be marked as pending. Use Regenerate
          Audio after review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[140px_140px_1fr]">
        <AdminInput
          label="Task type"
          type="number"
          value={draft.taskType}
          onChange={(taskType) => onChange({ ...draft, taskType })}
        />
        <AdminInput
          label="Band target"
          type="number"
          value={draft.bandTarget}
          onChange={(bandTarget) => onChange({ ...draft, bandTarget })}
        />
        <AdminInput
          label="Topic"
          value={draft.topic}
          onChange={(topic) => onChange({ ...draft, topic })}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyField
          label="Suggested time"
          value={draft.taskType === "1" ? "20 minutes" : "40 minutes"}
        />
        <ReadOnlyField
          label="Minimum words"
          value={draft.taskType === "1" ? "150 words" : "250 words"}
        />
      </div>
      <AdminTextarea
        label="Prompt"
        value={draft.prompt}
        rows={6}
        onChange={(prompt) => onChange({ ...draft, prompt })}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <AdminTextarea
          label="Band 7 sample"
          value={draft.sampleAnswerBand7}
          rows={10}
          onChange={(sampleAnswerBand7) =>
            onChange({ ...draft, sampleAnswerBand7 })
          }
        />
        <AdminTextarea
          label="Band 8 sample"
          value={draft.sampleAnswerBand8}
          rows={10}
          onChange={(sampleAnswerBand8) =>
            onChange({ ...draft, sampleAnswerBand8 })
          }
        />
        <AdminTextarea
          label="Band 9 sample"
          value={draft.sampleAnswerBand9}
          rows={10}
          onChange={(sampleAnswerBand9) =>
            onChange({ ...draft, sampleAnswerBand9 })
          }
        />
      </div>
      <AdminTextarea
        label="Scoring notes JSON"
        value={draft.scoringNotesJson}
        rows={8}
        onChange={(scoringNotesJson) => onChange({ ...draft, scoringNotesJson })}
      />
      <AdminTextarea
        label="Visual data JSON"
        value={draft.visualDataJson}
        rows={10}
        onChange={(visualDataJson) => onChange({ ...draft, visualDataJson })}
      />
      <p className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
        Optional for Task 1. Charts and tables use type, title, xKey, series,
        data and unit. Process diagrams use type, title, description, stages
        and optional is_cycle. Leave empty if this task should use the prompt or
        markdown table fallback.
      </p>
    </div>
  );
}

function AdminInput({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: "text" | "number";
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

function AdminTextarea({
  label,
  value,
  rows = 6,
  onChange,
}: {
  label: string;
  value: string;
  rows?: number;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </label>
  );
}

function JsonEditBlock({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-slate-700">Questions and answers JSON</p>
        <p className="mt-1 text-xs text-slate-500">
          Edit questions and answers as JSON. Make sure question ids and answer keys
          remain aligned.
        </p>
      </div>
      <textarea
        value={value}
        rows={16}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-y rounded-md border border-slate-200 bg-slate-950 px-3 py-2 font-mono text-xs leading-5 text-slate-50 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      />
    </div>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-all text-sm text-slate-700">{value}</p>
    </div>
  );
}

function DetailMeta({ detail }: { detail: AdminContentDetail }) {
  const content = detail.content;

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Metric label="Status" value={formatContentStatus(content.status)} />
      <Metric label="Source" value={content.source} />
      <Metric label="Created" value={formatDateTime(content.createdAt)} />
      <Metric label="Updated" value={formatDateTime(content.updatedAt)} />
    </div>
  );
}

function ReadingDetail({
  detail,
}: {
  detail: Extract<AdminContentDetail, { type: "reading" }>;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Band" value={`Band ${detail.content.band}`} />
        <Metric label="Topic" value={detail.content.topic} />
        <Metric label="Length" value={`${detail.content.lengthWords} words`} />
      </div>
      <ReviewSection title="Passage">
        <div className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {detail.content.passage}
        </div>
      </ReviewSection>
      <QuestionReview questions={detail.content.questions} />
    </>
  );
}

function ListeningDetail({
  detail,
}: {
  detail: Extract<AdminContentDetail, { type: "listening" }>;
}) {
  const hasAudio = detail.content.audioStatus === "ready" && detail.content.audioUrl;

  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric
          label="Band"
          value={detail.content.band ? `Band ${detail.content.band}` : "-"}
        />
        <Metric label="Topic" value={detail.content.topic} />
        <Metric label="Section" value={`Section ${detail.content.section}`} />
        <Metric label="Audio" value={formatAudioStatus(detail.content.audioStatus)} />
      </div>
      <ReviewSection title="Audio">
        {hasAudio ? (
          <div className="space-y-3">
            <audio
              className="w-full"
              controls
              src={detail.content.audioUrl ?? undefined}
            />
            <p className="break-all text-xs text-slate-500">
              {detail.content.audioUrl}
            </p>
          </div>
        ) : (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Audio pending. Script review available.
          </div>
        )}
      </ReviewSection>
      <ReviewSection title="Script / transcript">
        <div className="max-h-[360px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
          {detail.content.script}
        </div>
      </ReviewSection>
      <ReviewSection title="Speaker / voice mapping">
        <JsonBlock value={detail.content.ttsVoiceMapping} />
      </ReviewSection>
      <QuestionReview questions={detail.content.questions} />
    </>
  );
}

function WritingDetail({
  detail,
}: {
  detail: Extract<AdminContentDetail, { type: "writing" }>;
}) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="Task Type" value={`Task ${detail.content.taskType}`} />
        <Metric
          label="Band Target"
          value={
            detail.content.bandTarget ? `Band ${detail.content.bandTarget}` : "-"
          }
        />
        <Metric label="Time" value={`${detail.content.suggestedTimeMinutes} min`} />
        <Metric label="Minimum" value={`${detail.content.minimumWords} words`} />
      </div>
      <ReviewSection title="Prompt">
        <WritingTaskVisual
          prompt={detail.content.prompt}
          taskType={detail.content.taskType}
          visualData={detail.content.visualData}
        />
      </ReviewSection>
      <div className="grid gap-4 lg:grid-cols-3">
        <ReviewSection title="Band 7 sample">
          <TextBlock value={detail.content.sampleAnswerBand7} />
        </ReviewSection>
        <ReviewSection title="Band 8 sample">
          <TextBlock value={detail.content.sampleAnswerBand8} />
        </ReviewSection>
        <ReviewSection title="Band 9 sample">
          <TextBlock value={detail.content.sampleAnswerBand9} />
        </ReviewSection>
      </div>
      <ReviewSection title="Scoring notes">
        <JsonBlock value={detail.content.scoringNotes} />
      </ReviewSection>
      <ReviewSection title="Visual data JSON">
        <JsonBlock value={detail.content.visualData} />
      </ReviewSection>
    </>
  );
}

function QuestionReview({ questions }: { questions: AdminReviewQuestion[] }) {
  return (
    <ReviewSection title={`Questions and answer keys (${questions.length})`}>
      {questions.length ? (
        <div className="space-y-4">
          {questions.map((question) => (
            <div
              key={question.id}
              className="rounded-md border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge>Question {question.number}</Badge>
                <Badge className="bg-white">{formatQuestionType(question.type)}</Badge>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <DetailRow label="Question text" value={question.prompt} />
                <DetailRow label="Options" value={formatList(question.options)} />
                <DetailRow label="Correct answer" value={question.correctAnswer} />
                <DetailRow
                  label="Acceptable answers"
                  value={formatList(question.acceptableAnswers)}
                />
                <DetailRow label="中文解析" value={question.explanationZh ?? "-"} />
                <DetailRow
                  label="English explanation"
                  value={question.explanationEn ?? "-"}
                />
                <DetailRow label="Synonyms" value={formatList(question.synonyms)} />
              </dl>
              {question.vocabulary.length ? (
                <div className="mt-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Vocabulary
                  </p>
                  <JsonBlock value={question.vocabulary} />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
          No questions found for this content.
        </div>
      )}
    </ReviewSection>
  );
}

function ReviewSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold text-slate-950">{title}</h3>
      {children}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

function TextBlock({ value }: { value?: string | null }) {
  return (
    <div className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
      {value || "No content returned."}
    </div>
  );
}

function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[260px] overflow-auto rounded-md border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-700">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatQuestionType(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatList(value: unknown[]) {
  if (!value.length) {
    return "-";
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      return JSON.stringify(item);
    })
    .join("; ");
}

function GeneratePanel({
  mode,
  setMode,
  band,
  setBand,
  topic,
  setTopic,
  section,
  setSection,
  taskType,
  setTaskType,
  quantity,
  setQuantity,
  promptTemplateId,
  setPromptTemplateId,
  promptTemplates,
  readingTypes,
  setReadingTypes,
  listeningTypes,
  setListeningTypes,
  isGenerating,
  result,
  onGenerate,
  onViewDrafts,
}: {
  mode: GenerateMode;
  setMode: (mode: GenerateMode) => void;
  band: number;
  setBand: (band: number) => void;
  topic: string;
  setTopic: (topic: string) => void;
  section: number;
  setSection: (section: number) => void;
  taskType: number;
  setTaskType: (taskType: number) => void;
  quantity: number;
  setQuantity: (quantity: number) => void;
  promptTemplateId: string;
  setPromptTemplateId: (promptTemplateId: string) => void;
  promptTemplates: AdminDashboardData["promptTemplates"];
  readingTypes: string[];
  setReadingTypes: (types: string[]) => void;
  listeningTypes: string[];
  setListeningTypes: (types: string[]) => void;
  isGenerating: boolean;
  result: GenerateApiResponse | null;
  onGenerate: () => void;
  onViewDrafts: () => void;
}) {
  const topicOptions =
    mode === "listening"
      ? listeningTopics
      : mode === "writing"
        ? writingTopics
        : readingTopics;
  const filteredTemplates = promptTemplates.filter(
    (template) => template.skill === mode,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>AI Content Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            {(["reading", "listening", "writing"] as const).map((item) => (
              <Button
                key={item}
                type="button"
                size="sm"
                variant={mode === item ? "default" : "outline"}
                onClick={() => {
                  setMode(item);
                  setTopic(
                    item === "listening"
                      ? "accommodation"
                      : item === "writing"
                        ? "education"
                        : "education",
                  );
                }}
              >
                {item}
              </Button>
            ))}
          </div>

          <AdminSelect
            label="Band"
            value={String(band)}
            onChange={(value) => setBand(Number(value))}
            options={readingBands.map((item) => ({
              value: String(item),
              label: `Band ${item}`,
            }))}
          />

          <AdminSelect
            label="Topic"
            value={topic}
            onChange={setTopic}
            options={topicOptions.map((item) => ({
              value: item.value,
              label: item.label,
            }))}
          />

          {mode === "listening" ? (
            <AdminSelect
              label="Section"
              value={String(section)}
              onChange={(value) => setSection(Number(value))}
              options={listeningSections.map((item) => ({
                value: String(item),
                label: `Section ${item}`,
              }))}
            />
          ) : null}

          {mode === "writing" ? (
            <AdminSelect
              label="Task Type"
              value={String(taskType)}
              onChange={(value) => setTaskType(Number(value))}
              options={writingTaskTypes.map((item) => ({
                value: String(item.value),
                label: item.label,
              }))}
            />
          ) : null}

          <AdminSelect
            label="Quantity"
            value={String(quantity)}
            onChange={(value) => setQuantity(Number(value))}
            options={[1, 2, 3, 4, 5].map((item) => ({
              value: String(item),
              label: `${item}`,
            }))}
          />

          <AdminSelect
            label="Prompt Template"
            value={promptTemplateId}
            onChange={setPromptTemplateId}
            options={[
              { value: "", label: "Default system prompt" },
              ...filteredTemplates.map((template) => ({
                value: template.id,
                label: `${template.name} v${template.version}`,
              })),
            ]}
          />

          {mode === "reading" ? (
            <QuestionTypePicker
              title="Question Types"
              options={readingQuestionTypes}
              selected={readingTypes}
              onChange={setReadingTypes}
            />
          ) : null}

          {mode === "listening" ? (
            <QuestionTypePicker
              title="Question Types"
              options={listeningQuestionTypes}
              selected={listeningTypes}
              onChange={setListeningTypes}
            />
          ) : null}

          <Button
            type="button"
            className="w-full"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            <WandSparkles className="h-4 w-4" aria-hidden="true" />
            {isGenerating ? "Generating" : "Generate"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generation result</CardTitle>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Metric label="Model" value={result.usage.model} />
                <Metric label="Tokens" value={`${result.usage.totalTokens}`} />
                <Metric
                  label="Output"
                  value={`${result.usage.outputTokens}`}
                />
                <Metric
                  label="Cost"
                  value={`$${result.usage.estimatedCost.toFixed(6)}`}
                />
              </div>

              {result.results.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>Band {item.band}</Badge>
                        <Badge className="bg-white">{item.topic}</Badge>
                        <Badge className="bg-amber-50 text-amber-800">
                          {item.status}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm font-medium text-slate-950">
                        {item.title}
                      </p>
                    </div>
                    <Button type="button" variant="outline" onClick={onViewDrafts}>
                      View Draft
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
              生成成功后会显示标题、Band、Topic、状态、token 和预估成本。
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function QuestionTypePicker({
  title,
  options,
  selected,
  onChange,
}: {
  title: string;
  options: Array<{ value: string; label: string }>;
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-slate-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value);

          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={isSelected ? "default" : "outline"}
              onClick={() => {
                if (isSelected) {
                  onChange(
                    selected.length === 1
                      ? selected
                      : selected.filter((item) => item !== option.value),
                  );
                } else {
                  onChange([...selected, option.value]);
                }
              }}
            >
              {option.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function getPublishChecklist(detail: AdminContentDetail): PublishChecklistItem[] {
  if (detail.type === "reading") {
    const basicsComplete =
      hasAdminText(detail.content.title) &&
      Boolean(detail.content.band) &&
      hasAdminText(detail.content.topic) &&
      hasAdminText(detail.content.passage) &&
      countAdminWords(detail.content.passage) >= 100;
    const questionsComplete =
      detail.content.questions.length > 0 &&
      detail.content.questions.every((question) => hasAdminText(question.prompt));
    const answersComplete =
      detail.content.questions.length > 0 &&
      detail.content.questions.every((question) =>
        hasQuestionAnswer(question),
      );
    const explanationsComplete =
      detail.content.questions.length > 0 &&
      detail.content.questions.every(
        (question) =>
          hasAdminText(question.explanationZh) ||
          hasAdminText(question.explanationEn),
      );
    const ready = basicsComplete && questionsComplete && answersComplete;

    return [
      checklistItem(
        "Content basics complete",
        basicsComplete,
        "Title, band, topic and passage are present.",
      ),
      checklistItem(
        "Questions complete",
        questionsComplete,
        "At least one question exists and all question text is filled.",
      ),
      checklistItem(
        "Answers complete",
        answersComplete,
        "Every question has an answer key.",
      ),
      checklistItem(
        "Explanations available",
        explanationsComplete,
        "Missing explanations are allowed, but should be reviewed.",
        true,
      ),
      {
        label: "Audio ready / Script preview only",
        status: "pass",
        message: "Not required for Reading content.",
      },
      checklistItem(
        "Ready to publish",
        ready,
        ready
          ? "This Reading set passes required publish checks."
          : "Fix required Reading fields before publishing.",
      ),
    ];
  }

  if (detail.type === "listening") {
    const basicsComplete =
      hasAdminText(detail.content.title) &&
      Boolean(detail.content.band) &&
      hasAdminText(detail.content.topic) &&
      Boolean(detail.content.section) &&
      hasAdminText(detail.content.script);
    const questionsComplete =
      detail.content.questions.length > 0 &&
      detail.content.questions.every((question) => hasAdminText(question.prompt));
    const answersComplete =
      detail.content.questions.length > 0 &&
      detail.content.questions.every((question) =>
        hasQuestionAnswer(question),
      );
    const explanationsComplete =
      detail.content.questions.length > 0 &&
      detail.content.questions.every(
        (question) =>
          hasAdminText(question.explanationZh) ||
          hasAdminText(question.explanationEn),
      );
    const audioStatus = getListeningAudioChecklistStatus(detail);
    const ready =
      basicsComplete &&
      questionsComplete &&
      answersComplete &&
      audioStatus.status !== "fail";

    return [
      checklistItem(
        "Content basics complete",
        basicsComplete,
        "Title, band, topic, section and script are present.",
      ),
      checklistItem(
        "Questions complete",
        questionsComplete,
        "At least one question exists and all question text is filled.",
      ),
      checklistItem(
        "Answers complete",
        answersComplete,
        "Every question has an answer key.",
      ),
      checklistItem(
        "Explanations available",
        explanationsComplete,
        "Missing explanations are allowed, but should be reviewed.",
        true,
      ),
      audioStatus,
      checklistItem(
        "Ready to publish",
        ready,
        ready
          ? "This Listening set passes required publish checks."
          : "Fix required Listening fields before publishing.",
      ),
    ];
  }

  const basicsComplete =
    Boolean(detail.content.taskType) &&
    hasAdminText(detail.content.topic) &&
    hasAdminText(detail.content.prompt) &&
    detail.content.minimumWords >= 100 &&
    detail.content.suggestedTimeMinutes >= 10;
  const samplesAreText = [
    detail.content.sampleAnswerBand7,
    detail.content.sampleAnswerBand8,
    detail.content.sampleAnswerBand9,
  ].every((value) => value === null || typeof value === "string");

  return [
    checklistItem(
      "Content basics complete",
      basicsComplete,
      "Task type, topic, prompt, time and word guidance are present.",
    ),
    {
      label: "Questions complete",
      status: "pass",
      message: "Not required for Writing tasks.",
    },
    {
      label: "Answers complete",
      status: samplesAreText ? "pass" : "fail",
      message: "Sample answers are optional, but must be text when present.",
    },
    {
      label: "Explanations available",
      status: "pass",
      message: "Writing review uses prompt and scoring notes instead of answer explanations.",
    },
    {
      label: "Audio ready / Script preview only",
      status: "pass",
      message: "Not required for Writing tasks.",
    },
    checklistItem(
      "Ready to publish",
      basicsComplete && samplesAreText,
      basicsComplete && samplesAreText
        ? "This Writing task passes required publish checks."
        : "Fix required Writing fields before publishing.",
    ),
  ];
}

function checklistItem(
  label: string,
  passed: boolean,
  message: string,
  warningOnly = false,
): PublishChecklistItem {
  if (passed) {
    return { label, status: "pass", message };
  }

  return {
    label,
    status: warningOnly ? "warning" : "fail",
    message,
  };
}

function getListeningAudioChecklistStatus(
  detail: Extract<AdminContentDetail, { type: "listening" }>,
): PublishChecklistItem {
  if (detail.content.audioStatus === "ready") {
    return {
      label: "Audio ready / Script preview only",
      status: hasAdminText(detail.content.audioUrl) ? "pass" : "fail",
      message: hasAdminText(detail.content.audioUrl)
        ? "Audio is ready and audio_url exists."
        : "Audio is marked ready but audio_url is missing.",
    };
  }

  return {
    label: "Audio ready / Script preview only",
    status: "warning",
    message: "Audio is pending. Publishing is allowed with script preview.",
  };
}

function hasQuestionAnswer(question: AdminReviewQuestion) {
  return (
    hasAdminText(question.correctAnswer) ||
    question.acceptableAnswers.some((answer) => hasAdminText(answer))
  );
}

function hasAdminText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function countAdminWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function createEditDraft(detail: AdminContentDetail): AdminEditDraft {
  if (detail.type === "reading") {
    return {
      type: "reading",
      id: detail.content.id,
      title: detail.content.title,
      band: String(detail.content.band),
      topic: detail.content.topic,
      passage: detail.content.passage,
      questionsJson: JSON.stringify(detail.content.questions, null, 2),
    };
  }

  if (detail.type === "listening") {
    return {
      type: "listening",
      id: detail.content.id,
      title: detail.content.title,
      band: detail.content.band ? String(detail.content.band) : "",
      topic: detail.content.topic,
      section: String(detail.content.section),
      script: detail.content.script,
      questionsJson: JSON.stringify(detail.content.questions, null, 2),
      audioStatus: detail.content.audioStatus,
      audioUrl: detail.content.audioUrl,
      ttsVoiceMapping: detail.content.ttsVoiceMapping,
    };
  }

  return {
    type: "writing",
    id: detail.content.id,
    taskType: String(detail.content.taskType),
    bandTarget: detail.content.bandTarget ? String(detail.content.bandTarget) : "",
    topic: detail.content.topic,
    prompt: detail.content.prompt,
    sampleAnswerBand7: detail.content.sampleAnswerBand7 ?? "",
    sampleAnswerBand8: detail.content.sampleAnswerBand8 ?? "",
    sampleAnswerBand9: detail.content.sampleAnswerBand9 ?? "",
    scoringNotesJson: JSON.stringify(detail.content.scoringNotes ?? {}, null, 2),
    visualDataJson: detail.content.visualData
      ? JSON.stringify(detail.content.visualData, null, 2)
      : "",
  };
}

function buildEditPatchPayload(draft: AdminEditDraft) {
  if (draft.type === "reading") {
    return {
      type: "reading",
      id: draft.id,
      data: {
        title: requireText(draft.title, "Title"),
        band: parseRequiredInteger(draft.band, "Band"),
        topic: requireText(draft.topic, "Topic"),
        passage: requireText(draft.passage, "Passage"),
        questions: parseJsonArray(draft.questionsJson, "Questions and answers JSON"),
      },
    };
  }

  if (draft.type === "listening") {
    return {
      type: "listening",
      id: draft.id,
      data: {
        title: requireText(draft.title, "Title"),
        band: parseOptionalInteger(draft.band, "Band"),
        topic: requireText(draft.topic, "Topic"),
        section: parseRequiredInteger(draft.section, "Section"),
        script: requireText(draft.script, "Script"),
        questions: parseJsonArray(draft.questionsJson, "Questions and answers JSON"),
      },
    };
  }

  return {
    type: "writing",
    id: draft.id,
    data: {
      taskType: parseRequiredInteger(draft.taskType, "Task type"),
      bandTarget: parseOptionalInteger(draft.bandTarget, "Band target"),
      topic: requireText(draft.topic, "Topic"),
      prompt: requireText(draft.prompt, "Prompt"),
      sampleAnswerBand7: draft.sampleAnswerBand7.trim() || null,
      sampleAnswerBand8: draft.sampleAnswerBand8.trim() || null,
      sampleAnswerBand9: draft.sampleAnswerBand9.trim() || null,
      scoringNotes: parseJsonValue(draft.scoringNotesJson, "Scoring notes JSON"),
      visualData: draft.visualDataJson.trim()
        ? parseJsonValue(draft.visualDataJson, "Visual data JSON")
        : null,
    },
  };
}

function requireText(value: string, label: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} cannot be empty.`);
  }

  return trimmed;
}

function parseRequiredInteger(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} must be a whole number.`);
  }

  return parsed;
}

function parseOptionalInteger(value: string, label: string) {
  if (!value.trim()) {
    return null;
  }

  return parseRequiredInteger(value, label);
}

function parseJsonArray(value: string, label: string) {
  const parsed = parseJsonValue(value, label);

  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON array.`);
  }

  return parsed;
}

function parseJsonValue(value: string, label: string) {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function buildGeneratePayload({
  mode,
  band,
  topic,
  section,
  taskType,
  quantity,
  promptTemplateId,
  readingTypes,
  listeningTypes,
}: {
  mode: GenerateMode;
  band: number;
  topic: string;
  section: number;
  taskType: number;
  quantity: number;
  promptTemplateId: string;
  readingTypes: string[];
  listeningTypes: string[];
}) {
  const base = {
    band,
    topic,
    quantity,
    promptTemplateId: promptTemplateId || undefined,
  };

  if (mode === "reading") {
    return {
      ...base,
      lengthWords: 800,
      questionTypes: readingTypes,
    };
  }

  if (mode === "listening") {
    return {
      ...base,
      section,
      questionTypes: listeningTypes,
    };
  }

  return {
    taskType,
    bandTarget: band,
    topic,
    quantity,
    promptTemplateId: promptTemplateId || undefined,
  };
}

function formatContentStatus(status: AdminContentStatus) {
  return status === "review" ? "pending_review" : status;
}

function formatAudioStatus(status?: string | null) {
  return status === "ready" ? "audio_ready" : "audio_pending";
}

function DataTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {headers.map((header) => (
                  <th key={header} className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.map((row) => (
                <tr key={row.join("-")}>
                  {row.map((cell) => (
                    <td key={cell} className="px-4 py-3 text-slate-700">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function MembershipsTable({
  rows,
  search,
  onSearchChange,
  onOpenAction,
}: {
  rows: AdminMembershipItem[];
  search: string;
  onSearchChange: (value: string) => void;
  onOpenAction: (action: MembershipAction, user: AdminMembershipItem) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Memberships</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manually grant, extend, or revoke Pro access after offline
              payment. Stripe can reuse the same subscription fields later.
            </p>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="membership-search">Search email</Label>
            <Input
              id="membership-search"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="student@example.com"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-[1120px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  "Email",
                  "Plan",
                  "Status",
                  "Started",
                  "Expires",
                  "Last login",
                  "Notes",
                  "Actions",
                ].map((header) => (
                  <th key={header} className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.userId}>
                    <td className="max-w-[260px] px-4 py-3 font-medium text-slate-950">
                      <span className="block truncate" title={row.email}>
                        {row.email}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          row.isPro
                            ? "bg-teal-50 text-teal-800"
                            : "bg-slate-100 text-slate-600"
                        }
                      >
                        {formatMembershipPlan(row.plan)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatMembershipStatus(row.status)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatAdminDate(row.startedAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatAdminDate(row.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatAdminDate(row.lastLoginAt)}
                    </td>
                    <td className="max-w-[220px] px-4 py-3 text-slate-700">
                      <span className="block truncate" title={row.notes ?? ""}>
                        {row.notes ?? "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.isPro ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenAction("extend", row)}
                            >
                              Extend
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onOpenAction("revoke", row)}
                            >
                              Revoke Pro
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenAction("grant", row)}
                          >
                            <Crown className="h-4 w-4" aria-hidden="true" />
                            Grant Pro
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function MembershipActionModal({
  state,
  isSaving,
  onClose,
  onSave,
}: {
  state: MembershipModalState;
  isSaving: boolean;
  onClose: () => void;
  onSave: (input: {
    action: MembershipAction;
    user: AdminMembershipItem;
    durationDays: number;
    customExpiryDate?: string;
    notes?: string;
  }) => Promise<void>;
}) {
  const [duration, setDuration] = useState("30");
  const [customExpiryDate, setCustomExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const isGrant = state.action === "grant";
  const isExtend = state.action === "extend";
  const isRevoke = state.action === "revoke";
  const requiresCustomExpiry = isGrant && duration === "custom";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-md bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">
              {formatMembershipAction(state.action)}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{state.user.email}</p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close membership modal"
            onClick={onClose}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!isRevoke ? (
            <div className="space-y-2">
              <Label htmlFor="membership-duration">Duration</Label>
              <select
                id="membership-duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-950 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              >
                <option value="30">30 days</option>
                <option value="90">90 days</option>
                {isGrant ? <option value="180">180 days</option> : null}
                <option value="365">365 days</option>
                {isGrant ? (
                  <option value="custom">Custom expiry</option>
                ) : null}
              </select>
            </div>
          ) : (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              This will move the user back to Free and mark the subscription as
              cancelled. Existing logs and attempts are preserved.
            </div>
          )}

          {requiresCustomExpiry ? (
            <div className="space-y-2">
              <Label htmlFor="membership-custom-expiry">Custom expiry</Label>
              <Input
                id="membership-custom-expiry"
                type="date"
                value={customExpiryDate}
                onChange={(event) => setCustomExpiryDate(event.target.value)}
              />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="membership-notes">Notes</Label>
            <Input
              id="membership-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder={
                isRevoke
                  ? "Cancelled by admin"
                  : "Paid via WeChat / Alipay / e-Transfer"
              }
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSaving || (requiresCustomExpiry && !customExpiryDate)}
            onClick={() =>
              onSave({
                action: state.action,
                user: state.user,
                durationDays: duration === "custom" ? 30 : Number(duration),
                customExpiryDate: requiresCustomExpiry
                  ? customExpiryDate
                  : undefined,
                notes,
              })
            }
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            {isExtend
              ? "Extend Pro"
              : isRevoke
                ? "Revoke Pro"
                : "Grant Pro"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function UserActivityTable({ rows }: { rows: AdminUserActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>User Activity</CardTitle>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Recent beta user activity, sorted by last activity time. Reward
              eligibility means the user has completed at least one practice
              session.
            </p>
          </div>
          <Badge className="w-fit bg-teal-50 text-teal-800">
            {rows.filter((row) => row.betaRewardEligible).length} eligible
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                {[
                  "Email",
                  "Signed up",
                  "Last activity",
                  "Reading",
                  "Listening",
                  "Writing",
                  "Total",
                  "Latest",
                  "Reward",
                ].map((header) => (
                  <th key={header} className="px-4 py-3 font-medium">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {rows.length ? (
                rows.map((row) => (
                  <tr key={row.userId}>
                    <td className="max-w-[240px] px-4 py-3 font-medium text-slate-950">
                      <span className="block truncate" title={row.email}>
                        {row.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatAdminDate(row.signedUpAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatAdminDate(row.lastActivityAt)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.readingAttempts}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.listeningAttempts}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.writingAttempts}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-950">
                      {row.totalAttempts}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {row.latestAttemptType ? (
                        <div className="space-y-1">
                          <div className="font-medium text-slate-950">
                            {row.latestAttemptType}
                          </div>
                          <div className="text-xs text-slate-500">
                            {row.latestAttemptScore ?? "No score"}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">No attempts</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          row.betaRewardEligible
                            ? "bg-teal-50 text-teal-800"
                            : "bg-slate-100 text-slate-600"
                        }
                      >
                        {row.betaRewardEligible ? "Eligible" : "Not yet"}
                      </Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-sm text-slate-500"
                  >
                    No user activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function formatAdminDate(value: string | null) {
  if (!value) {
    return "No activity";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function formatMembershipPlan(plan: string) {
  const labels: Record<string, string> = {
    free: "Free",
    pro: "Pro",
    pro_monthly: "Pro Monthly",
    pro_yearly: "Pro Yearly",
  };

  return labels[plan] ?? plan;
}

function formatMembershipStatus(status: string) {
  const labels: Record<string, string> = {
    active: "Active",
    trialing: "Trialing",
    manual: "Manual",
    expired: "Expired",
    cancelled: "Cancelled",
    canceled: "Cancelled",
    past_due: "Past due",
    incomplete: "Incomplete",
  };

  return labels[status] ?? status;
}

function formatMembershipAction(action: MembershipAction) {
  const labels: Record<MembershipAction, string> = {
    grant: "Grant Pro",
    extend: "Extend Pro",
    revoke: "Revoke Pro",
  };

  return labels[action];
}
