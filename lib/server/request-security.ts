import { NextRequest, NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "anon_session_id";
const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const textEncoder = new TextEncoder();

export type ClientIdentity = {
  ip: string;
  sessionId: string;
  shouldSetSessionCookie: boolean;
};

export type ParsedJsonBody<T> =
  | { ok: true; body: T; bytes: number }
  | { ok: false; reason: "too_large" | "invalid_json" };

export function getClientIdentity(request: NextRequest): ClientIdentity {
  const existingSession = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim();
  const hasExistingSession = typeof existingSession === "string" && existingSession.length > 0;
  const sessionId =
    hasExistingSession
      ? existingSession
      : crypto.randomUUID();

  return {
    ip: extractClientIp(request),
    sessionId,
    shouldSetSessionCookie: !hasExistingSession,
  };
}

export function applySessionCookie(
  response: NextResponse,
  identity: ClientIdentity
) {
  if (!identity.shouldSetSessionCookie) return;

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: identity.sessionId,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });
}

export async function parseJsonBodyWithLimit<T>(
  request: Request,
  maxBytes: number
): Promise<ParsedJsonBody<T>> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const parsedLength = Number(contentLengthHeader);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
      return { ok: false, reason: "too_large" };
    }
  }

  let rawBody = "";
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, reason: "invalid_json" };
  }

  const bytes = textEncoder.encode(rawBody).byteLength;
  if (bytes > maxBytes) {
    return { ok: false, reason: "too_large" };
  }

  if (rawBody.trim().length === 0) {
    return { ok: false, reason: "invalid_json" };
  }

  try {
    const body = JSON.parse(rawBody) as T;
    return { ok: true, body, bytes };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

function extractClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }

  const candidates = [
    request.headers.get("x-real-ip"),
    request.headers.get("cf-connecting-ip"),
    request.headers.get("true-client-ip"),
    request.headers.get("x-client-ip"),
  ];

  for (const candidate of candidates) {
    if (candidate && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }

  return "unknown";
}
