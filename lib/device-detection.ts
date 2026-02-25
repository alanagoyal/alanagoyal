export const MOBILE_USER_AGENT_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

const IPAD_OS_MAC_PATTERN = /Macintosh/i;
const MOBILE_SAFARI_FRAGMENT_PATTERN = /Mobile\//i;

export const SHELL_POINTER_MEDIA_QUERY = "(pointer: coarse)";
const ANY_POINTER_COARSE_MEDIA_QUERY = "(any-pointer: coarse)";
const ANY_HOVER_NONE_MEDIA_QUERY = "(any-hover: none)";

const MOBILE_MAX_VIEWPORT_WIDTH = 1024;

interface MobileSignals {
  clientHintMobile?: boolean;
  userAgent?: string;
  pointerCoarse?: boolean;
  anyPointerCoarse?: boolean;
  anyHoverNone?: boolean;
  maxTouchPoints?: number;
  viewportWidth?: number;
}

export function isLikelyMobileUserAgent(userAgent: string): boolean {
  if (!userAgent) return false;

  if (MOBILE_USER_AGENT_PATTERN.test(userAgent)) {
    return true;
  }

  // iPadOS can report as Macintosh while still exposing mobile Safari details.
  return IPAD_OS_MAC_PATTERN.test(userAgent) && MOBILE_SAFARI_FRAGMENT_PATTERN.test(userAgent);
}

export function isMobileBySignals(signals: MobileSignals): boolean {
  if (signals.clientHintMobile) {
    return true;
  }

  if (signals.userAgent && isLikelyMobileUserAgent(signals.userAgent)) {
    return true;
  }

  const signalCount = [
    Boolean(signals.pointerCoarse),
    Boolean(signals.anyPointerCoarse),
    Boolean(signals.anyHoverNone),
    (signals.maxTouchPoints ?? 0) > 0,
    typeof signals.viewportWidth === "number" && signals.viewportWidth <= MOBILE_MAX_VIEWPORT_WIDTH,
  ].filter(Boolean).length;

  // Require multiple non-UA signals so touch-enabled laptops do not route to mobile.
  return signalCount >= 3;
}

export function detectMobileClientFromWindow(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const nav = window.navigator;

  return isMobileBySignals({
    userAgent: nav.userAgent,
    pointerCoarse: window.matchMedia(SHELL_POINTER_MEDIA_QUERY).matches,
    anyPointerCoarse: window.matchMedia(ANY_POINTER_COARSE_MEDIA_QUERY).matches,
    anyHoverNone: window.matchMedia(ANY_HOVER_NONE_MEDIA_QUERY).matches,
    maxTouchPoints: nav.maxTouchPoints,
    viewportWidth: window.innerWidth,
  });
}
