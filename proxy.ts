import { NextRequest, NextResponse } from "next/server";

const MOBILE_UA_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;
const RESERVED_NOTES_PATHS = new Set(["/notes/error", "/notes/revalidate", "/notes/api"]);

function isMobileRequest(request: NextRequest): boolean {
  const chMobile = request.headers.get("sec-ch-ua-mobile");
  if (chMobile === "?1") return true;
  if (chMobile === "?0") return false;

  const userAgent = request.headers.get("user-agent") || "";
  return MOBILE_UA_PATTERN.test(userAgent);
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

function isNotesRenderPath(pathname: string): boolean {
  if (RESERVED_NOTES_PATHS.has(pathname)) return false;
  return pathname === "/notes" || /^\/notes\/[^/]+$/.test(pathname);
}

export function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);
  if (!isNotesRenderPath(pathname)) {
    return NextResponse.next();
  }

  const prefix = isMobileRequest(request) ? "/mobile-notes" : "/desktop-notes";
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `${prefix}${pathname}`;
  return NextResponse.rewrite(rewriteUrl);
}

export const config = {
  matcher: ["/notes", "/notes/:path*"],
};
