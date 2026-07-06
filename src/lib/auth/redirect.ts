export function getSafeRedirectPath(
  value: string | string[] | null | undefined,
  fallback = "/dashboard",
) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue || !rawValue.startsWith("/") || rawValue.startsWith("//")) {
    return fallback;
  }

  try {
    const url = new URL(rawValue, "https://ai-ielts-copilot.local");

    if (url.origin !== "https://ai-ielts-copilot.local") {
      return fallback;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function buildLoginRedirectHref(path: string) {
  return `/login?redirect=${encodeURIComponent(getSafeRedirectPath(path, "/practice"))}`;
}

export function buildRegisterRedirectHref(path: string) {
  return `/register?redirect=${encodeURIComponent(
    getSafeRedirectPath(path, "/practice"),
  )}`;
}

export function appendInternalSearchParam(
  path: string,
  key: string,
  value: string,
) {
  const url = new URL(
    getSafeRedirectPath(path, "/dashboard"),
    "https://ai-ielts-copilot.local",
  );

  url.searchParams.set(key, value);

  return `${url.pathname}${url.search}${url.hash}`;
}
