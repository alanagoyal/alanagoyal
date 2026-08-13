import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getExpiredParticipant, isValidPlayerName, normalizePlayerName } from "@/lib/games/matches";
import { MatchMoveError, validateMatchMove } from "@/lib/games/authoritative-move";
import { redactPrivateMatchFields } from "@/lib/games/public-match";
import {
  GAMES_BADGE_IP_RATE_LIMIT,
  getGameActionRateLimitPolicy,
  isGameChessAction,
  type DistributedGameRateLimit,
} from "@/lib/games/rate-limits";
import {
  applyRateLimitHeaders,
  checkRateLimit,
  getClientIdentity,
  parseJsonBodyWithLimit,
} from "@/lib/server/request-security";

const PUBLIC_FIELDS = "id,status,white_visitor_id,white_name,black_visitor_id,black_name,fen,pgn,move_history,version,result,waiting_heartbeat_at,white_heartbeat_at,black_heartbeat_at,expires_at,created_at,updated_at";
const WAITING_FRESH_SECONDS = 45;
const ACTIVE_EXPIRY_MS = 180_000;
const MAX_BODY_BYTES = 4 * 1024;
const LOCAL_IP_RATE_LIMIT = { scope: "games_chess_local_ip", limit: 1_200, windowMs: 60_000 } as const;
const LOCAL_BADGE_IP_RATE_LIMIT = { scope: "games_chess_local_badge_ip", limit: 240, windowMs: 60_000 } as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface DistributedRateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  scope: string;
  limit: number;
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Online Chess is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function hash(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

async function consumeDistributedRateLimit(
  supabase: ReturnType<typeof serviceClient>,
  identity: string,
  rule: DistributedGameRateLimit,
): Promise<DistributedRateLimitResult> {
  const { data, error } = await supabase.rpc("game_consume_rate_limit", {
    bucket_key_arg: `${rule.scope}:${hash(identity)}`,
    request_limit_arg: rule.limit,
    window_seconds_arg: rule.windowSeconds,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const remaining = Number(row?.remaining);
  const resetAt = Date.parse(String(row?.reset_at ?? ""));
  if (
    !row
    || typeof row.allowed !== "boolean"
    || !Number.isInteger(remaining)
    || remaining < 0
    || !Number.isFinite(resetAt)
  ) {
    throw new Error("Invalid distributed rate-limit response.");
  }
  return {
    allowed: row.allowed,
    remaining,
    resetAt,
    scope: rule.scope,
    limit: rule.limit,
  };
}

function validIdentity(visitorId: unknown, visitorSecret: unknown): visitorId is string {
  return typeof visitorId === "string" && UUID_PATTERN.test(visitorId) && typeof visitorSecret === "string" && visitorSecret.length >= 32;
}

function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function rateLimitResponse(result: DistributedRateLimitResult) {
  const response = errorResponse("Too many game requests. Try again shortly.", 429);
  response.headers.set("X-RateLimit-Limit", result.limit.toString());
  response.headers.set("X-RateLimit-Remaining", Math.max(0, result.remaining).toString());
  response.headers.set("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000).toString());
  response.headers.set("X-RateLimit-Scope", result.scope);
  response.headers.set("Retry-After", Math.max(1, Math.ceil((result.resetAt - Date.now()) / 1000)).toString());
  return response;
}

function serviceErrorResponse(context: string, error: unknown) {
  console.error(`[games/chess] ${context}`, error);
  return errorResponse("Games service is temporarily unavailable.", 503);
}

function matchResponse(match: Record<string, unknown> | null) {
  return NextResponse.json({ match: redactPrivateMatchFields(match) });
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("badge") !== "1") return errorResponse("Not found.", 404);
  try {
    const clientIp = getClientIdentity(request).ip;
    const localRateLimit = checkRateLimit(clientIp, LOCAL_BADGE_IP_RATE_LIMIT);
    if (!localRateLimit.allowed) {
      const response = errorResponse("Too many game requests. Try again shortly.", 429);
      applyRateLimitHeaders(response.headers, localRateLimit);
      response.headers.set("Retry-After", Math.max(1, Math.ceil(localRateLimit.retryAfterMs / 1000)).toString());
      return response;
    }
    const supabase = serviceClient();
    const distributedRateLimit = await consumeDistributedRateLimit(supabase, clientIp, GAMES_BADGE_IP_RATE_LIMIT);
    if (!distributedRateLimit.allowed) return rateLimitResponse(distributedRateLimit);
    const cutoff = new Date(Date.now() - WAITING_FRESH_SECONDS * 1000).toISOString();
    const visitorId = request.nextUrl.searchParams.get("visitorId");
    let query = supabase.from("game_matches").select("id,white_name")
      .eq("status", "waiting").gt("waiting_heartbeat_at", cutoff).gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true }).limit(1);
    if (visitorId && UUID_PATTERN.test(visitorId)) query = query.neq("white_visitor_id", visitorId);
    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return NextResponse.json(
      { waiting: Boolean(data), waitingName: data?.white_name ?? null },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return serviceErrorResponse("badge lookup failed", error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsedBody = await parseJsonBodyWithLimit<Record<string, unknown>>(request, MAX_BODY_BYTES);
    if (!parsedBody.ok) {
      return errorResponse(parsedBody.reason === "too_large" ? "Game request is too large." : "Invalid game request.", parsedBody.reason === "too_large" ? 413 : 400);
    }
    const body = parsedBody.body;
    const { action, visitorId, visitorSecret, matchId } = body;
    if (!isGameChessAction(action)) return errorResponse("Unknown action.");
    const clientIp = getClientIdentity(request).ip;
    const ipRateLimit = checkRateLimit(clientIp, LOCAL_IP_RATE_LIMIT);
    if (!ipRateLimit.allowed) {
      const response = errorResponse("Too many game requests. Try again shortly.", 429);
      applyRateLimitHeaders(response.headers, ipRateLimit);
      response.headers.set("Retry-After", Math.max(1, Math.ceil(ipRateLimit.retryAfterMs / 1000)).toString());
      return response;
    }
    if (!validIdentity(visitorId, visitorSecret)) return errorResponse("Invalid visitor identity.", 401);
    const secretHash = hash(visitorSecret as string);
    const actionRateLimitPolicy = getGameActionRateLimitPolicy(action);
    const identityRateLimit = checkRateLimit(`${visitorId}:${secretHash}`, {
      scope: `games_chess_identity_${action}`,
      limit: actionRateLimitPolicy.identityLimit,
      windowMs: 60_000,
    });
    if (!identityRateLimit.allowed) {
      const response = errorResponse("Too many game requests. Try again shortly.", 429);
      applyRateLimitHeaders(response.headers, identityRateLimit);
      response.headers.set("Retry-After", Math.max(1, Math.ceil(identityRateLimit.retryAfterMs / 1000)).toString());
      return response;
    }
    const supabase = serviceClient();
    const distributedRateLimit = await consumeDistributedRateLimit(
      supabase,
      clientIp,
      actionRateLimitPolicy.distributedIp,
    );
    if (!distributedRateLimit.allowed) return rateLimitResponse(distributedRateLimit);

    if (action === "resume") {
      const { data: candidates, error } = await supabase.from("game_matches").select("*")
        .or(`white_visitor_id.eq.${visitorId},black_visitor_id.eq.${visitorId}`)
        .in("status", ["waiting", "active"])
        .gt("expires_at", new Date().toISOString())
        .order("updated_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      const resumable = candidates?.find((candidate) =>
        (candidate.white_visitor_id === visitorId && candidate.white_secret_hash === secretHash)
        || (candidate.black_visitor_id === visitorId && candidate.black_secret_hash === secretHash));
      if (!resumable) return matchResponse(null);
      const { data: match, error: publicReadError } = await supabase.from("game_matches")
        .select(PUBLIC_FIELDS).eq("id", resumable.id).single();
      if (publicReadError) throw publicReadError;
      return matchResponse(match);
    }

    if (action === "matchmake") {
      if (typeof body.name !== "string" || !isValidPlayerName(body.name)) {
        return errorResponse("Enter a name between 1 and 20 characters.", 422);
      }
      const { data, error } = await supabase.rpc("game_matchmake", {
        visitor_id_arg: visitorId,
        secret_hash_arg: secretHash,
        visitor_name_arg: normalizePlayerName(body.name),
      });
      if (error) throw error;
      const { data: match, error: readError } = await supabase.from("game_matches").select(PUBLIC_FIELDS).eq("id", data.id).single();
      if (readError) throw readError;
      return matchResponse(match);
    }

    if (typeof matchId !== "string" || !UUID_PATTERN.test(matchId)) return errorResponse("A valid match is required.");
    const { data: privateMatch, error: readError } = await supabase.from("game_matches").select("*").eq("id", matchId).single();
    if (readError || !privateMatch) return errorResponse("Match not found.", 404);
    const isWhite = privateMatch.white_visitor_id === visitorId && privateMatch.white_secret_hash === secretHash;
    const isBlack = privateMatch.black_visitor_id === visitorId && privateMatch.black_secret_hash === secretHash;
    if (!isWhite && !isBlack) return errorResponse("You are not a participant in this match.", 403);
    const readPublicMatch = async () => {
      const { data, error } = await supabase.from("game_matches").select(PUBLIC_FIELDS).eq("id", matchId).single();
      if (error) throw error;
      return data;
    };

    if (action === "cancelWaiting") {
      const expectedVersion = Number(body.version);
      if (!Number.isInteger(expectedVersion) || expectedVersion < 0) return errorResponse("A valid match version is required.");
      const { data: cancelledMatch, error } = await supabase.from("game_matches").update({
        status: "expired",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: expectedVersion + 1,
      }).eq("id", matchId).eq("version", expectedVersion).eq("status", "waiting").select(PUBLIC_FIELDS).maybeSingle();
      if (error) throw error;
      return matchResponse(cancelledMatch ?? await readPublicMatch());
    }

    if (privateMatch.status === "waiting" && Date.parse(privateMatch.expires_at) <= Date.now()) {
      const { data: expiredMatch, error } = await supabase.from("game_matches").update({ status: "expired", updated_at: new Date().toISOString(), version: privateMatch.version + 1 })
        .eq("id", matchId).eq("version", privateMatch.version).eq("status", "waiting").select(PUBLIC_FIELDS).maybeSingle();
      if (error) throw error;
      if (expiredMatch) return matchResponse(expiredMatch);
    }

    const expiredParticipant = getExpiredParticipant(privateMatch);
    if (expiredParticipant) {
      const result = expiredParticipant === "white" ? "black" : "white";
      const { data: expiredMatch, error } = await supabase.from("game_matches").update({
        status: "completed", result, completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), version: privateMatch.version + 1,
      }).eq("id", matchId).eq("version", privateMatch.version).eq("status", "active").select(PUBLIC_FIELDS).maybeSingle();
      if (error) throw error;
      if (expiredMatch) return matchResponse(expiredMatch);
    }

    if (action === "get") {
      return matchResponse(await readPublicMatch());
    }

    if (action === "heartbeat") {
      if (!(["waiting", "active"] as string[]).includes(privateMatch.status)) return matchResponse(await readPublicMatch());
      const update = isWhite
        ? { white_heartbeat_at: new Date().toISOString(), waiting_heartbeat_at: privateMatch.status === "waiting" ? new Date().toISOString() : privateMatch.waiting_heartbeat_at, expires_at: new Date(Date.now() + ACTIVE_EXPIRY_MS).toISOString(), updated_at: new Date().toISOString() }
        : { black_heartbeat_at: new Date().toISOString(), expires_at: new Date(Date.now() + ACTIVE_EXPIRY_MS).toISOString(), updated_at: new Date().toISOString() };
      const { data: match, error } = await supabase.from("game_matches").update(update).eq("id", matchId).select(PUBLIC_FIELDS).single();
      if (error) throw error;
      return matchResponse(match);
    }

    if (action === "leave") {
      if (privateMatch.status === "completed" || privateMatch.status === "expired") return matchResponse(await readPublicMatch());
      const waiting = privateMatch.status === "waiting";
      const { data: match, error } = await supabase.from("game_matches").update({
        status: waiting ? "expired" : "completed",
        result: waiting ? null : "abandoned",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: privateMatch.version + 1,
      }).eq("id", matchId).eq("version", privateMatch.version).select(PUBLIC_FIELDS).single();
      if (error) throw error;
      return matchResponse(match);
    }

    if (action === "move") {
      const expectedColor = isWhite ? "w" : "b";
      let validated;
      try {
        validated = validateMatchMove({
          status: privateMatch.status,
          version: privateMatch.version,
          expectedVersion: Number(body.version),
          fen: privateMatch.fen,
          moveHistory: Array.isArray(privateMatch.move_history) ? privateMatch.move_history : [],
          color: expectedColor,
          from: String(body.from),
          to: String(body.to),
          promotion: String(body.promotion ?? "q"),
        });
      } catch (error) {
        if (error instanceof MatchMoveError) return errorResponse(error.message, error.status);
        throw error;
      }
      const { game, move, result: winner } = validated;
      const nextHistory = [...(Array.isArray(privateMatch.move_history) ? privateMatch.move_history : []), {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        captured: move.captured,
        san: move.san,
      }];
      const update = { fen: game.fen(), pgn: game.pgn(), move_history: nextHistory, version: privateMatch.version + 1, status: winner ? "completed" : "active", result: winner, completed_at: winner ? new Date().toISOString() : null, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + ACTIVE_EXPIRY_MS).toISOString(), ...(isWhite ? { white_heartbeat_at: new Date().toISOString() } : { black_heartbeat_at: new Date().toISOString() }) };
      const { data: match, error } = await supabase.from("game_matches").update(update).eq("id", matchId).eq("version", privateMatch.version).eq("status", "active").select(PUBLIC_FIELDS).maybeSingle();
      if (error) throw error;
      if (!match) return errorResponse("The board changed. Reconnecting…", 409);
      return matchResponse(match);
    }

    return errorResponse("Unknown action.");
  } catch (error) {
    return serviceErrorResponse("request failed", error);
  }
}
