import { NextRequest, NextResponse } from "next/server";

const ALLOWED_REMOTE_HOSTS = new Set(["raw.githubusercontent.com", "media.githubusercontent.com"]);
const BLOCKED_SAME_ORIGIN_PREFIXES = ["/api/", "/_next/"];
const MAX_PDF_BYTES = 50 * 1024 * 1024; // 50 MB
const FETCH_TIMEOUT_MS = 15000;

function isSafePathname(pathname: string): boolean {
  if (!pathname.startsWith("/")) return false;

  const segments = pathname.split("/");
  for (const segment of segments) {
    if (!segment) continue;

    let decoded: string;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return false;
    }

    if (decoded === "." || decoded === "..") return false;
    if (decoded.includes("/") || decoded.includes("\\")) return false;
  }

  return true;
}

function isAllowedLocalPath(pathname: string): boolean {
  if (!isSafePathname(pathname)) return false;

  const lower = pathname.toLowerCase();
  if (BLOCKED_SAME_ORIGIN_PREFIXES.some((prefix) => lower.startsWith(prefix))) {
    return false;
  }

  return lower.endsWith(".pdf");
}

function getSafeFilename(pathname: string): string {
  const lastSegment = pathname.split("/").pop() || "document.pdf";
  let decoded = lastSegment;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    // Use raw segment when decoding fails.
  }
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      headers: range ? { range } : undefined,
      redirect: "follow",
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error instanceof Error ? error.message : "Upstream fetch failed";
    const status = message.toLowerCase().includes("abort") ? 504 : 502;
    return NextResponse.json({ error: message }, { status });
  } finally {
    clearTimeout(timeoutId);
  }

  const finalUrl = new URL(upstream.url);
  if (finalUrl.origin !== request.nextUrl.origin && !ALLOWED_REMOTE_HOSTS.has(finalUrl.hostname)) {
    return NextResponse.json({ error: "Redirect target not allowed" }, { status: 403 });
  }

  if (!upstream.ok && upstream.status !== 206) {
    return NextResponse.json({ error: `Upstream error ${upstream.status}` }, { status: upstream.status });
  }

  const contentRange = upstream.headers.get("content-range");
  const contentLength = upstream.headers.get("content-length");
  if (contentRange) {
    const match = contentRange.match(/\/(\d+)$/);
    if (match) {
      const totalSize = Number(match[1]);
      if (Number.isFinite(totalSize) && totalSize > MAX_PDF_BYTES) {
        return NextResponse.json({ error: "PDF too large" }, { status: 413 });
      }
    }
  } else if (contentLength) {
    const length = Number(contentLength);
    if (Number.isFinite(length) && length > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "PDF too large" }, { status: 413 });
    }
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
