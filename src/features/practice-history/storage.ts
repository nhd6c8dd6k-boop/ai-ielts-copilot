export type PracticeSkill = "reading" | "writing" | "listening";

export type PracticeHistoryItem = {
  id: string;
  skill: PracticeSkill;
  title: string;
  scoreLabel: string;
  bandEstimate: number;
  accuracy?: number;
  createdAt: string;
  detail: string;
  weakAreas?: string[];
  nextAction?: string;
  resultUrl?: string;
};

export const practiceHistoryStorageKey = "ai-ielts-practice-history";
export const practiceHistoryChangedEvent = "ai-ielts-practice-history-changed";

export type PracticeHistorySyncMode =
  | "loading"
  | "local"
  | "supabase"
  | "anonymous"
  | "error";

type ApiPracticeHistoryItem = {
  id?: string;
  skill?: PracticeSkill;
  title?: string | null;
  score_label?: string | null;
  scoreLabel?: string | null;
  score?: number | null;
  total_questions?: number | null;
  correct_count?: number | null;
  band_estimate?: number | string | null;
  bandEstimate?: number | string | null;
  accuracy?: number | string | null;
  detail?: string | null;
  weak_areas?: string[] | null;
  weakAreas?: string[] | null;
  next_action?: string | null;
  nextAction?: string | null;
  submitted_at?: string | null;
  createdAt?: string | null;
};

type PracticeHistoryApiResponse = {
  mode?: "demo" | "anonymous" | "supabase";
  history?: ApiPracticeHistoryItem[];
  historyItem?: ApiPracticeHistoryItem;
  error?: string;
};

export function readPracticeHistory() {
  if (typeof window === "undefined") {
    return [];
  }

  const rawHistory = window.localStorage.getItem(practiceHistoryStorageKey);

  if (!rawHistory) {
    return [];
  }

  try {
    return JSON.parse(rawHistory) as PracticeHistoryItem[];
  } catch {
    return [];
  }
}

export function appendPracticeHistory(
  item: Omit<PracticeHistoryItem, "id" | "createdAt">,
) {
  if (typeof window === "undefined") {
    return null;
  }

  const nextItem: PracticeHistoryItem = {
    ...item,
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const nextHistory = [nextItem, ...readPracticeHistory()].slice(0, 50);

  writePracticeHistory(nextHistory);
  void persistPracticeHistoryItem(nextItem);

  return nextItem;
}

export function getSkillAverage(
  history: PracticeHistoryItem[],
  skill: PracticeSkill,
) {
  const items = history.filter((item) => item.skill === skill);

  if (!items.length) {
    return null;
  }

  return (
    items.reduce((total, item) => total + item.bandEstimate, 0) / items.length
  );
}

export function subscribeToPracticeHistory(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(practiceHistoryChangedEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(practiceHistoryChangedEvent, callback);
  };
}

export function getPracticeHistorySnapshot() {
  if (typeof window === "undefined") {
    return "[]";
  }

  return window.localStorage.getItem(practiceHistoryStorageKey) ?? "[]";
}

export async function syncPracticeHistoryFromApi(): Promise<{
  mode: PracticeHistorySyncMode;
}> {
  if (typeof window === "undefined") {
    return { mode: "local" };
  }

  try {
    const response = await fetch("/api/practice-history", { cache: "no-store" });
    const payload = (await response.json()) as PracticeHistoryApiResponse;

    if (!response.ok) {
      return { mode: "error" };
    }

    if (payload.mode === "supabase") {
      const remoteHistory = (payload.history ?? [])
        .map(mapApiHistoryItem)
        .filter((item): item is PracticeHistoryItem => Boolean(item));
      const mergedHistory = mergePracticeHistory(
        remoteHistory,
        readPracticeHistory(),
      );

      writePracticeHistory(mergedHistory);

      return { mode: "supabase" };
    }

    return { mode: payload.mode === "anonymous" ? "anonymous" : "local" };
  } catch {
    return { mode: "error" };
  }
}

function writePracticeHistory(history: PracticeHistoryItem[]) {
  window.localStorage.setItem(
    practiceHistoryStorageKey,
    JSON.stringify(history.slice(0, 50)),
  );
  window.dispatchEvent(new Event(practiceHistoryChangedEvent));
}

async function persistPracticeHistoryItem(item: PracticeHistoryItem) {
  try {
    await fetch("/api/practice-history", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        skill: item.skill,
        setType: "practice",
        title: item.title,
        scoreLabel: item.scoreLabel,
        score:
          typeof item.accuracy === "number"
            ? Number(item.accuracy.toFixed(2))
            : undefined,
        bandEstimate: item.bandEstimate,
        accuracy: item.accuracy,
        detail: item.detail,
        weakAreas: item.weakAreas ?? [],
        nextAction: item.nextAction,
        timeSpentSeconds: 0,
        answers: {},
      }),
    });
  } catch {
    // Local history already saved; cloud sync can retry on the next dashboard load.
  }
}

function mapApiHistoryItem(
  item: ApiPracticeHistoryItem,
): PracticeHistoryItem | null {
  if (!item.skill || !["reading", "listening", "writing"].includes(item.skill)) {
    return null;
  }

  const bandEstimate = Number(item.band_estimate ?? item.bandEstimate ?? 0);

  return {
    id: item.id ?? `${item.skill}-${item.submitted_at ?? item.createdAt}`,
    skill: item.skill,
    title: item.title ?? `${capitalizeSkill(item.skill)} practice`,
    scoreLabel:
      item.score_label ??
      item.scoreLabel ??
      formatCorrectScore(item.correct_count, item.total_questions) ??
      (Number.isFinite(bandEstimate) && bandEstimate > 0
        ? `Band ${bandEstimate.toFixed(1)}`
        : "Submitted"),
    bandEstimate: Number.isFinite(bandEstimate) && bandEstimate > 0 ? bandEstimate : 6,
    accuracy:
      item.accuracy === null || item.accuracy === undefined
        ? undefined
        : Number(item.accuracy),
    createdAt: item.submitted_at ?? item.createdAt ?? new Date().toISOString(),
    detail: item.detail ?? "Synced practice record",
    weakAreas: item.weak_areas ?? item.weakAreas ?? [],
    nextAction: item.next_action ?? item.nextAction ?? undefined,
    resultUrl:
      item.skill === "reading" && item.id
        ? `/result/reading/${item.id}`
        : item.skill === "listening" && item.id
          ? `/result/listening/${item.id}`
        : item.skill === "writing" && item.id
          ? `/result/writing/${item.id}`
          : undefined,
  };
}

function formatCorrectScore(
  correctCount?: number | null,
  totalQuestions?: number | null,
) {
  if (
    typeof correctCount !== "number" ||
    typeof totalQuestions !== "number" ||
    totalQuestions <= 0
  ) {
    return null;
  }

  return `${correctCount}/${totalQuestions} correct`;
}

function mergePracticeHistory(
  remoteHistory: PracticeHistoryItem[],
  localHistory: PracticeHistoryItem[],
) {
  const itemsById = new Map<string, PracticeHistoryItem>();

  [...remoteHistory, ...localHistory].forEach((item) => {
    itemsById.set(item.id, item);
  });

  return [...itemsById.values()]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 50);
}

function capitalizeSkill(skill: PracticeSkill) {
  return skill.charAt(0).toUpperCase() + skill.slice(1);
}
