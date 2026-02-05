import { NextRequest, NextResponse } from "next/server";

const ALLOWED_REMOTE_HOSTS = new Set(["raw.githubusercontent.com", "media.githubusercontent.com"]);
const ALLOWED_LOCAL_PREFIXES = ["/documents/"];

function isAllowedLocalPath(pathname: string): boolean {
  return ALLOWED_LOCAL_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function getSafeFilename(pathname: string): string {
  const lastSegment = pathname.split("/").pop() || "document.pdf";
  const decoded = decodeURIComponent(lastSegment);
  // Replace quotes to avoid header injection and keep filename readable.
  return decoded.replace(/["\\]/g, "_");
}

export async function GET(request: NextRequest) {
  const urlParam = request.nextUrl.searchParams.get("url");
  if (!urlParam) {
    return NextResponse.json({ error: "url parameter required" }, { status: 400 });
  }

  let targetUrl: URL;
  try {
    if (urlParam.startsWith("/")) {
      targetUrl = new URL(urlParam, request.nextUrl.origin);
    } else {
      targetUrl = new URL(urlParam);
    }
  } catch {
    return NextResponse.json({ error: "Invalid url parameter" }, { status: 400 });
  }

  if (!["http:", "https:"].includes(targetUrl.protocol)) {
    return NextResponse.json({ error: "Invalid protocol" }, { status: 400 });
  }

  const isSameOrigin = targetUrl.origin === request.nextUrl.origin;
  if (isSameOrigin) {
    if (!isAllowedLocalPath(targetUrl.pathname)) {
      return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
    }
  } else if (!ALLOWED_REMOTE_HOSTS.has(targetUrl.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const range = request.headers.get("range") ?? undefined;
  const upstream = await fetch(targetUrl, {
    headers: range ? { range } : undefined,
    redirect: "follow",
  });

  const finalUrl = new URL(upstream.url);
  if (finalUrl.origin !== request.nextUrl.origin && !ALLOWED_REMOTE_HOSTS.has(finalUrl.hostname)) {
    return NextResponse.json({ error: "Redirect target not allowed" }, { status: 403 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: `Upstream error ${upstream.status}` }, { status: upstream.status });
  }

  const headers = new Headers(upstream.headers);
  headers.set("Content-Type", "application/pdf");
  headers.set("Content-Disposition", `inline; filename="${getSafeFilename(finalUrl.pathname)}"`);
  headers.delete("X-Frame-Options");
  headers.delete("Content-Security-Policy");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
