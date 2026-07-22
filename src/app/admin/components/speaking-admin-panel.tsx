"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import {
  parseSpeakingDetailPayload,
  parseSpeakingQuestionPayload,
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

type SpeakingQuestionEditorState =
  | { mode: "create"; topic: AdminSpeakingTopicDetail }
  | {
      mode: "edit";
      topic: AdminSpeakingTopicDetail;
      question: AdminSpeakingQuestion;
    };

type SpeakingQuestionDraft = {
  questionOrder: string;
  question: string;
  answerTip: string;
  cueCardPoints: string;
  preparationIdeas: string;
  suggestedStructure: string;
  directAnswer: string;
  mainReason: string;
  example: string;
  alternativePerspective: string;
  sampleBand6: string;
  sampleBand7: string;
  sampleBand8: string;
};

type SpeakingQuestionDraftErrors = Partial<
  Record<keyof SpeakingQuestionDraft, string>
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
  const [questionEditorState, setQuestionEditorState] =
    useState<SpeakingQuestionEditorState | null>(null);
  const [questionDraft, setQuestionDraft] =
    useState<SpeakingQuestionDraft>(createEmptyQuestionDraft);
  const [questionInitialDraft, setQuestionInitialDraft] =
    useState<SpeakingQuestionDraft>(createEmptyQuestionDraft);
  const [questionErrors, setQuestionErrors] =
    useState<SpeakingQuestionDraftErrors>({});
  const [questionSaveError, setQuestionSaveError] = useState<string | null>(null);
  const [isQuestionSaving, setIsQuestionSaving] = useState(false);
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const topicsRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const questionMutationRequestIdRef = useRef(0);
  const detailControllerRef = useRef<AbortController | null>(null);
  const questionMutationControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const toastTimerRef = useRef<number | null>(null);
  const hasReportedTopicCountRef = useRef(false);

  const abortQuestionMutation = useCallback(() => {
    questionMutationControllerRef.current?.abort();
    questionMutationControllerRef.current = null;
    questionMutationRequestIdRef.current += 1;
  }, []);

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
    setQuestionEditorState(null);
    setQuestionSaveError(null);
    setQuestionErrors({});
    setIsQuestionSaving(false);
    setDeletingQuestionId(null);
  }, []);

  const canUseQuestionMutationResponse = useCallback(
    (requestId: number, controller: AbortController) =>
      isMountedRef.current &&
      isActiveRef.current &&
      questionMutationRequestIdRef.current === requestId &&
      !controller.signal.aborted,
    [],
  );

  useEffect(() => {
    isActiveRef.current = isActive;

    if (isActive) {
      return;
    }

    abortQuestionMutation();
    abortDetailRequest();
    const resetTimer = window.setTimeout(() => {
      setToastMessage(null);
      resetDetailState();
    }, 0);

    return () => window.clearTimeout(resetTimer);
  }, [abortDetailRequest, abortQuestionMutation, isActive, resetDetailState]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      abortQuestionMutation();
      abortDetailRequest();
    };
  }, [abortDetailRequest, abortQuestionMutation]);

  useEffect(
    () => () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    },
    [],
  );

  const showToast = useCallback((message: string) => {
    setToastMessage(message);

    if (toastTimerRef.current !== null) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  }, []);

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

  const openCreateQuestion = (topic: AdminSpeakingTopicDetail) => {
    abortQuestionMutation();
    const draft = createEmptyQuestionDraft(topic);
    setQuestionEditorState({ mode: "create", topic });
    setQuestionDraft(draft);
    setQuestionInitialDraft(draft);
    setQuestionErrors({});
    setQuestionSaveError(null);
  };

  const openEditQuestion = (
    topic: AdminSpeakingTopicDetail,
    question: AdminSpeakingQuestion,
  ) => {
    abortQuestionMutation();
    const draft = createQuestionDraft(question);
    setQuestionEditorState({ mode: "edit", topic, question });
    setQuestionDraft(draft);
    setQuestionInitialDraft(draft);
    setQuestionErrors({});
    setQuestionSaveError(null);
  };

  const closeQuestionEditor = () => {
    if (
      isQuestionDraftDirty(questionDraft, questionInitialDraft) &&
      !window.confirm("Discard changes?")
    ) {
      return;
    }

    abortQuestionMutation();
    setQuestionEditorState(null);
    setQuestionErrors({});
    setQuestionSaveError(null);
    setIsQuestionSaving(false);
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

  const saveQuestion = async () => {
    if (!questionEditorState) {
      return;
    }

    const topic = questionEditorState.topic;
    const validation = validateQuestionDraft(questionDraft, topic.part);

    if (Object.keys(validation).length) {
      setQuestionErrors(validation);
      return;
    }

    if (mode !== "admin") {
      setQuestionSaveError("Speaking question editing is available after admin login.");
      return;
    }

    abortQuestionMutation();
    const controller = new AbortController();
    questionMutationControllerRef.current = controller;
    const requestId = questionMutationRequestIdRef.current + 1;
    questionMutationRequestIdRef.current = requestId;

    setIsQuestionSaving(true);
    setQuestionErrors({});
    setQuestionSaveError(null);

    try {
      const response = await fetch(
        questionEditorState.mode === "create"
          ? `/api/admin/speaking/topics/${topic.id}/questions`
          : `/api/admin/speaking/topics/${topic.id}/questions/${questionEditorState.question.id}`,
        {
          method: questionEditorState.mode === "create" ? "POST" : "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          cache: "no-store",
          signal: controller.signal,
          body: JSON.stringify(toQuestionPayload(questionDraft, topic.part)),
        },
      );
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          readApiError(payload) ?? "Failed to save Speaking question.",
        );
      }

      parseSpeakingQuestionPayload(payload);

      if (canUseQuestionMutationResponse(requestId, controller)) {
        setQuestionEditorState(null);
        setQuestionInitialDraft(questionDraft);
        showToast(
          questionEditorState.mode === "create"
            ? "Speaking question created."
            : "Speaking question updated.",
        );
        setRetryKey((key) => key + 1);
        await viewTopic(topic);
      }
    } catch (saveError) {
      if (isAbortError(saveError)) {
        return;
      }

      if (canUseQuestionMutationResponse(requestId, controller)) {
        setQuestionSaveError(
          saveError instanceof Error
            ? saveError.message
            : "Failed to save Speaking question.",
        );
      }
    } finally {
      if (canUseQuestionMutationResponse(requestId, controller)) {
        questionMutationControllerRef.current = null;
        setIsQuestionSaving(false);
      }
    }
  };

  const deleteQuestion = async (
    topic: AdminSpeakingTopicDetail,
    question: AdminSpeakingQuestion,
  ) => {
    if (!window.confirm("Delete this question? This action cannot be undone.")) {
      return;
    }

    if (mode !== "admin") {
      setDetailError("Speaking question editing is available after admin login.");
      return;
    }

    abortQuestionMutation();
    const controller = new AbortController();
    questionMutationControllerRef.current = controller;
    const requestId = questionMutationRequestIdRef.current + 1;
    questionMutationRequestIdRef.current = requestId;

    setDeletingQuestionId(question.id);
    setDetailError(null);

    try {
      const response = await fetch(
        `/api/admin/speaking/topics/${topic.id}/questions/${question.id}`,
        {
          method: "DELETE",
          cache: "no-store",
          signal: controller.signal,
        },
      );
      const payload = await readJsonResponse(response);

      if (!response.ok) {
        throw new Error(
          readApiError(payload) ?? "Failed to delete Speaking question.",
        );
      }

      if (canUseQuestionMutationResponse(requestId, controller)) {
        showToast("Speaking question deleted.");
        setRetryKey((key) => key + 1);
        await viewTopic(topic);
      }
    } catch (deleteError) {
      if (isAbortError(deleteError)) {
        return;
      }

      if (canUseQuestionMutationResponse(requestId, controller)) {
        setDetailError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete Speaking question.",
        );
      }
    } finally {
      if (canUseQuestionMutationResponse(requestId, controller)) {
        questionMutationControllerRef.current = null;
        setDeletingQuestionId(null);
      }
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
          onCreateQuestion={openCreateQuestion}
          onEditQuestion={openEditQuestion}
          onDeleteQuestion={deleteQuestion}
          deletingQuestionId={deletingQuestionId}
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

      {questionEditorState ? (
        <SpeakingQuestionMetadataModal
          mode={questionEditorState.mode}
          topicPart={questionEditorState.topic.part}
          draft={questionDraft}
          errors={questionErrors}
          saveError={questionSaveError}
          isSaving={isQuestionSaving}
          onChange={setQuestionDraft}
          onCancel={closeQuestionEditor}
          onSave={saveQuestion}
        />
      ) : null}

      {toastMessage ? (
        <div className="fixed right-4 top-4 z-[80] max-w-sm rounded-md border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg">
          {toastMessage}
        </div>
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

function SpeakingQuestionMetadataModal({
  mode,
  topicPart,
  draft,
  errors,
  saveError,
  isSaving,
  onChange,
  onCancel,
  onSave,
}: {
  mode: "create" | "edit";
  topicPart: 1 | 2 | 3;
  draft: SpeakingQuestionDraft;
  errors: SpeakingQuestionDraftErrors;
  saveError: string | null;
  isSaving: boolean;
  onChange: (draft: SpeakingQuestionDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-slate-950/40 p-4">
      <div className="mx-auto flex max-h-[calc(100vh-2rem)] max-w-4xl flex-col overflow-hidden rounded-md border border-slate-200 bg-white shadow-2xl">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Badge>Speaking Question</Badge>
            <h2 className="mt-3 text-lg font-semibold text-slate-950">
              {mode === "create" ? "New Question" : "Edit Question"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Edit question text and sample answers only. Teaching fields remain
              unchanged.
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

          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[160px_1fr]">
              <SpeakingTextInput
                label="Display order"
                value={draft.questionOrder}
                error={errors.questionOrder}
                onChange={(questionOrder) =>
                  onChange({ ...draft, questionOrder })
                }
              />
              <SpeakingTextarea
                label="Question Text"
                value={draft.question}
                error={errors.question}
                onChange={(question) => onChange({ ...draft, question })}
              />
            </div>

            <SpeakingTextarea
              label="Answer Tip / Guidance"
              value={draft.answerTip}
              error={errors.answerTip}
              onChange={(answerTip) => onChange({ ...draft, answerTip })}
              helper="Optional. Keep this short and directly useful."
            />

            {topicPart === 2 ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <SpeakingTextarea
                  label="Cue Card Points"
                  value={draft.cueCardPoints}
                  error={errors.cueCardPoints}
                  onChange={(cueCardPoints) =>
                    onChange({ ...draft, cueCardPoints })
                  }
                  helper="One point per line."
                />
                <SpeakingTextarea
                  label="Preparation Ideas"
                  value={draft.preparationIdeas}
                  error={errors.preparationIdeas}
                  onChange={(preparationIdeas) =>
                    onChange({ ...draft, preparationIdeas })
                  }
                  helper="One idea per line."
                />
                <SpeakingTextarea
                  label="Suggested Structure"
                  value={draft.suggestedStructure}
                  error={errors.suggestedStructure}
                  onChange={(suggestedStructure) =>
                    onChange({ ...draft, suggestedStructure })
                  }
                  helper="One step per line."
                />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                <SpeakingTextarea
                  label="Direct Answer"
                  value={draft.directAnswer}
                  error={errors.directAnswer}
                  onChange={(directAnswer) =>
                    onChange({ ...draft, directAnswer })
                  }
                />
                <SpeakingTextarea
                  label="Main Reason"
                  value={draft.mainReason}
                  error={errors.mainReason}
                  onChange={(mainReason) => onChange({ ...draft, mainReason })}
                />
                <SpeakingTextarea
                  label="Example"
                  value={draft.example}
                  error={errors.example}
                  onChange={(example) => onChange({ ...draft, example })}
                />
                <SpeakingTextarea
                  label="Alternative Perspective"
                  value={draft.alternativePerspective}
                  error={errors.alternativePerspective}
                  onChange={(alternativePerspective) =>
                    onChange({ ...draft, alternativePerspective })
                  }
                />
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <SpeakingTextarea
                label="Band 6 Sample Answer"
                value={draft.sampleBand6}
                error={errors.sampleBand6}
                onChange={(sampleBand6) => onChange({ ...draft, sampleBand6 })}
              />
              <SpeakingTextarea
                label="Band 7 Sample Answer"
                value={draft.sampleBand7}
                error={errors.sampleBand7}
                onChange={(sampleBand7) => onChange({ ...draft, sampleBand7 })}
              />
              <SpeakingTextarea
                label="Band 8 Sample Answer"
                value={draft.sampleBand8}
                error={errors.sampleBand8}
                onChange={(sampleBand8) => onChange({ ...draft, sampleBand8 })}
              />
            </div>
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
            Save Question
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
  onCreateQuestion,
  onEditQuestion,
  onDeleteQuestion,
  deletingQuestionId,
  onClose,
}: {
  summary: AdminSpeakingTopicSummary;
  detail: AdminSpeakingTopicDetail | null;
  error: string | null;
  isLoading: boolean;
  onEdit: (topic: AdminSpeakingTopicSummary) => void;
  onCreateQuestion: (topic: AdminSpeakingTopicDetail) => void;
  onEditQuestion: (
    topic: AdminSpeakingTopicDetail,
    question: AdminSpeakingQuestion,
  ) => void;
  onDeleteQuestion: (
    topic: AdminSpeakingTopicDetail,
    question: AdminSpeakingQuestion,
  ) => void;
  deletingQuestionId: string | null;
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
            {detail ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isLoading}
                onClick={() => onCreateQuestion(detail)}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New Question
              </Button>
            ) : null}
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
                        topic={detail}
                        question={question}
                        isDeleting={deletingQuestionId === question.id}
                        onEdit={onEditQuestion}
                        onDelete={onDeleteQuestion}
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
  topic,
  question,
  isDeleting,
  onEdit,
  onDelete,
}: {
  topic: AdminSpeakingTopicDetail;
  question: AdminSpeakingQuestion;
  isDeleting: boolean;
  onEdit: (
    topic: AdminSpeakingTopicDetail,
    question: AdminSpeakingQuestion,
  ) => void;
  onDelete: (
    topic: AdminSpeakingTopicDetail,
    question: AdminSpeakingQuestion,
  ) => void;
}) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Question {question.questionOrder}</Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onEdit(topic, question)}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            Edit
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onDelete(topic, question)}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            )}
            Delete
          </Button>
        </div>
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

function createEmptyQuestionDraft(
  topic?: AdminSpeakingTopicDetail,
): SpeakingQuestionDraft {
  const nextOrder =
    topic == null
      ? 1
      : Math.max(0, ...topic.questions.map((question) => question.questionOrder)) +
        1;

  return {
    questionOrder: String(nextOrder),
    question: "",
    answerTip: "",
    cueCardPoints: "",
    preparationIdeas: "",
    suggestedStructure: "",
    directAnswer: "",
    mainReason: "",
    example: "",
    alternativePerspective: "",
    sampleBand6: "",
    sampleBand7: "",
    sampleBand8: "",
  };
}

function createQuestionDraft(
  question: AdminSpeakingQuestion,
): SpeakingQuestionDraft {
  return {
    questionOrder: String(question.questionOrder),
    question: question.question,
    answerTip: question.answerTip ?? "",
    cueCardPoints: question.cueCardPoints.join("\n"),
    preparationIdeas: question.preparationIdeas.join("\n"),
    suggestedStructure: question.suggestedStructure.join("\n"),
    directAnswer: question.directAnswer ?? "",
    mainReason: question.mainReason ?? "",
    example: question.example ?? "",
    alternativePerspective: question.alternativePerspective ?? "",
    sampleBand6: question.sampleBand6,
    sampleBand7: question.sampleBand7,
    sampleBand8: question.sampleBand8,
  };
}

function isTopicDraftDirty(
  draft: SpeakingTopicMetadataDraft,
  initialDraft: SpeakingTopicMetadataDraft,
) {
  return JSON.stringify(draft) !== JSON.stringify(initialDraft);
}

function isQuestionDraftDirty(
  draft: SpeakingQuestionDraft,
  initialDraft: SpeakingQuestionDraft,
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

function validateQuestionDraft(
  draft: SpeakingQuestionDraft,
  topicPart: 1 | 2 | 3,
): SpeakingQuestionDraftErrors {
  const errors: SpeakingQuestionDraftErrors = {};
  const questionOrder = Number(draft.questionOrder);

  if (!Number.isInteger(questionOrder) || questionOrder < 1 || questionOrder > 200) {
    errors.questionOrder = "Use a whole number from 1 to 200.";
  }

  validateRequiredText(errors, "question", draft.question, 1000);
  validateOptionalText(errors, "answerTip", draft.answerTip, 1000);
  validateRequiredText(errors, "sampleBand6", draft.sampleBand6, 3000);
  validateRequiredText(errors, "sampleBand7", draft.sampleBand7, 3000);
  validateRequiredText(errors, "sampleBand8", draft.sampleBand8, 3000);

  if (topicPart === 2) {
    validateStringList(errors, "cueCardPoints", draft.cueCardPoints);
    validateStringList(errors, "preparationIdeas", draft.preparationIdeas);
    validateStringList(errors, "suggestedStructure", draft.suggestedStructure);
  } else {
    validateOptionalText(errors, "directAnswer", draft.directAnswer, 1000);
    validateOptionalText(errors, "mainReason", draft.mainReason, 1000);
    validateOptionalText(errors, "example", draft.example, 1000);
    validateOptionalText(
      errors,
      "alternativePerspective",
      draft.alternativePerspective,
      1000,
    );
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

function toQuestionPayload(draft: SpeakingQuestionDraft, topicPart: 1 | 2 | 3) {
  return {
    questionOrder: Number(draft.questionOrder),
    question: draft.question.trim(),
    answerTip: toNullableText(draft.answerTip),
    cueCardPoints: topicPart === 2 ? toStringList(draft.cueCardPoints) : [],
    preparationIdeas: topicPart === 2 ? toStringList(draft.preparationIdeas) : [],
    suggestedStructure:
      topicPart === 2 ? toStringList(draft.suggestedStructure) : [],
    directAnswer: topicPart === 2 ? null : toNullableText(draft.directAnswer),
    mainReason: topicPart === 2 ? null : toNullableText(draft.mainReason),
    example: topicPart === 2 ? null : toNullableText(draft.example),
    alternativePerspective:
      topicPart === 2 ? null : toNullableText(draft.alternativePerspective),
    sampleBand6: draft.sampleBand6.trim(),
    sampleBand7: draft.sampleBand7.trim(),
    sampleBand8: draft.sampleBand8.trim(),
  };
}

function validateRequiredText(
  errors: SpeakingQuestionDraftErrors,
  field: keyof SpeakingQuestionDraft,
  value: string,
  maxLength: number,
) {
  const trimmed = value.trim();

  if (!trimmed) {
    errors[field] = "This field is required.";
  } else if (trimmed.length > maxLength) {
    errors[field] = `Use ${maxLength} characters or fewer.`;
  }
}

function validateOptionalText(
  errors: SpeakingQuestionDraftErrors,
  field: keyof SpeakingQuestionDraft,
  value: string,
  maxLength: number,
) {
  if (value.trim().length > maxLength) {
    errors[field] = `Use ${maxLength} characters or fewer.`;
  }
}

function validateStringList(
  errors: SpeakingQuestionDraftErrors,
  field: keyof SpeakingQuestionDraft,
  value: string,
) {
  const items = toStringList(value);
  const hasTooManyItems = items.length > 12;
  const hasLongItem = items.some((item) => item.length > 300);

  if (hasTooManyItems) {
    errors[field] = "Use 12 items or fewer.";
  } else if (hasLongItem) {
    errors[field] = "Each item must be 300 characters or fewer.";
  }
}

function toNullableText(value: string) {
  const trimmed = value.trim();

  return trimmed ? trimmed : null;
}

function toStringList(value: string) {
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function readApiError(payload: unknown) {
  return payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
    ? (payload as { error: string }).error
    : null;
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
