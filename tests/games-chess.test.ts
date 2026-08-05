import assert from "node:assert/strict";
import test from "node:test";
import { Chess } from "chess.js";
import { applyChessMove, chooseComputerMove, legalTargets } from "../lib/games/chess";
import { getExpiredParticipant, isFreshWaitingMatch, participantIsActive } from "../lib/games/matches";
import { MatchMoveError, validateMatchMove } from "../lib/games/authoritative-move";

test("chess rules accept legal moves and reject illegal moves", () => {
  const initial = new Chess().fen();
  assert.ok(legalTargets(initial, "e2").includes("e4"));
  assert.equal(applyChessMove(initial, "e2", "e4").move.san, "e4");
  assert.throws(() => applyChessMove(initial, "e2", "e5"));
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

test("temporary disconnect and abandonment use different thresholds", () => {
  const now = Date.parse("2026-08-05T12:00:00Z");
  assert.equal(participantIsActive("2026-08-05T11:59:00Z", now), true);
  assert.equal(getExpiredParticipant({ status: "active", white_heartbeat_at: "2026-08-05T11:59:00Z", black_heartbeat_at: "2026-08-05T11:58:00Z" }, now), "black");
  assert.equal(getExpiredParticipant({ status: "completed", white_heartbeat_at: "2026-08-05T11:00:00Z", black_heartbeat_at: null }, now), null);
});

test("authoritative moves reject conflicts, illegal turns, and completed games", () => {
  const fen = new Chess().fen();
  assert.throws(() => validateMatchMove({ status: "active", version: 2, expectedVersion: 1, fen, color: "w", from: "e2", to: "e4" }), (error) => error instanceof MatchMoveError && error.status === 409);
  assert.throws(() => validateMatchMove({ status: "active", version: 2, expectedVersion: 2, fen, color: "b", from: "e7", to: "e5" }), /not your turn/);
  assert.throws(() => validateMatchMove({ status: "completed", version: 2, expectedVersion: 2, fen, color: "w", from: "e2", to: "e4" }), /not active/);
  assert.equal(validateMatchMove({ status: "active", version: 2, expectedVersion: 2, fen, color: "w", from: "e2", to: "e4" }).move.san, "e4");
});
