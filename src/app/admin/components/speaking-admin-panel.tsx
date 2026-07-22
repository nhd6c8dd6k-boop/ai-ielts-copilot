"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Loader2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  parseSpeakingDetailPayload,
  parseSpeakingTopicPayload,
  parseSpeakingTopicsPayload,
  readJsonResponse,
} from "./speaking-response-parsers";
import type {
  AdminSpeakingPartFilter,
  AdminSpeakingQuestion,
  AdminSpeakingSourceType,
  AdminSpeakingStatus,
  AdminSpeakingStatusFilter,
  AdminSpeakingTopicCountState,
  AdminSpeakingTopicDetail,
  AdminSpeakingTopicSummary,
} from "./speaking-types";

type SpeakingLoadState = "idle" | "loading" | "success" | "error";

type SpeakingTopicEditorState =
  | { mode: "create" }
  | { mode: "edit"; topic: AdminSpeakingTopicSummary };

type SpeakingTopicMetadataDraft = {
  title: string;
  slug: string;
  part: "1" | "2" | "3";
  description: string;
  targetBand: string;
  sourceType: AdminSpeakingSourceType;
  status: AdminSpeakingStatus;
};

type SpeakingTopicMetadataErrors = Partial<
  Record<keyof SpeakingTopicMetadataDraft, string>
>;

const targetBandOptions = ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9"];

type SpeakingAdminPanelProps = {
  isActive: boolean;
  mode: "demo" | "admin";
  onTopicCountChange?: (state: AdminSpeakingTopicCountState) => void;
};

export function SpeakingAdminPanel({
  isActive,
  mode,
  onTopicCountChange,
}: SpeakingAdminPanelProps) {
  const [partFilter, setPartFilter] = useState<AdminSpeakingPartFilter>("all");
  const [statusFilter, setStatusFilter] =
    useState<AdminSpeakingStatusFilter>("all");
  const [retryKey, setRetryKey] = useState(0);
  const [topics, setTopics] = useState<AdminSpeakingTopicSummary[]>([]);
  const [loadState, setLoadState] = useState<SpeakingLoadState>("idle");
  const [hasLoadedTopics, setHasLoadedTopics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] =
    useState<AdminSpeakingTopicSummary | null>(null);
  const [topicDetail, setTopicDetail] =
    useState<AdminSpeakingTopicDetail | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<SpeakingTopicEditorState | null>(
    null,
  );
  const [metadataDraft, setMetadataDraft] =
    useState<SpeakingTopicMetadataDraft>(createEmptyTopicDraft);
  const [metadataInitialDraft, setMetadataInitialDraft] =
    useState<SpeakingTopicMetadataDraft>(createEmptyTopicDraft);
  const [metadataErrors, setMetadataErrors] =
    useState<SpeakingTopicMetadataErrors>({});
  const [metadataSaveError, setMetadataSaveError] = useState<string | null>(null);
  const [isMetadataSaving, setIsMetadataSaving] = useState(false);
  const topicsRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const detailControllerRef = useRef<AbortController | null>(null);
  const hasReportedTopicCountRef = useRef(false);

  const abortDetailRequest = useCallback(() => {
    detailControllerRef.current?.abort();
    detailControllerRef.current = null;
    detailRequestIdRef.current += 1;
  }, []);

  const resetDetailState = useCallback(() => {
    setSelectedTopic(null);
    setTopicDetail(null);
    setDetailError(null);
    setIsDetailLoading(false);
  }, []);

  useEffect(() => {
    if (isActive) {
      return;
    }

    abortDetailRequest();
    const resetTimer = window.setTimeout(resetDetailState, 0);

    return () => window.clearTimeout(resetTimer);
  }, [abortDetailRequest, isActive, resetDetailState]);

  useEffect(() => () => abortDetailRequest(), [abortDetailRequest]);

  useEffect(() => {
    if (!isActive) {
      return;
    }

    const requestId = topicsRequestIdRef.current + 1;
    topicsRequestIdRef.current = requestId;
    const controller = new AbortController();

    const loadTopics = async () => {
      try {
        setLoadState("loading");
        setError(null);

        if (mode !== "admin") {
          throw new Error("Speaking topics are available after admin login.");
        }

        const response = await fetch(
          buildSpeakingTopicsUrl(partFilter, statusFilter),
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await readJsonResponse(response);

        if (!response.ok) {
          throw new Error("Failed to load Speaking topics.");
        }

        const nextTopics = parseSpeakingTopicsPayload(payload);

        if (topicsRequestIdRef.current === requestId) {
          setTopics(nextTopics);
          setHasLoadedTopics(true);
          setLoadState("success");
          hasReportedTopicCountRef.current = true;
          onTopicCountChange?.({
            status: "success",
            count: nextTopics.length,
          });
        }
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        if (topicsRequestIdRef.current === requestId) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load Speaking topics.",
          );
          setHasLoadedTopics(true);
          setLoadState("error");

          if (!hasReportedTopicCountRef.current) {
            onTopicCountChange?.({ status: "error" });
          }
        }
      }
    };

    void loadTopics();

    return () => controller.abort();
  }, [isActive, mode, onTopicCountChange, partFilter, retryKey, statusFilter]);

  const viewTopic = async (topic: AdminSpeakingTopicSummary) => {
    detailControllerRef.current?.abort();
    const controller = new AbortController();
    detailControllerRef.current = controller;

    setSelectedTopic(topic);
    setTopicDetail(null);
    setDetailError(null);
    setIsDetailLoading(true);

    if (mode !== "admin") {
      setIsDetailLoading(false);
      setDetailError("Speaking topic detail is available after admin login.");
      return;
    }

    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;

    try {
      const response = await fetch(`/api/admin/speaking/topics/${topic.id}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = await readJsonResponse(response);

      if (response.status === 404) {
        throw new Error("Topic not found.");
      }

      if (!response.ok) {
        throw new Error("Failed to load Speaking topic.");
      }

      const detail = parseSpeakingDetailPayload(payload);

      if (detailRequestIdRef.current === requestId) {
        setTopicDetail(detail);
      }
    } catch (loadError) {
      if (controller.signal.aborted) {
        return;
      }

      if (detailRequestIdRef.current === requestId) {
        setDetailError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load Speaking topic.",
        );
      }
    } finally {
      if (detailRequestIdRef.current === requestId) {
        setIsDetailLoading(false);
      }
    }
  };

  const closeDetail = () => {
    abortDetailRequest();
    resetDetailState();
  };

  const openCreateTopic = () => {
    const draft = createEmptyTopicDraft();
    setEditorState({ mode: "create" });
    setMetadataDraft(draft);
    setMetadataInitialDraft(draft);
    setMetadataErrors({});
    setMetadataSaveError(null);
  };

  const openEditTopic = (topic: AdminSpeakingTopicSummary) => {
    const draft = createTopicDraft(topic);
    setEditorState({ mode: "edit", topic });
    setMetadataDraft(draft);
    setMetadataInitialDraft(draft);
    setMetadataErrors({});
    setMetadataSaveError(null);
  };

  const closeMetadataEditor = () => {
    if (
      isTopicDraftDirty(metadataDraft, metadataInitialDraft) &&
      !window.confirm("Discard changes?")
    ) {
      return;
    }

    setEditorState(null);
    setMetadataErrors({});
    setMetadataSaveError(null);
  };

  const saveMetadata = async () => {
    if (!editorState) {
      return;
    }

    const validation = validateTopicDraft(metadataDraft);

    if (Object.keys(validation).length) {
      setMetadataErrors(validation);
      return;
    }

    if (mode !== "admin") {
      setMetadataSaveError("Speaking topic editing is available after admin login.");
      return;
    }

    setIsMetadataSaving(true);
    setMetadataErrors({});
    setMetadataSaveError(null);

    try {
      const response = await fetch(
        editorState.mode === "create"
          ? "/api/admin/speaking/topics"
          : `/api/admin/speaking/topics/${editorState.topic.id}`,
        {
          method: editorState.mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          body: JSON.stringify(toTopicMetadataPayload(metadataDraft)),
        },
      );
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(readApiError(payload) ?? "Failed to save Speaking topic.");
      }

      const savedTopic = parseSpeakingTopicPayload(payload);

      setSelectedTopic((current) =>
        current?.id === savedTopic.id ? savedTopic : current,
      );
      setTopicDetail((current) =>
        current?.id === savedTopic.id
          ? {
              ...current,
              ...savedTopic,
              questions: current.questions,
              questionCount: current.questions.length,
            }
          : current,
      );
      setEditorState(null);
      setMetadataInitialDraft(metadataDraft);
      setRetryKey((key) => key + 1);
    } catch (saveError) {
      setMetadataSaveError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save Speaking topic.",
      );
    } finally {
      setIsMetadataSaving(false);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <>
      <SpeakingTopicsTable
        topics={topics}
        partFilter={partFilter}
        statusFilter={statusFilter}
        loadState={loadState}
        hasLoaded={hasLoadedTopics}
        error={error}
        isDetailLoadingId={isDetailLoading ? selectedTopic?.id ?? null : null}
        onPartFilterChange={setPartFilter}
        onStatusFilterChange={setStatusFilter}
        onCreate={openCreateTopic}
        onRetry={() => setRetryKey((key) => key + 1)}
        onView={viewTopic}
      />

      {selectedTopic ? (
        <SpeakingTopicDetailModal
          summary={selectedTopic}
          detail={topicDetail}
          error={detailError}
          isLoading={isDetailLoading}
          onEdit={openEditTopic}
          onClose={closeDetail}
        />
      ) : null}

      {editorState ? (
        <SpeakingTopicMetadataModal
          mode={editorState.mode}
          draft={metadataDraft}
          errors={metadataErrors}
          saveError={metadataSaveError}
          isSaving={isMetadataSaving}
          onChange={setMetadataDraft}
          onCancel={closeMetadataEditor}
          onSave={saveMetadata}
        />
      ) : null}
    </>
  );
}

function SpeakingTopicsTable({
  topics,
  partFilter,
  statusFilter,
  loadState,
  hasLoaded,
  error,
  isDetailLoadingId,
  onPartFilterChange,
  onStatusFilterChange,
  onCreate,
  onRetry,
  onView,
}: {
  topics: AdminSpeakingTopicSummary[];
  partFilter: AdminSpeakingPartFilter;
  statusFilter: AdminSpeakingStatusFilter;
  loadState: SpeakingLoadState;
  hasLoaded: boolean;
  error: string | null;
  isDetailLoadingId: string | null;
  onPartFilterChange: (value: AdminSpeakingPartFilter) => void;
  onStatusFilterChange: (value: AdminSpeakingStatusFilter) => void;
  onCreate: () => void;
  onRetry: () => void;
  onView: (topic: AdminSpeakingTopicSummary) => void;
}) {
  const hasActiveFilter = partFilter !== "all" || statusFilter !== "all";
  const isLoading = loadState === "idle" || loadState === "loading";

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-3 md:grid-cols-2 lg:max-w-xl lg:flex-1">
          <SpeakingSelect
            label="Part"
            value={partFilter}
            onChange={(value) =>
              onPartFilterChange(value as AdminSpeakingPartFilter)
            }
            options={[
              { value: "all", label: "All Parts" },
              { value: "1", label: "Part 1" },
              { value: "2", label: "Part 2" },
              { value: "3", label: "Part 3" },
            ]}
          />
          <SpeakingSelect
            label="Status"
            value={statusFilter}
            onChange={(value) =>
              onStatusFilterChange(value as AdminSpeakingStatusFilter)
            }
            options={[
              { value: "all", label: "All Statuses" },
              { value: "draft", label: "Draft" },
              { value: "review", label: "Review" },
              { value: "published", label: "Published" },
              { value: "archived", label: "Archived" },
            ]}
          />
        </div>
        <Button type="button" size="sm" onClick={onCreate}>
          New Topic
        </Button>
      </div>

      {loadState === "loading" && hasLoaded ? (
        <div
          className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Refreshing Speaking topics...
        </div>
      ) : null}

      {isLoading && !hasLoaded ? (
        <div className="space-y-3" aria-busy="true">
          <div className="h-10 rounded-md bg-slate-100" />
          <div className="h-20 rounded-md bg-slate-100" />
          <div className="h-20 rounded-md bg-slate-100" />
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
          <p className="text-sm font-medium text-rose-800">
            Speaking topics could not be loaded.
          </p>
          <p className="mt-1 text-sm text-rose-700">{error}</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="mt-3 bg-white"
            onClick={onRetry}
          >
            Retry
          </Button>
        </div>
      ) : null}

      {loadState === "success" && !topics.length ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-950">
            {hasActiveFilter
              ? "No Speaking topics match these filters."
              : "No Speaking topics yet."}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            {hasActiveFilter
              ? "Try another Part or Status filter."
              : "Speaking topics will appear here after they are added."}
          </p>
        </div>
      ) : null}

      {!error && topics.length ? (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-[900px] w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Part</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Questions</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {topics.map((topic) => (
                <tr key={topic.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    Part {topic.part}
                  </td>
                  <td className="max-w-[260px] px-4 py-3">
                    <p className="font-medium text-slate-950">{topic.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                      {topic.description}
                    </p>
                  </td>
                  <td className="max-w-[220px] break-all px-4 py-3 text-slate-600">
                    {topic.slug}
                  </td>
                  <td className="px-4 py-3">
                    <SpeakingStatusBadge status={topic.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {topic.questionCount}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {formatSpeakingSourceType(topic.sourceType)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDateTime(topic.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={isDetailLoadingId === topic.id}
                      onClick={() => onView(topic)}
                    >
                      {isDetailLoadingId === topic.id ? (
                        <Loader2
                          className="h-4 w-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function SpeakingTopicMetadataModal({
  mode,
  draft,
  errors,
  saveError,
  isSaving,
  onChange,
  onCancel,
  onSave,
}: {
  mode: "create" | "edit";
  draft: SpeakingTopicMetadataDraft;
  errors: SpeakingTopicMetadataErrors;
  saveError: string | null;
  isSaving: boolean;
  onChange: (draft: SpeakingTopicMetadataDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/40 p-4">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-3xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge>Speaking Topic</Badge>
            <h2 className="mt-3 text-lg font-semibold text-slate-950">
              {mode === "create" ? "New Topic" : "Edit Topic Metadata"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Edit topic metadata only. Questions and teaching fields are not
              changed here.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isSaving}
            onClick={onCancel}
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Close
          </Button>
        </div>

        <div className="overflow-y-auto p-4">
          {saveError ? (
            <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {saveError}
            </div>
          ) : null}

          <div className="space-y-4">
            <SpeakingTextInput
              label="Title"
              value={draft.title}
              error={errors.title}
              onChange={(title) => onChange({ ...draft, title })}
            />
            <SpeakingTextInput
              label="Slug"
              value={draft.slug}
              error={errors.slug}
              onChange={(slug) =>
                onChange({ ...draft, slug: slug.trim().toLowerCase() })
              }
              helper="Lowercase letters, numbers, and hyphens only."
            />
            <div className="grid gap-4 md:grid-cols-2">
              <SpeakingSelect
                label="Part"
                value={draft.part}
                onChange={(part) =>
                  onChange({
                    ...draft,
                    part: part as SpeakingTopicMetadataDraft["part"],
                  })
                }
                options={[
                  { value: "1", label: "Part 1" },
                  { value: "2", label: "Part 2" },
                  { value: "3", label: "Part 3" },
                ]}
                error={errors.part}
              />
              <SpeakingSelect
                label="Target Band"
                value={draft.targetBand}
                onChange={(targetBand) => onChange({ ...draft, targetBand })}
                options={targetBandOptions.map((value) => ({
                  value,
                  label: value,
                }))}
                error={errors.targetBand}
              />
              <SpeakingSelect
                label="Source Type"
                value={draft.sourceType}
                onChange={(sourceType) =>
                  onChange({
                    ...draft,
                    sourceType: sourceType as AdminSpeakingSourceType,
                  })
                }
                options={[
                  { value: "manual", label: "Manual" },
                  { value: "ai", label: "AI" },
                ]}
                error={errors.sourceType}
              />
              <SpeakingSelect
                label="Status"
                value={draft.status}
                onChange={(status) =>
                  onChange({ ...draft, status: status as AdminSpeakingStatus })
                }
                options={[
                  { value: "draft", label: "Draft" },
                  { value: "review", label: "Review" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" },
                ]}
                error={errors.status}
              />
            </div>
            <SpeakingTextarea
              label="Description"
              value={draft.description}
              error={errors.description}
              onChange={(description) => onChange({ ...draft, description })}
              helper="Optional. Maximum 600 characters."
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button type="button" disabled={isSaving} onClick={onSave}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function SpeakingTopicDetailModal({
  summary,
  detail,
  error,
  isLoading,
  onEdit,
  onClose,
}: {
  summary: AdminSpeakingTopicSummary;
  detail: AdminSpeakingTopicDetail | null;
  error: string | null;
  isLoading: boolean;
  onEdit: (topic: AdminSpeakingTopicSummary) => void;
  onClose: () => void;
}) {
  const topic = detail ?? summary;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/40 p-4">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-6xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Speaking</Badge>
              <Badge className="bg-white">Part {topic.part}</Badge>
              <Badge className="bg-white">
                {formatSpeakingSourceType(topic.sourceType)}
              </Badge>
              <SpeakingStatusBadge status={topic.status} />
            </div>
            <h2 className="mt-3 text-lg font-semibold text-slate-950">
              {topic.title}
            </h2>
            <p className="mt-1 break-all text-sm text-slate-500">
              Admin Speaking topic detail · {topic.slug}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isLoading}
              onClick={() => onEdit(topic)}
            >
              Edit Topic
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </Button>
          </div>
        </div>

        <div className="overflow-y-auto p-4">
          {isLoading ? (
            <div className="space-y-3" aria-busy="true">
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

          {!isLoading && !error && detail ? (
            <div className="space-y-6">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <SpeakingMetric
                  label="Status"
                  value={formatContentStatus(detail.status)}
                />
                <SpeakingMetric label="Part" value={`Part ${detail.part}`} />
                <SpeakingMetric
                  label="Target Band"
                  value={
                    detail.targetBand == null ? "-" : `Band ${detail.targetBand}`
                  }
                />
                <SpeakingMetric label="Questions" value={`${detail.questionCount}`} />
                <SpeakingMetric
                  label="Source"
                  value={formatSpeakingSourceType(detail.sourceType)}
                />
                <SpeakingMetric
                  label="Published"
                  value={
                    detail.publishedAt ? formatDateTime(detail.publishedAt) : "-"
                  }
                />
                <SpeakingMetric
                  label="Created"
                  value={formatDateTime(detail.createdAt)}
                />
                <SpeakingMetric
                  label="Updated"
                  value={formatDateTime(detail.updatedAt)}
                />
              </div>

              <SpeakingReviewSection title="Topic description">
                <SpeakingTextBlock value={detail.description} />
              </SpeakingReviewSection>

              <SpeakingReviewSection title={`Questions (${detail.questions.length})`}>
                {detail.questions.length ? (
                  <div className="space-y-5">
                    {detail.questions.map((question) => (
                      <SpeakingQuestionDetail
                        key={question.id}
                        question={question}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No questions found for this topic.
                  </div>
                )}
              </SpeakingReviewSection>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function SpeakingQuestionDetail({
  question,
}: {
  question: AdminSpeakingQuestion;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge>Question {question.questionOrder}</Badge>
      </div>

      <div className="mt-4 space-y-4">
        <SpeakingDetailRow label="Question text" value={question.question} />
        {hasSpeakingText(question.answerTip) ? (
          <SpeakingDetailRow label="Answer tip" value={question.answerTip ?? ""} />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-3">
          <SpeakingReviewSection title="Band 6 sample">
            <SpeakingTextBlock value={question.sampleBand6} />
          </SpeakingReviewSection>
          <SpeakingReviewSection title="Band 7 sample">
            <SpeakingTextBlock value={question.sampleBand7} />
          </SpeakingReviewSection>
          <SpeakingReviewSection title="Band 8 sample">
            <SpeakingTextBlock value={question.sampleBand8} />
          </SpeakingReviewSection>
        </div>

        <SpeakingStringListSection
          title="Cue Card Points"
          items={question.cueCardPoints}
        />
        <SpeakingStringListSection
          title="Preparation Ideas"
          items={question.preparationIdeas}
        />
        <SpeakingStringListSection
          title="Suggested Structure"
          items={question.suggestedStructure}
        />

        <SpeakingOptionalTextFields
          fields={[
            ["Direct Answer", question.directAnswer],
            ["Main Reason", question.mainReason],
            ["Example", question.example],
            ["Alternative Perspective", question.alternativePerspective],
          ]}
        />

        <SpeakingUsefulPhrases items={question.usefulPhrases} />
        <SpeakingVocabulary items={question.vocabulary} />
        <SpeakingSentencePatterns items={question.sentencePatterns} />
        <SpeakingCommonMistakes items={question.commonMistakes} />
      </div>
    </article>
  );
}

function SpeakingStringListSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <SpeakingReviewSection title={title}>
      <ul className="list-disc space-y-2 rounded-md border border-slate-200 bg-slate-50 p-4 pl-6 text-sm leading-6 text-slate-700">
        {items.map((item, index) => (
          <li key={`${title}-${index}`}>{item}</li>
        ))}
      </ul>
    </SpeakingReviewSection>
  );
}

function SpeakingOptionalTextFields({
  fields,
}: {
  fields: Array<[string, string | null]>;
}) {
  const visibleFields = fields.filter(([, value]) => hasSpeakingText(value));

  if (!visibleFields.length) {
    return null;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {visibleFields.map(([label, value]) => (
        <div
          key={label}
          className="rounded-md border border-slate-200 bg-slate-50 p-3"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
            {value}
          </p>
        </div>
      ))}
    </div>
  );
}

function SpeakingUsefulPhrases({
  items,
}: {
  items: AdminSpeakingQuestion["usefulPhrases"];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <SpeakingReviewSection title="Useful Phrases">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <SpeakingTeachingCard key={`${item.phrase}-${index}`} title={item.phrase}>
            <SpeakingDetailRow label="Meaning" value={item.meaning} />
            <SpeakingDetailRow label="Example" value={item.example} />
          </SpeakingTeachingCard>
        ))}
      </div>
    </SpeakingReviewSection>
  );
}

function SpeakingVocabulary({
  items,
}: {
  items: AdminSpeakingQuestion["vocabulary"];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <SpeakingReviewSection title="Vocabulary">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <SpeakingTeachingCard
            key={`${item.insteadOf}-${index}`}
            title={item.insteadOf}
          >
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Try
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {item.try.length ? (
                  item.try.map((candidate) => (
                    <Badge key={candidate} className="bg-white">
                      {candidate}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-slate-500">Not provided</span>
                )}
              </div>
            </div>
            <SpeakingDetailRow label="Meaning" value={item.meaning} />
            <SpeakingDetailRow label="Example" value={item.example} />
            <SpeakingDetailRow label="Context" value={item.context} />
          </SpeakingTeachingCard>
        ))}
      </div>
    </SpeakingReviewSection>
  );
}

function SpeakingSentencePatterns({
  items,
}: {
  items: AdminSpeakingQuestion["sentencePatterns"];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <SpeakingReviewSection title="Sentence Patterns">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <SpeakingTeachingCard key={`${item.pattern}-${index}`} title={item.pattern}>
            <SpeakingDetailRow label="Example" value={item.example} />
            <SpeakingDetailRow label="Suitable Use" value={item.suitableUse} />
          </SpeakingTeachingCard>
        ))}
      </div>
    </SpeakingReviewSection>
  );
}

function SpeakingCommonMistakes({
  items,
}: {
  items: AdminSpeakingQuestion["commonMistakes"];
}) {
  if (!items.length) {
    return null;
  }

  return (
    <SpeakingReviewSection title="Common Mistakes">
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item, index) => (
          <SpeakingTeachingCard key={`${item.incorrect}-${index}`} title={item.incorrect}>
            <SpeakingDetailRow label="Better" value={item.better} />
            <SpeakingDetailRow label="Why" value={item.why} />
          </SpeakingTeachingCard>
        ))}
      </div>
    </SpeakingReviewSection>
  );
}

function SpeakingTeachingCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-slate-50 p-4">
      <p className="whitespace-pre-wrap text-sm font-medium leading-6 text-slate-950">
        {title}
      </p>
      {children}
    </div>
  );
}

function SpeakingStatusBadge({ status }: { status: AdminSpeakingStatus }) {
  return (
    <Badge
      className={
        status === "published"
          ? "bg-teal-50 text-teal-800"
          : status === "archived"
            ? "bg-slate-100 text-slate-500"
            : status === "draft"
              ? "bg-white text-slate-700"
              : "bg-amber-50 text-amber-800"
      }
    >
      {formatContentStatus(status)}
    </Badge>
  );
}

function SpeakingSelect({
  label,
  value,
  options,
  error,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <select
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

function SpeakingTextInput({
  label,
  value,
  error,
  helper,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <input
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

function SpeakingTextarea({
  label,
  value,
  error,
  helper,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
  helper?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      {label}
      <textarea
        className="min-h-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
      {error ? <span className="text-xs text-rose-600">{error}</span> : null}
    </label>
  );
}

function SpeakingReviewSection({
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

function SpeakingDetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{value}</dd>
    </div>
  );
}

function SpeakingTextBlock({ value }: { value?: string | null }) {
  return (
    <div className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 p-4 text-sm leading-7 text-slate-700">
      {value || "No content returned."}
    </div>
  );
}

function SpeakingMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-950">{value}</p>
    </div>
  );
}

function buildSpeakingTopicsUrl(
  partFilter: AdminSpeakingPartFilter,
  statusFilter: AdminSpeakingStatusFilter,
) {
  const params = new URLSearchParams();

  if (partFilter !== "all") {
    params.set("part", partFilter);
  }

  if (statusFilter !== "all") {
    params.set("status", statusFilter);
  }

  const query = params.toString();

  return query
    ? `/api/admin/speaking/topics?${query}`
    : "/api/admin/speaking/topics";
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString();
}

function formatContentStatus(status: string) {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSpeakingSourceType(value: string) {
  if (value === "manual") {
    return "Manual";
  }

  if (value === "ai") {
    return "AI";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasSpeakingText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function createEmptyTopicDraft(): SpeakingTopicMetadataDraft {
  return {
    title: "",
    slug: "",
    part: "1",
    description: "",
    targetBand: "7",
    sourceType: "manual",
    status: "draft",
  };
}

function createTopicDraft(
  topic: AdminSpeakingTopicSummary,
): SpeakingTopicMetadataDraft {
  return {
    title: topic.title,
    slug: topic.slug,
    part: String(topic.part) as SpeakingTopicMetadataDraft["part"],
    description: topic.description,
    targetBand: topic.targetBand == null ? "7" : String(topic.targetBand),
    sourceType: topic.sourceType,
    status: topic.status,
  };
}

function isTopicDraftDirty(
  draft: SpeakingTopicMetadataDraft,
  initialDraft: SpeakingTopicMetadataDraft,
) {
  return JSON.stringify(draft) !== JSON.stringify(initialDraft);
}

function validateTopicDraft(
  draft: SpeakingTopicMetadataDraft,
): SpeakingTopicMetadataErrors {
  const errors: SpeakingTopicMetadataErrors = {};
  const title = draft.title.trim();
  const slug = draft.slug.trim();

  if (!title) {
    errors.title = "Title is required.";
  } else if (title.length > 160) {
    errors.title = "Title must be 160 characters or fewer.";
  }

  if (!slug) {
    errors.slug = "Slug is required.";
  } else if (slug.length < 3 || slug.length > 120) {
    errors.slug = "Slug must be 3 to 120 characters.";
  } else if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.slug = "Use lowercase letters, numbers, and hyphens only.";
  } else if (slug.includes("--")) {
    errors.slug = "Slug cannot contain consecutive hyphens.";
  } else if (slug.startsWith("-") || slug.endsWith("-")) {
    errors.slug = "Slug cannot start or end with a hyphen.";
  }

  if (!["1", "2", "3"].includes(draft.part)) {
    errors.part = "Choose a valid Speaking part.";
  }

  if (!targetBandOptions.includes(draft.targetBand)) {
    errors.targetBand = "Choose a valid target band.";
  }

  if (!["manual", "ai"].includes(draft.sourceType)) {
    errors.sourceType = "Choose a valid source type.";
  }

  if (!["draft", "review", "published", "archived"].includes(draft.status)) {
    errors.status = "Choose a valid status.";
  }

  if (draft.description.trim().length > 600) {
    errors.description = "Description must be 600 characters or fewer.";
  }

  return errors;
}

function toTopicMetadataPayload(draft: SpeakingTopicMetadataDraft) {
  return {
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    part: Number(draft.part),
    description: draft.description.trim(),
    targetBand: Number(draft.targetBand),
    sourceType: draft.sourceType,
    status: draft.status,
  };
}

function readApiError(payload: unknown) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
    ? (payload as { error: string }).error
    : null;
}
