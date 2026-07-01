"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  FileCheck2,
  Headphones,
  ListChecks,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Trash2,
  Users,
  WandSparkles,
} from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  AdminContentItem,
  AdminContentStatus,
  AdminDashboardData,
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

type AdminTab = "generate" | "content" | "users" | "prompts" | "logs";
type GenerateMode = "reading" | "listening" | "writing";

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

const prompts = [
  ["reading-generator", "v1", "English questions, Chinese explanations"],
  ["writing-grader", "v1", "IELTS criteria estimate with bilingual feedback"],
  ["listening-generator", "v1", "English script and answer key"],
];

const demoData: AdminDashboardData = {
  content: demoContent,
  users,
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
  const [logs, setLogs] = useState<string[]>(data.logs);
  const [isMutatingId, setIsMutatingId] = useState<string | null>(null);
  const [isAudioGeneratingId, setIsAudioGeneratingId] = useState<string | null>(
    null,
  );
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

        if (!response.ok) {
          throw new Error("Content update failed.");
        }
      } catch (mutationError) {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : "Content update failed.",
        );
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

  const generateListeningAudio = async (item: AdminContentItem) => {
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
      setLogs((current) => [`${item.title} audio generated`, ...current]);
      setToastMessage(
        `Audio ready · ${payload.usage.totalTokens} estimated input tokens · $${payload.usage.estimatedCost.toFixed(
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
              <CardTitle>Content review queue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {content.map((item) => (
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
                          <Headphones className="h-3.5 w-3.5" aria-hidden="true" />
                          {formatAudioStatus(item.audioStatus)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-3 text-sm font-medium text-slate-950">
                      {item.title}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
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
              ))}
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
    </AppShell>
  );
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
