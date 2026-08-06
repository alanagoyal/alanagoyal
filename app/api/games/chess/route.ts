import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { getExpiredParticipant } from "@/lib/games/matches";
import { MatchMoveError, validateMatchMove } from "@/lib/games/authoritative-move";
import {
  applyRateLimitHeaders,
  checkRateLimit,
  getClientIdentity,
  parseJsonBodyWithLimit,
} from "@/lib/server/request-security";

const PUBLIC_FIELDS = "id,status,white_visitor_id,black_visitor_id,fen,pgn,move_history,version,result,waiting_heartbeat_at,white_heartbeat_at,black_heartbeat_at,expires_at,created_at,updated_at";
const WAITING_FRESH_SECONDS = 45;
const MAX_BODY_BYTES = 4 * 1024;
const POST_RATE_LIMIT = { scope: "games_chess_ip", limit: 180, windowMs: 60_000 } as const;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Online Chess is not configured.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function hash(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function validIdentity(visitorId: unknown, visitorSecret: unknown): visitorId is string {
  return typeof visitorId === "string" && UUID_PATTERN.test(visitorId) && typeof visitorSecret === "string" && visitorSecret.length >= 32;
}

function errorResponse(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : "Games service error.";
  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("badge") !== "1") return errorResponse("Not found.", 404);
  try {
    const cutoff = new Date(Date.now() - WAITING_FRESH_SECONDS * 1000).toISOString();
    const visitorId = request.nextUrl.searchParams.get("visitorId");
    let query = serviceClient().from("game_matches").select("id", { count: "exact", head: true })
      .eq("status", "waiting").gt("waiting_heartbeat_at", cutoff).gt("expires_at", new Date().toISOString());
    if (visitorId && UUID_PATTERN.test(visitorId)) query = query.neq("white_visitor_id", visitorId);
    const { count, error } = await query;
    if (error) throw error;
    return NextResponse.json({ waiting: (count ?? 0) > 0 }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error, 503);
  }
}

export async function POST(request: NextRequest) {
  const rateLimit = checkRateLimit(getClientIdentity(request).ip, POST_RATE_LIMIT);
  if (!rateLimit.allowed) {
    const response = errorResponse("Too many game requests. Try again shortly.", 429);
    applyRateLimitHeaders(response.headers, rateLimit);
    response.headers.set("Retry-After", Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000)).toString());
    return response;
  }

  try {
    const parsedBody = await parseJsonBodyWithLimit<Record<string, unknown>>(request, MAX_BODY_BYTES);
    if (!parsedBody.ok) {
      return errorResponse(parsedBody.reason === "too_large" ? "Game request is too large." : "Invalid game request.", parsedBody.reason === "too_large" ? 413 : 400);
    }
    const body = parsedBody.body;
    const { action, visitorId, visitorSecret, matchId } = body;
    if (!validIdentity(visitorId, visitorSecret)) return errorResponse("Invalid visitor identity.", 401);
    const secretHash = hash(visitorSecret as string);
    const supabase = serviceClient();

    if (action === "matchmake") {
      const { data, error } = await supabase.rpc("game_matchmake", { visitor_id_arg: visitorId, secret_hash_arg: secretHash });
      if (error) throw error;
      const { data: match, error: readError } = await supabase.from("game_matches").select(PUBLIC_FIELDS).eq("id", data.id).single();
      if (readError) throw readError;
      return NextResponse.json({ match });
    }

    if (typeof matchId !== "string" || !UUID_PATTERN.test(matchId)) return errorResponse("A valid match is required.");
    const { data: privateMatch, error: readError } = await supabase.from("game_matches").select("*").eq("id", matchId).single();
    if (readError || !privateMatch) return errorResponse("Match not found.", 404);
    const isWhite = privateMatch.white_visitor_id === visitorId && privateMatch.white_secret_hash === secretHash;
    const isBlack = privateMatch.black_visitor_id === visitorId && privateMatch.black_secret_hash === secretHash;
    if (!isWhite && !isBlack) return errorResponse("You are not a participant in this match.", 403);

    if (privateMatch.status === "waiting" && Date.parse(privateMatch.expires_at) <= Date.now()) {
      const { data: expiredMatch, error } = await supabase.from("game_matches").update({ status: "expired", updated_at: new Date().toISOString(), version: privateMatch.version + 1 })
        .eq("id", matchId).eq("version", privateMatch.version).eq("status", "waiting").select(PUBLIC_FIELDS).maybeSingle();
      if (error) throw error;
      if (expiredMatch) return NextResponse.json({ match: expiredMatch });
    }

    const expiredParticipant = getExpiredParticipant(privateMatch);
    if (expiredParticipant) {
      const result = expiredParticipant === "white" ? "black" : "white";
      const { data: expiredMatch, error } = await supabase.from("game_matches").update({
        status: "completed", result, completed_at: new Date().toISOString(), updated_at: new Date().toISOString(), version: privateMatch.version + 1,
      }).eq("id", matchId).eq("version", privateMatch.version).eq("status", "active").select(PUBLIC_FIELDS).maybeSingle();
      if (error) throw error;
      if (expiredMatch) return NextResponse.json({ match: expiredMatch });
    }

    if (action === "get") {
      const { data: match } = await supabase.from("game_matches").select(PUBLIC_FIELDS).eq("id", matchId).single();
      return NextResponse.json({ match });
    }

    if (action === "heartbeat") {
      if (!(["waiting", "active"] as string[]).includes(privateMatch.status)) return NextResponse.json({ match: privateMatch });
      const update = isWhite
        ? { white_heartbeat_at: new Date().toISOString(), waiting_heartbeat_at: privateMatch.status === "waiting" ? new Date().toISOString() : privateMatch.waiting_heartbeat_at, expires_at: new Date(Date.now() + 75_000).toISOString(), updated_at: new Date().toISOString() }
        : { black_heartbeat_at: new Date().toISOString(), expires_at: new Date(Date.now() + 75_000).toISOString(), updated_at: new Date().toISOString() };
      const { data: match, error } = await supabase.from("game_matches").update(update).eq("id", matchId).select(PUBLIC_FIELDS).single();
      if (error) throw error;
      return NextResponse.json({ match });
    }

    if (action === "leave") {
      if (privateMatch.status === "completed" || privateMatch.status === "expired") return NextResponse.json({ match: privateMatch });
      const waiting = privateMatch.status === "waiting";
      const { data: match, error } = await supabase.from("game_matches").update({
        status: waiting ? "expired" : "completed",
        result: waiting ? null : "abandoned",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        version: privateMatch.version + 1,
      }).eq("id", matchId).eq("version", privateMatch.version).select(PUBLIC_FIELDS).single();
      if (error) throw error;
      return NextResponse.json({ match });
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
      const nextHistory = [...(Array.isArray(privateMatch.move_history) ? privateMatch.move_history : []), { from: move.from, to: move.to, promotion: move.promotion, san: move.san }];
      const update = { fen: game.fen(), pgn: game.pgn(), move_history: nextHistory, version: privateMatch.version + 1, status: winner ? "completed" : "active", result: winner, completed_at: winner ? new Date().toISOString() : null, updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + 75_000).toISOString(), ...(isWhite ? { white_heartbeat_at: new Date().toISOString() } : { black_heartbeat_at: new Date().toISOString() }) };
      const { data: match, error } = await supabase.from("game_matches").update(update).eq("id", matchId).eq("version", privateMatch.version).eq("status", "active").select(PUBLIC_FIELDS).maybeSingle();
      if (error) throw error;
      if (!match) return errorResponse("The board changed. Reconnecting…", 409);
      return NextResponse.json({ match });
    }

    return errorResponse("Unknown action.");
  } catch (error) {
    return errorResponse(error, 503);
  }
}
