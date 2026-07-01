"use client";

import { create } from "zustand";

type PracticeState = {
  flaggedQuestionIds: string[];
  toggleFlag: (questionId: string) => void;
  clearFlags: () => void;
};

export const usePracticeStore = create<PracticeState>((set) => ({
  flaggedQuestionIds: [],
  toggleFlag: (questionId) =>
    set((state) => ({
      flaggedQuestionIds: state.flaggedQuestionIds.includes(questionId)
        ? state.flaggedQuestionIds.filter((id) => id !== questionId)
        : [...state.flaggedQuestionIds, questionId],
    })),
  clearFlags: () => set({ flaggedQuestionIds: [] }),
}));
