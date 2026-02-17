"use client";

import { useEffect, useState } from "react";
import { APPS } from "@/lib/app-config";

const MOBILE_BREAKPOINT = 768;
const ROUTE_CHANGE_EVENT = "desktop-route-change";
const DIRECT_APP_ROUTE_IDS = new Set(
  APPS.map((app) => app.id).filter((id) => id !== "notes" && id !== "textedit" && id !== "preview")
);

let routeChangeDispatchScheduled = false;

export function notifyDesktopRouteChange(): void {
  if (routeChangeDispatchScheduled) return;
  routeChangeDispatchScheduled = true;
  window.setTimeout(() => {
    routeChangeDispatchScheduled = false;
    window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
  }, 0);
}

export function replaceDesktopRoute(url: string): void {
  window.history.replaceState(null, "", url);
  notifyDesktopRouteChange();
}

export function pushDesktopRoute(url: string): void {
  window.history.pushState(null, "", url);
  notifyDesktopRouteChange();
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
  isMobileRootResizeHandoff: boolean;
  route: DesktopShellRouteState;
} {
  const [isMobile, setIsMobile] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isMobileRootResizeHandoff, setIsMobileRootResizeHandoff] = useState(false);
  const [route, setRoute] = useState<DesktopShellRouteState>(() => ({
    appId: defaultAppId,
    ...(defaultAppId === "notes" ? { noteSlug: defaultNoteSlug } : {}),
  }));

  useEffect(() => {
    let lastMobile: boolean | null = null;
    const updateFromUrl = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (lastMobile === false && mobile && window.location.pathname === "/") {
        setIsMobileRootResizeHandoff(true);
      } else if (!mobile || window.location.pathname !== "/") {
        setIsMobileRootResizeHandoff(false);
      }
      lastMobile = mobile;
      setIsMobile(mobile);

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

    window.addEventListener("resize", updateFromUrl);
    window.addEventListener("popstate", updateFromUrl);
    window.addEventListener(ROUTE_CHANGE_EVENT, updateFromUrl);
    return () => {
      window.removeEventListener("resize", updateFromUrl);
      window.removeEventListener("popstate", updateFromUrl);
      window.removeEventListener(ROUTE_CHANGE_EVENT, updateFromUrl);
    };
  }, [defaultAppId, defaultNoteSlug, normalizeNotesRootOnDesktop]);

  return { isMobile, isHydrated, isMobileRootResizeHandoff, route };
}
