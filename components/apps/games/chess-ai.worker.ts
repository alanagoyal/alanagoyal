import { chooseComputerMove, type ChessDifficulty } from "@/lib/games/chess";

self.onmessage = (event: MessageEvent<{ fen: string; difficulty: ChessDifficulty }>) => {
  self.postMessage(chooseComputerMove(event.data.fen, event.data.difficulty));
};

export {};
