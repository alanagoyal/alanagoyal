import { Chess } from "chess.js";
import type { ChessMoveRecord } from "@/lib/games/chess";
import { createChessGame } from "@/lib/games/chess";

export class MatchMoveError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export function validateMatchMove(input: {
  status: string;
  version: number;
  expectedVersion: number;
  fen: string;
  color: "w" | "b";
  from: string;
  to: string;
  promotion?: string;
  moveHistory?: ChessMoveRecord[];
}) {
  if (input.status !== "active") throw new MatchMoveError("This match is not active.", 409);
  if (input.expectedVersion !== input.version) throw new MatchMoveError("The board changed. Reconnecting…", 409);
  let game: Chess;
  try {
    game = createChessGame(input.fen, input.moveHistory);
  } catch {
    throw new MatchMoveError("The saved game could not be reconstructed.", 409);
  }
  if (game.turn() !== input.color) throw new MatchMoveError("It is not your turn.", 409);
  let move;
  try { move = game.move({ from: input.from, to: input.to, promotion: input.promotion ?? "q" }); }
  catch { throw new MatchMoveError("That move is not legal.", 422); }
  const result = game.isCheckmate() ? (input.color === "w" ? "white" : "black") : game.isDraw() ? "draw" : null;
  return { game, move, result };
}
