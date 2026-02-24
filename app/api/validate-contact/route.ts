import { initLogger, invoke, wrapTraced } from "braintrust";
import { NextRequest, NextResponse } from "next/server";
import {
  applyRateLimitHeaders,
  applySessionCookie,
  checkRateLimit,
  getClientIdentity,
  parseJsonBodyWithLimit,
  pickMostConstrainedRateLimit,
} from "@/lib/server/request-security";

const VALIDATE_CONTACT_MAX_BODY_BYTES = 4 * 1024;
const VALIDATE_RATE_LIMIT_SESSION = {
  scope: "validate_contact_session",
  limit: 15,
  windowMs: 60_000,
} as const;
const VALIDATE_RATE_LIMIT_IP = {
  scope: "validate_contact_ip",
  limit: 60,
  windowMs: 60_000,
} as const;

initLogger({
  projectName: "messages",
  apiKey: process.env.BRAINTRUST_API_KEY,
  asyncFlush: true,
});

export async function POST(req: NextRequest) {
  const identity = getClientIdentity(req);
  const sessionRateLimit = checkRateLimit(
    identity.sessionId,
    VALIDATE_RATE_LIMIT_SESSION
  );
  const ipRateLimit = checkRateLimit(identity.ip, VALIDATE_RATE_LIMIT_IP);
  const activeRateLimit = pickMostConstrainedRateLimit([
    sessionRateLimit,
    ipRateLimit,
  ]);

  const jsonResponse = (
    body: unknown,
    init?: ResponseInit,
    rateLimit = activeRateLimit
  ) => {
    const response = NextResponse.json(body, init);
    applyRateLimitHeaders(response.headers, rateLimit);
    applySessionCookie(response, identity);
    return response;
  };

  if (!sessionRateLimit.allowed || !ipRateLimit.allowed) {
    const blockedRateLimit = !sessionRateLimit.allowed
      ? sessionRateLimit
      : ipRateLimit;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(blockedRateLimit.retryAfterMs / 1000)
    );
    const response = jsonResponse(
      {
        validation: false,
        error: "Too many requests. Please try again shortly.",
      },
      { status: 429 },
      blockedRateLimit
    );
    response.headers.set("Retry-After", retryAfterSeconds.toString());
    return response;
  }

  try {
    const parsedBody = await parseJsonBodyWithLimit<Record<string, unknown>>(
      req,
      VALIDATE_CONTACT_MAX_BODY_BYTES
    );

    if (!parsedBody.ok) {
      if (parsedBody.reason === "too_large") {
        return jsonResponse(
          {
            validation: false,
            error: "Request body too large",
          },
          { status: 413 }
        );
      }
      return jsonResponse(
        { validation: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const name = parsedBody.body.name;
    if (typeof name !== "string") {
      return jsonResponse(
        { validation: false, error: "name must be a string" },
        { status: 400 }
      );
    }

    const normalizedName = name.trim();
    if (normalizedName.length < 1 || normalizedName.length > 80) {
      return jsonResponse(
        {
          validation: false,
          error: "name must be between 1 and 80 characters",
        },
        { status: 400 }
      );
    }

    const data = await handleRequest(normalizedName);
    if (!isValidationResponse(data)) {
      return jsonResponse(
        {
          validation: false,
          error: "Validation service returned an unexpected response",
        },
        { status: 502 }
      );
    }
    return jsonResponse(data);

  } catch (error) {
    console.error("Error in API route:", error);
    return jsonResponse(
      {
        validation: false,
        error: String(error),
      },
      { status: 500 }
    );
  }
}

function isValidationResponse(
  value: unknown
): value is { validation: boolean; reason?: string } {
  if (!value || typeof value !== "object") return false;
  const maybeValidation = (value as { validation?: unknown }).validation;
  return typeof maybeValidation === "boolean";
}

const handleRequest = wrapTraced(async function handleRequest(name: string) {
  try {
    const result = await invoke({
      projectName: "messages",
      slug: "validate-name-317c",
      input: {
        name,
      },
      stream: false,
    });
    return result;
  } catch (error) {
    console.error("Error in handleRequest:", error);
    throw error;
  }
});
