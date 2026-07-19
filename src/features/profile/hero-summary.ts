export type ProfileHeroProfile = {
  displayName?: string | null;
  createdAt?: string | null;
};

export type ProfileHeroAuthUser = {
  email?: string | null;
  createdAt?: string | null;
  name?: string | null;
};

export type ProfileHeroSubscription = {
  isPro?: boolean | null;
};

export type CompletedPracticeLike = {
  id?: string | null;
  skill?: string | null;
};

export type ProfileHeroSummary = {
  displayName: string;
  email?: string;
  memberSince?: Date;
  membershipStatus: "free" | "pro" | "unknown";
  totalPractice: number | null;
};

export function getProfileHeroSummary({
  profile,
  authUser,
  subscription,
  isMembershipLoading = false,
  isMembershipError = false,
  completedAttempts,
  totalPracticeCount,
  isPracticeCountLoading = false,
  isPracticeCountError = false,
  fallbackName,
}: {
  profile?: ProfileHeroProfile | null;
  authUser?: ProfileHeroAuthUser | null;
  subscription?: ProfileHeroSubscription | null;
  isMembershipLoading?: boolean;
  isMembershipError?: boolean;
  completedAttempts?: CompletedPracticeLike[] | null;
  totalPracticeCount?: number | null;
  isPracticeCountLoading?: boolean;
  isPracticeCountError?: boolean;
  fallbackName: string;
}): ProfileHeroSummary {
  const displayName =
    cleanName(profile?.displayName) ??
    cleanName(authUser?.name) ??
    getEmailPrefix(authUser?.email) ??
    fallbackName;
  const memberSince = parseValidDate(profile?.createdAt ?? authUser?.createdAt);

  return {
    displayName,
    email: cleanName(authUser?.email) ?? undefined,
    memberSince: memberSince ?? undefined,
    membershipStatus:
      isMembershipLoading || isMembershipError
        ? "unknown"
        : subscription?.isPro
          ? "pro"
          : "free",
    totalPractice:
      isPracticeCountLoading || isPracticeCountError
        ? null
        : typeof totalPracticeCount === "number"
          ? Math.max(0, Math.floor(totalPracticeCount))
          : getTotalCompletedPractice(completedAttempts),
  };
}

export function getTotalCompletedPractice(
  attempts?: CompletedPracticeLike[] | null,
) {
  const countedIds = new Set<string>();
  let count = 0;

  for (const [index, attempt] of (attempts ?? []).entries()) {
    const skill = attempt?.skill;

    if (skill !== "reading" && skill !== "listening" && skill !== "writing") {
      continue;
    }

    const dedupeKey = attempt?.id?.trim() || `${skill}-${index}`;

    if (countedIds.has(dedupeKey)) {
      continue;
    }

    countedIds.add(dedupeKey);
    count += 1;
  }

  return count;
}

function cleanName(value?: string | null) {
  const cleaned = value?.trim();

  return cleaned ? cleaned : null;
}

function getEmailPrefix(email?: string | null) {
  const cleanedEmail = cleanName(email);

  if (!cleanedEmail) {
    return null;
  }

  const [prefix] = cleanedEmail.split("@");

  return cleanName(prefix);
}

function parseValidDate(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}
