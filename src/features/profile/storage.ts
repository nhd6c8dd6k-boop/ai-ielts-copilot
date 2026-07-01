export type StudyProfile = {
  displayName: string;
  targetBand: string;
  examDate: string;
  country: string;
  timezone: string;
  plan: "Free" | "Pro Monthly" | "Pro Yearly";
};

export const profileStorageKey = "ai-ielts-study-profile";

export const defaultStudyProfile: StudyProfile = {
  displayName: "IELTS Candidate",
  targetBand: "7.0",
  examDate: "",
  country: "China",
  timezone: "Asia/Shanghai",
  plan: "Free",
};

export function readStudyProfile() {
  if (typeof window === "undefined") {
    return defaultStudyProfile;
  }

  const rawProfile = window.localStorage.getItem(profileStorageKey);

  if (!rawProfile) {
    return defaultStudyProfile;
  }

  try {
    return {
      ...defaultStudyProfile,
      ...(JSON.parse(rawProfile) as Partial<StudyProfile>),
    };
  } catch {
    return defaultStudyProfile;
  }
}

export function saveStudyProfile(profile: StudyProfile) {
  window.localStorage.setItem(profileStorageKey, JSON.stringify(profile));
}
