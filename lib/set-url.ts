/**
 * Update the browser URL bar without triggering Next.js App Router re-renders.
 *
 * Next.js 16 patches pushState/replaceState - unless the state includes
 * `__NA: true`, every call dispatches ACTION_RESTORE which invalidates the
 * router cache and causes a full re-render cascade (visible as a white flash).
 */
export const APP_SHELL_URL_CHANGE_EVENT = "app-shell-url-change";
type UrlMode = "replace" | "push";
type HistoryMethod = "replaceState" | "pushState";

const NEXT_INTERNAL_HISTORY_STATE = { __NA: true } as const;
const SAFE_HISTORY_STATE = {};
const SHELL_URL_STRATEGY =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_SHELL_URL_STRATEGY?.toLowerCase()
    : undefined;
const FORCE_SAFE_HISTORY = SHELL_URL_STRATEGY === "safe-history";

let hasProbedNextInternalHistory = false;
let nextInternalHistorySupported = true;
let hasWarnedFallback = false;

function dispatchUrlChangeEvent() {
  window.dispatchEvent(new Event(APP_SHELL_URL_CHANGE_EVENT));
}

function warnHistoryFallback(message: string) {
  if (hasWarnedFallback) return;
  hasWarnedFallback = true;
  console.warn(`[set-url] ${message}`);
}

function probeNextInternalHistorySupport() {
  if (hasProbedNextInternalHistory) return;
  hasProbedNextInternalHistory = true;

  if (FORCE_SAFE_HISTORY) {
    nextInternalHistorySupported = false;
    return;
  }

  try {
    window.history.replaceState(NEXT_INTERNAL_HISTORY_STATE, "", window.location.href);
    nextInternalHistorySupported = true;
  } catch {
    nextInternalHistorySupported = false;
    warnHistoryFallback(
      "NEXT_PUBLIC_SHELL_URL_STRATEGY fallback: '__NA' history state is unavailable; using safe history state."
    );
  }
}

function resolveUrl(url: string): URL | null {
  try {
    return new URL(url, window.location.href);
  } catch {
    warnHistoryFallback(`Invalid URL '${url}'.`);
    return null;
  }
}

function writeHistory(method: HistoryMethod, url: string): boolean {
  const historyMethod = window.history[method].bind(window.history);

  probeNextInternalHistorySupport();

  if (nextInternalHistorySupported) {
    try {
      historyMethod(NEXT_INTERNAL_HISTORY_STATE, "", url);
      return true;
    } catch {
      nextInternalHistorySupported = false;
      warnHistoryFallback(
        "Failed to apply '__NA' history state; falling back to safe history state."
      );
    }
  }

  try {
    historyMethod(SAFE_HISTORY_STATE, "", url);
    return true;
  } catch {
    return false;
  }
}

export function safeSetUrl(url: string, mode: UrlMode = "replace") {
  const resolvedUrl = resolveUrl(url);
  if (!resolvedUrl) return;

  if (resolvedUrl.href === window.location.href) return;

  if (resolvedUrl.origin !== window.location.origin) {
    warnHistoryFallback(
      "Cross-origin URL requested via shell history API; using location.assign fallback."
    );
    window.location.assign(resolvedUrl.href);
    return;
  }

  const nextPath = `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`;
  const didWrite = writeHistory(mode === "replace" ? "replaceState" : "pushState", nextPath);
  if (!didWrite) {
    warnHistoryFallback(
      "History API write failed; using location.assign fallback."
    );
    window.location.assign(resolvedUrl.href);
    return;
  }

  dispatchUrlChangeEvent();
}

export function setUrl(url: string) {
  safeSetUrl(url, "replace");
}

export function pushUrl(url: string) {
  safeSetUrl(url, "push");
}
