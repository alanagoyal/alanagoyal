import { Chess, type Color, type Move, type Square } from "chess.js";

export type ChessDifficulty = "easy" | "medium" | "hard";
export type GameMode = "computer" | "online";

export interface ChessMoveRecord {
  from: Square;
  to: Square;
  promotion?: string;
  captured?: string;
  san: string;
}

export function createChessGame(fen: string, history: ChessMoveRecord[] = []): Chess {
  if (!history.length) return new Chess(fen);

  const game = new Chess();
  for (const move of history) {
    game.move({ from: move.from, to: move.to, promotion: move.promotion });
  }
  if (game.fen() !== fen) throw new Error("Chess history does not match the current position.");
  return game;
}

export function applyChessMove(
  fen: string,
  from: Square,
  to: Square,
  promotion = "q",
  history: ChessMoveRecord[] = [],
) {
  const game = createChessGame(fen, history);
  const move = game.move({ from, to, promotion });
  const record = {
    from: move.from,
    to: move.to,
    promotion: move.promotion,
    captured: move.captured,
    san: move.san,
  };
  return {
    fen: game.fen(),
    pgn: game.pgn(),
    move: record,
    history: [...history, record],
    outcome: getChessOutcome(game),
  };
}

export function getChessOutcome(game: Chess): string | null {
  if (game.isCheckmate()) return game.turn() === "w" ? "black" : "white";
  if (game.isDraw()) return "draw";
  return null;
}

const PIECE_VALUE = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20_000 } as const;

function evaluate(game: Chess, perspective: Color): number {
  if (game.isCheckmate()) return game.turn() === perspective ? -100_000 : 100_000;
  if (game.isDraw()) return 0;
  let score = 0;
  for (const row of game.board()) {
    for (const piece of row) {
      if (!piece) continue;
      const value = PIECE_VALUE[piece.type];
      score += piece.color === perspective ? value : -value;
    }
  }
  return score + (game.turn() === perspective ? game.moves().length : -game.moves().length) * 2;
}

function minimax(game: Chess, depth: number, alpha: number, beta: number, perspective: Color): number {
  if (depth === 0 || game.isGameOver()) return evaluate(game, perspective);
  const maximizing = game.turn() === perspective;
  let best = maximizing ? -Infinity : Infinity;
  for (const move of game.moves({ verbose: true })) {
    game.move(move);
    const score = minimax(game, depth - 1, alpha, beta, perspective);
    game.undo();
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }
    if (beta <= alpha) break;
  }
  return best;
}

export function chooseComputerMove(
  fen: string,
  difficulty: ChessDifficulty,
  random = Math.random
): Pick<Move, "from" | "to" | "promotion"> | null {
  const game = new Chess(fen);
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  if (difficulty === "easy") {
    const move = moves[Math.floor(random() * moves.length)] ?? moves[0];
    return { from: move.from, to: move.to, promotion: move.promotion };
  }

  const perspective = game.turn();
  const depth = difficulty === "hard" ? 3 : 2;
  const scored = moves.map((move) => {
    game.move(move);
    const score = minimax(game, depth - 1, -Infinity, Infinity, perspective);
    game.undo();
    return { move, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const pool = difficulty === "medium" ? scored.slice(0, Math.min(3, scored.length)) : scored.slice(0, 1);
  const selected = pool[Math.floor(random() * pool.length)] ?? scored[0];
  return { from: selected.move.from, to: selected.move.to, promotion: selected.move.promotion };
}

export function legalTargets(fen: string, square: Square): Square[] {
  return new Chess(fen).moves({ square, verbose: true }).map((move) => move.to);
}
