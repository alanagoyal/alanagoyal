"use client";

/**
 * Desktop route synchronization.
 *
 * Page-level components use `useDesktopShellRoute` to read the current URL and
 * derive which app/file to show. The hook automatically detects URL changes from
 * history.pushState, history.replaceState, and popstate (back/forward navigation).
 *
 * `replaceDesktopRoute` is a convenience wrapper around history.replaceState, but
 * calling history.replaceState directly also works — the hook intercepts both.
 */

import { useEffect, useState } from "react";
import { APPS } from "@/lib/app-config";

const HISTORY_STATE_CHANGE_EVENT = "historystatechange";
const DIRECT_APP_ROUTE_IDS = new Set(
  APPS.map((app) => app.id).filter((id) => id !== "notes" && id !== "textedit" && id !== "preview")
);

// Patch history.pushState/replaceState once so ANY call (ours or third-party)
// fires an event the hook can listen for. The event is deferred via microtask
// to avoid re-entrant state updates (e.g. updateFromUrl → replaceState → event
// → updateFromUrl again) and to stay out of restricted React phases.
let historyEventPending = false;
function scheduleHistoryEvent() {
  if (historyEventPending) return;
  historyEventPending = true;
  Promise.resolve().then(() => {
    historyEventPending = false;
    window.dispatchEvent(new Event(HISTORY_STATE_CHANGE_EVENT));
  });
}

if (typeof window !== "undefined") {
  const origPushState = history.pushState.bind(history);
  const origReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args: Parameters<typeof origPushState>) {
    origPushState(...args);
    scheduleHistoryEvent();
  };

  history.replaceState = function (...args: Parameters<typeof origReplaceState>) {
    origReplaceState(...args);
    scheduleHistoryEvent();
  };
}

export function replaceDesktopRoute(url: string): void {
  window.history.replaceState(null, "", url);
}

export interface DesktopShellRouteState {
  appId?: string;
  noteSlug?: string;
  textEditFile?: string;
  previewFile?: string;
}

interface UseDesktopShellRouteOptions {
  defaultAppId: string;
  defaultNoteSlug?: string;
  normalizeNotesRootOnDesktop?: boolean;
}

function parseDesktopRoute(
  pathname: string,
  search: string,
  fallbackAppId: string,
  fallbackNoteSlug?: string
): DesktopShellRouteState {
  const searchParams = new URLSearchParams(search);
  const fileParam = searchParams.get("file") || undefined;
  const pathSegments = pathname.split("/").filter(Boolean);
  const rootSegment = pathSegments[0] || "";

  if (!rootSegment) {
    return {};
  }

  if (rootSegment === "notes") {
    const match = pathname.match(/^\/notes\/(.+)$/);
    return {
      appId: "notes",
      noteSlug: match ? match[1] : undefined,
    };
  }
  if (rootSegment === "textedit") {
    return { appId: "textedit", textEditFile: fileParam };
  }
  if (rootSegment === "preview") {
    return { appId: "preview", previewFile: fileParam };
  }
  if (DIRECT_APP_ROUTE_IDS.has(rootSegment)) {
    return { appId: rootSegment };
  }

  return {
    appId: fallbackAppId,
    ...(fallbackAppId === "notes" ? { noteSlug: fallbackNoteSlug } : {}),
  };
}

export function useDesktopShellRoute({
  defaultAppId,
  defaultNoteSlug,
  normalizeNotesRootOnDesktop = false,
}: UseDesktopShellRouteOptions): {
  isMobile: boolean;
  isHydrated: boolean;
  route: DesktopShellRouteState;
} {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [route, setRoute] = useState<DesktopShellRouteState>(() => ({
    appId: defaultAppId,
    ...(defaultAppId === "notes" ? { noteSlug: defaultNoteSlug } : {}),
  }));

  useEffect(() => {
    const mobile = window.matchMedia("(pointer: coarse)").matches;
    setIsMobile(mobile);

    const updateFromUrl = () => {
      let pathname = window.location.pathname;
      if (normalizeNotesRootOnDesktop && !mobile && pathname === "/notes") {
        pathname = "/notes/about-me";
        replaceDesktopRoute(pathname);
      }

      setRoute(
        parseDesktopRoute(
          pathname,
          window.location.search,
          defaultAppId,
          defaultNoteSlug
        )
      );
    };

    updateFromUrl();
    setIsHydrated(true);

    window.addEventListener("popstate", updateFromUrl);
    window.addEventListener(HISTORY_STATE_CHANGE_EVENT, updateFromUrl);
    return () => {
      window.removeEventListener("popstate", updateFromUrl);
      window.removeEventListener(HISTORY_STATE_CHANGE_EVENT, updateFromUrl);
    };
  }, [defaultAppId, defaultNoteSlug, normalizeNotesRootOnDesktop]);

  return { isMobile, isHydrated, route };
}
