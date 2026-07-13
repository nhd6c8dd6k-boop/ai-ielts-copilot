"use client";

import { track } from "@vercel/analytics";
import { useEffect } from "react";

const trackedLabelPatterns = [
  /start/i,
  /practice/i,
  /submit/i,
  /sign in/i,
  /create account/i,
  /dashboard/i,
  /pricing/i,
  /support/i,
  /reading/i,
  /listening/i,
  /writing/i,
  /开始/,
  /练习/,
  /提交/,
  /登录/,
  /注册/,
  /学习记录/,
  /支持/,
];

export function ClickAnalytics() {
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const element = target.closest("a, button");

      if (!(element instanceof HTMLElement)) {
        return;
      }

      const pagePath = window.location.pathname;

      if (pagePath.startsWith("/admin")) {
        return;
      }

      const label = getElementLabel(element);
      const targetPath = getTargetPath(element);

      if (!shouldTrackClick(label, targetPath)) {
        return;
      }

      track("ui_click", {
        element: element.tagName.toLowerCase(),
        label,
        page: pagePath,
        target: targetPath ?? "",
      });
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, []);

  return null;
}

function getElementLabel(element: HTMLElement) {
  const rawLabel =
    element.getAttribute("aria-label") ??
    element.textContent ??
    element.getAttribute("title") ??
    "unlabeled";

  return rawLabel.replace(/\s+/g, " ").trim().slice(0, 80) || "unlabeled";
}

function getTargetPath(element: HTMLElement) {
  if (!(element instanceof HTMLAnchorElement)) {
    return null;
  }

  try {
    const url = new URL(element.href);

    if (url.origin !== window.location.origin) {
      return "external";
    }

    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

function shouldTrackClick(label: string, targetPath: string | null) {
  if (targetPath && targetPath !== "external") {
    return true;
  }

  return trackedLabelPatterns.some((pattern) => pattern.test(label));
}
