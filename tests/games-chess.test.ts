import assert from "node:assert/strict";
import test from "node:test";
import { Chess } from "chess.js";
import { applyChessMove, chooseComputerMove, legalTargets } from "../lib/games/chess";
import {
  getExpiredParticipant,
  isValidPlayerName,
  isFreshWaitingMatch,
  MATCHMAKING_TIMEOUT_MS,
  normalizePlayerName,
  PARTICIPANT_ACTIVE_MS,
  participantIsActive,
} from "../lib/games/matches";
import { MatchMoveError, validateMatchMove } from "../lib/games/authoritative-move";
import { redactPrivateMatchFields } from "../lib/games/public-match";
import {
  GAMES_BADGE_IP_RATE_LIMIT,
  GAMES_BADGE_REFRESH_MS,
  getGameActionRateLimitPolicy,
  isGameChessAction,
} from "../lib/games/rate-limits";

test("chess rules accept legal moves and reject illegal moves", () => {
  const initial = new Chess().fen();
  assert.ok(legalTargets(initial, "e2").includes("e4"));
  assert.equal(applyChessMove(initial, "e2", "e4").move.san, "e4");
  assert.throws(() => applyChessMove(initial, "e2", "e5"));
});

test("chess move records distinguish captures for sound playback", () => {
  const start = new Chess().fen();
  const white = applyChessMove(start, "e2", "e4");
  const black = applyChessMove(white.fen, "d7", "d5", "q", white.history);
  const capture = applyChessMove(black.fen, "e4", "d5", "q", black.history);

  assert.equal(white.move.captured, undefined);
  assert.equal(capture.move.captured, "p");
});

test("easy computer play is deterministic with an injected random source", () => {
  const move = chooseComputerMove(new Chess().fen(), "easy", () => 0);
  assert.deepEqual(move, { from: "a2", to: "a3", promotion: undefined });
});

test("hard computer play takes an undefended queen", () => {
  const game = new Chess("4k3/8/8/8/3q4/2P5/8/4K3 w - - 0 1");
  const move = chooseComputerMove(game.fen(), "hard", () => 0);
  assert.deepEqual(move && { from: move.from, to: move.to }, { from: "c3", to: "d4" });
});

test("waiting badges require both a fresh heartbeat and unexpired row", () => {
  const now = Date.parse("2026-08-05T12:00:00Z");
  assert.equal(isFreshWaitingMatch({ status: "waiting", waiting_heartbeat_at: "2026-08-05T11:59:30Z", expires_at: "2026-08-05T12:00:30Z" }, now), true);
  assert.equal(isFreshWaitingMatch({ status: "waiting", waiting_heartbeat_at: "2026-08-05T11:58:00Z", expires_at: "2026-08-05T12:00:30Z" }, now), false);
  assert.equal(isFreshWaitingMatch({ status: "active", waiting_heartbeat_at: "2026-08-05T11:59:59Z", expires_at: "2026-08-05T12:00:30Z" }, now), false);
});

test("visitor matchmaking waits for two minutes before fallback", () => {
  assert.equal(MATCHMAKING_TIMEOUT_MS, 120_000);
});

test("waiting badge polling is infrequent and protected by a shared rate limit", () => {
  assert.equal(GAMES_BADGE_REFRESH_MS, 60_000);
  assert.equal(GAMES_BADGE_IP_RATE_LIMIT.windowSeconds, 60);
  assert.equal(GAMES_BADGE_IP_RATE_LIMIT.limit, 120);
});

test("matchmaking uses a stricter abuse limit than active gameplay", () => {
  assert.equal(isGameChessAction("matchmake"), true);
  assert.equal(isGameChessAction("unknown"), false);
  const matchmaking = getGameActionRateLimitPolicy("matchmake");
  const moves = getGameActionRateLimitPolicy("move");
  assert.ok(matchmaking.distributedIp.limit < moves.distributedIp.limit);
  assert.ok(matchmaking.identityLimit < moves.identityLimit);
});

test("visitor names are normalized and kept deliberately short", () => {
  assert.equal(normalizePlayerName("  Alana   Goyal  "), "Alana Goyal");
  assert.equal(isValidPlayerName("Alana"), true);
  assert.equal(isValidPlayerName(""), false);
  assert.equal(isValidPlayerName("a".repeat(21)), false);
  assert.equal(isValidPlayerName("hello\u0000world"), false);
});

test("temporary disconnect and abandonment use different thresholds", () => {
  const now = Date.parse("2026-08-05T12:00:00Z");
  assert.equal(PARTICIPANT_ACTIVE_MS, 180_000);
  assert.equal(participantIsActive("2026-08-05T11:59:00Z", now), true);
  assert.equal(getExpiredParticipant({ status: "active", white_heartbeat_at: "2026-08-05T11:59:00Z", black_heartbeat_at: "2026-08-05T11:56:00Z" }, now), "black");
  assert.equal(getExpiredParticipant({ status: "completed", white_heartbeat_at: "2026-08-05T11:00:00Z", black_heartbeat_at: null }, now), null);
});

test("public match responses never expose participant credential hashes", () => {
  const match = redactPrivateMatchFields({
    id: "match-1",
    status: "active",
    white_secret_hash: "private-white-hash",
    black_secret_hash: "private-black-hash",
  });

  assert.deepEqual(match, { id: "match-1", status: "active" });
  assert.equal("white_secret_hash" in (match ?? {}), false);
  assert.equal("black_secret_hash" in (match ?? {}), false);
});

test("authoritative moves reject conflicts, illegal turns, and completed games", () => {
  const fen = new Chess().fen();
  assert.throws(() => validateMatchMove({ status: "active", version: 2, expectedVersion: 1, fen, color: "w", from: "e2", to: "e4" }), (error) => error instanceof MatchMoveError && error.status === 409);
  assert.throws(() => validateMatchMove({ status: "active", version: 2, expectedVersion: 2, fen, color: "b", from: "e7", to: "e5" }), /not your turn/);
  assert.throws(() => validateMatchMove({ status: "completed", version: 2, expectedVersion: 2, fen, color: "w", from: "e2", to: "e4" }), /not active/);
  assert.equal(validateMatchMove({ status: "active", version: 2, expectedVersion: 2, fen, color: "w", from: "e2", to: "e4" }).move.san, "e4");
});

test("authoritative moves preserve history and recognize threefold repetition", () => {
  const game = new Chess();
  const history = [
    ["g1", "f3"], ["g8", "f6"], ["f3", "g1"], ["f6", "g8"],
    ["g1", "f3"], ["g8", "f6"], ["f3", "g1"],
  ].map(([from, to]) => {
    const move = game.move({ from, to });
    return { from: move.from, to: move.to, promotion: move.promotion, san: move.san };
  });

  const result = validateMatchMove({
    status: "active",
    version: 7,
    expectedVersion: 7,
    fen: game.fen(),
    moveHistory: history,
    color: "b",
    from: "f6",
    to: "g8",
  });

  assert.equal(result.game.isThreefoldRepetition(), true);
  assert.equal(result.result, "draw");
  assert.match(result.game.pgn(), /Nf3 Nf6 2\. Ng1 Ng8/);
});
