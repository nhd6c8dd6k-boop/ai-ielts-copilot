"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

import {
  getPracticeHistorySnapshot,
  subscribeToPracticeHistory,
  syncPracticeHistoryFromApi,
  type PracticeHistoryItem,
  type PracticeHistorySyncMode,
} from "@/features/practice-history/storage";

export function useSyncedPracticeHistory() {
  const [syncMode, setSyncMode] =
    useState<PracticeHistorySyncMode>("loading");
  const historySnapshot = useSyncExternalStore(
    subscribeToPracticeHistory,
    getPracticeHistorySnapshot,
    () => "[]",
  );
  const history = useMemo(
    () => parsePracticeHistory(historySnapshot),
    [historySnapshot],
  );

  useEffect(() => {
    let isActive = true;

    async function syncHistory() {
      const result = await syncPracticeHistoryFromApi();

      if (isActive) {
        setSyncMode(result.mode);
      }
    }

    void syncHistory();

    return () => {
      isActive = false;
    };
  }, []);

  return { history, syncMode };
}

function parsePracticeHistory(snapshot: string): PracticeHistoryItem[] {
  try {
    return JSON.parse(snapshot) as PracticeHistoryItem[];
  } catch {
    return [];
  }
}
