"use client";

import { useEffect, useState } from "react";
import { APPS } from "@/lib/app-config";

const MOBILE_BREAKPOINT = 768;
const ROUTE_CHANGE_EVENT = "desktop-route-change";
const DIRECT_APP_ROUTE_IDS = new Set(
  APPS.map((app) => app.id).filter((id) => id !== "notes" && id !== "textedit" && id !== "preview")
);

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
    let routeChangeDispatchScheduled = false;
    const updateFromUrl = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(mobile);

      let pathname = window.location.pathname;
      if (normalizeNotesRootOnDesktop && !mobile && pathname === "/notes") {
        pathname = "/notes/about-me";
        window.history.replaceState(null, "", pathname);
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

    const emitRouteChange = () => {
      if (routeChangeDispatchScheduled) return;
      routeChangeDispatchScheduled = true;
      window.setTimeout(() => {
        routeChangeDispatchScheduled = false;
        window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
      }, 0);
    };
    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;
    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      emitRouteChange();
    };
    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      emitRouteChange();
    };

    updateFromUrl();
    setIsHydrated(true);

    window.addEventListener("resize", updateFromUrl);
    window.addEventListener("popstate", updateFromUrl);
    window.addEventListener(ROUTE_CHANGE_EVENT, updateFromUrl);
    return () => {
      window.removeEventListener("resize", updateFromUrl);
      window.removeEventListener("popstate", updateFromUrl);
      window.removeEventListener(ROUTE_CHANGE_EVENT, updateFromUrl);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [defaultAppId, defaultNoteSlug, normalizeNotesRootOnDesktop]);

  return { isMobile, isHydrated, route };
}
