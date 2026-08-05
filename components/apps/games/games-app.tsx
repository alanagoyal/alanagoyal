"use client";

import { Chess, type Square } from "chess.js";
import { ChevronLeft, Monitor, RotateCcw, Sparkles, Users, Wifi, WifiOff, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { GamesIcon } from "@/components/apps/games/games-icon";
import { gamesApi } from "@/lib/games/api";
import { applyChessMove, legalTargets, type ChessDifficulty } from "@/lib/games/chess";
import { loadVisitorIdentity, type GameMatch, type VisitorIdentity } from "@/lib/games/matches";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { cn } from "@/lib/utils";

type Screen = "library" | "setup" | "chess";
type PlayKind = "computer" | "online";

const PIECES: Record<string, string> = {
  wp: "♙", wn: "♘", wb: "♗", wr: "♖", wq: "♕", wk: "♔",
  bp: "♟", bn: "♞", bb: "♝", br: "♜", bq: "♛", bk: "♚",
};
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

interface GamesAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  onWaitingBadgeChange?: (waiting: boolean) => void;
}

function statusText(game: Chess, playerColor: "w" | "b", thinking: boolean) {
  if (game.isCheckmate()) return game.turn() === playerColor ? "Checkmate — you lost" : "Checkmate — you won";
  if (game.isDraw()) return "Draw";
  if (thinking) return "Thinking…";
  const yours = game.turn() === playerColor;
  return `${yours ? "Your" : "Opponent’s"} turn${game.inCheck() ? " · Check" : ""}`;
}

function ChessBoard({ fen, orientation, disabled, onMove }: {
  fen: string;
  orientation: "w" | "b";
  disabled?: boolean;
  onMove: (from: Square, to: Square) => void;
}) {
  const game = useMemo(() => new Chess(fen), [fen]);
  const [selected, setSelected] = useState<Square | null>(null);
  const targets = selected ? legalTargets(fen, selected) : [];
  const squares = useMemo(() => {
    const result: Square[] = [];
    const ranks = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
    const files = orientation === "w" ? FILES : [...FILES].reverse();
    for (const rank of ranks) for (const file of files) result.push(`${file}${rank}` as Square);
    return result;
  }, [orientation]);

  const select = (square: Square) => {
    if (disabled) return;
    if (selected && targets.includes(square)) {
      onMove(selected, square);
      setSelected(null);
      return;
    }
    const piece = game.get(square);
    setSelected(piece && piece.color === game.turn() ? square : null);
  };

  return (
    <div className="grid aspect-square w-full grid-cols-8 overflow-hidden rounded-xl shadow-[0_18px_55px_rgba(15,23,42,.28)] ring-1 ring-black/15">
      {squares.map((square) => {
        const piece = game.get(square);
        const fileIndex = square.charCodeAt(0) - 97;
        const rank = Number(square[1]);
        const light = (fileIndex + rank) % 2 === 1;
        const target = targets.includes(square);
        return (
          <button
            key={square}
            aria-label={`${square}${piece ? ` ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
            onClick={() => select(square)}
            className={cn(
              "relative flex aspect-square items-center justify-center text-[clamp(1.65rem,7.2vw,4.35rem)] leading-none",
              light ? "bg-[#E8EDF6]" : "bg-[#6685B8]",
              selected === square && "after:absolute after:inset-0 after:bg-[#0A7CFF]/35"
            )}
          >
            {target && <span className="absolute h-[24%] w-[24%] rounded-full bg-[#10254b]/35" />}
            {piece && <span className={cn("relative z-[1] drop-shadow-sm", piece.color === "b" && "text-[#182238]")}>{PIECES[`${piece.color}${piece.type}`]}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function GamesApp({ isMobile = false, inShell = false, onWaitingBadgeChange }: GamesAppProps) {
  const nav = useWindowNavBehavior({ isDesktop: inShell, isMobile, shellEnabled: inShell });
  const [screen, setScreen] = useState<Screen>("library");
  const [kind, setKind] = useState<PlayKind>("computer");
  const [difficulty, setDifficulty] = useState<ChessDifficulty>("medium");
  const [fen, setFen] = useState(() => new Chess().fen());
  const [thinking, setThinking] = useState(false);
  const [match, setMatch] = useState<GameMatch | null>(null);
  const [identity, setIdentity] = useState<VisitorIdentity | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => setIdentity(loadVisitorIdentity()), []);
  useEffect(() => () => workerRef.current?.terminate(), []);

  const waiting = match?.status === "waiting";
  useEffect(() => { if (waiting) onWaitingBadgeChange?.(true); }, [onWaitingBadgeChange, waiting]);

  const syncMatch = useCallback(async () => {
    if (!identity || !match) return;
    try {
      const response = await gamesApi.get(identity, match.id);
      if (response.match) setMatch(response.match);
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Couldn’t reconnect.");
    }
  }, [identity, match]);

  useEffect(() => {
    if (!identity || !match || match.status === "completed" || match.status === "expired") return;
    const heartbeat = window.setInterval(() => void gamesApi.heartbeat(identity, match.id).then((r) => r.match && setMatch(r.match)).catch(() => undefined), 15_000);
    const poll = window.setInterval(() => void syncMatch(), 2_000);
    const onVisible = () => { if (!document.hidden) void syncMatch(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(heartbeat); window.clearInterval(poll); document.removeEventListener("visibilitychange", onVisible); };
  }, [identity, match, syncMatch]);

  const startComputer = () => {
    setKind("computer");
    setFen(new Chess().fen());
    setMatch(null);
    setScreen("chess");
  };

  const findPlayer = async () => {
    if (!identity) return;
    setOnlineError(null);
    setKind("online");
    setScreen("chess");
    try {
      const response = await gamesApi.matchmake(identity);
      if (response.match) setMatch(response.match);
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Online play is unavailable.");
    }
  };

  const runComputerMove = useCallback((nextFen: string) => {
    setThinking(true);
    const worker = new Worker(new URL("./chess-ai.worker.ts", import.meta.url));
    workerRef.current?.terminate();
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ from: Square; to: Square; promotion?: string } | null>) => {
      if (event.data) setFen(applyChessMove(nextFen, event.data.from, event.data.to, event.data.promotion).fen);
      setThinking(false);
      worker.terminate();
    };
    worker.onerror = () => { setThinking(false); worker.terminate(); };
    worker.postMessage({ fen: nextFen, difficulty });
  }, [difficulty]);

  const move = async (from: Square, to: Square) => {
    if (kind === "computer") {
      try {
        const result = applyChessMove(fen, from, to);
        setFen(result.fen);
        if (!result.outcome) runComputerMove(result.fen);
      } catch { /* illegal selections are ignored */ }
      return;
    }
    if (!identity || !match || match.status !== "active") return;
    try {
      const response = await gamesApi.move(identity, match.id, match.version, from, to);
      if (response.match) setMatch(response.match);
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "That move could not be played.");
      void syncMatch();
    }
  };

  const leave = async () => {
    if (kind === "online" && identity && match) await gamesApi.leave(identity, match.id).catch(() => undefined);
    setMatch(null);
    setOnlineError(null);
    setScreen("library");
  };

  const currentFen = kind === "online" ? match?.fen ?? new Chess().fen() : fen;
  const game = useMemo(() => new Chess(currentFen), [currentFen]);
  const onlineColor = match && identity ? (match.white_visitor_id === identity.id ? "w" : "b") : "w";
  const canMove = kind === "computer"
    ? !thinking && game.turn() === "w" && !game.isGameOver()
    : match?.status === "active" && game.turn() === onlineColor && !game.isGameOver();

  const backButton = screen === "library" ? null : (
    <button onClick={() => void leave()} onMouseDown={(e) => e.stopPropagation()} className="flex items-center gap-0.5 text-sm text-[#0A7CFF]">
      <ChevronLeft size={21} /> Games
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <WindowNavShell
        isMobile={isMobile}
        onMouseDown={nav.onDragStart}
        left={isMobile || !inShell ? backButton ?? <div className="w-14" /> : <WindowControls inShell={nav.inShell} onClose={nav.onClose} onMinimize={nav.onMinimize} onToggleMaximize={nav.onToggleMaximize} isMaximized={nav.isMaximized} closeLabel={nav.closeLabel} />}
        center={<p className="truncate text-center text-sm font-semibold">{screen === "chess" ? "Chess" : "Games"}</p>}
        right={screen === "library" ? <WindowNavSpacer isMobile={isMobile} /> : <button onClick={() => void leave()} onMouseDown={(e) => e.stopPropagation()} className="rounded-full p-1 text-muted-foreground can-hover:hover:bg-black/5" aria-label="Close game"><X size={17} /></button>}
      />

      {screen === "library" && (
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_25%_0%,rgba(104,92,255,.18),transparent_38%),radial-gradient(circle_at_80%_80%,rgba(10,124,255,.16),transparent_40%)] p-6 sm:p-10">
          <button onClick={() => setScreen("setup")} className="group w-full max-w-[360px] text-left">
            <div className="overflow-hidden rounded-[28px] border border-white/50 bg-white/55 p-5 shadow-[0_24px_80px_rgba(36,50,100,.2)] backdrop-blur-2xl transition-transform can-hover:group-hover:-translate-y-1 dark:border-white/10 dark:bg-white/10">
              <GamesIcon className="mb-6 h-24 w-24" />
              <p className="text-2xl font-semibold tracking-tight">Chess</p>
              <p className="mt-1 text-sm text-muted-foreground">Play the computer or meet someone online.</p>
              <div className="mt-6 flex items-center gap-2 text-sm font-medium text-[#0A7CFF]"><Sparkles size={16} /> Open</div>
            </div>
          </button>
        </div>
      )}

      {screen === "setup" && (
        <div className="flex flex-1 items-center justify-center overflow-auto p-5 sm:p-10">
          <div className="w-full max-w-xl space-y-4">
            <div className="rounded-2xl border border-muted-foreground/20 bg-muted/45 p-5">
              <div className="mb-4 flex items-center gap-3"><Monitor className="text-muted-foreground" /><div><h2 className="font-semibold">Play Computer</h2><p className="text-sm text-muted-foreground">A private game on this device.</p></div></div>
              <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl bg-black/5 p-1 dark:bg-white/5">
                {(["easy", "medium", "hard"] as ChessDifficulty[]).map((level) => <button key={level} onClick={() => setDifficulty(level)} className={cn("rounded-lg px-3 py-2 text-sm capitalize", difficulty === level && "bg-background font-medium shadow-sm")}>{level}</button>)}
              </div>
              <button onClick={startComputer} className="w-full rounded-xl bg-[#0A7CFF] px-4 py-2.5 text-sm font-semibold text-white">Start Game</button>
            </div>
            <div className="rounded-2xl border border-muted-foreground/20 bg-muted/45 p-5">
              <div className="mb-4 flex items-center gap-3"><Users className="text-muted-foreground" /><div><h2 className="font-semibold">Play a Visitor</h2><p className="text-sm text-muted-foreground">Match with someone else on the site.</p></div></div>
              <button onClick={() => void findPlayer()} className="w-full rounded-xl border border-[#0A7CFF]/35 bg-[#0A7CFF]/10 px-4 py-2.5 text-sm font-semibold text-[#0A7CFF]">Find a Player</button>
            </div>
          </div>
        </div>
      )}

      {screen === "chess" && (
        <div className="flex flex-1 min-h-0 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,rgba(80,112,190,.17),transparent_48%)] p-3 sm:p-6">
          <div className="flex w-full max-w-[680px] flex-col items-center gap-3">
            <div className="flex w-full items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium">{kind === "online" ? (match?.status === "waiting" ? <><span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Waiting for a player…</> : <><Wifi size={15} className="text-emerald-500" /> Online match</>) : <><Monitor size={15} /> {difficulty[0].toUpperCase() + difficulty.slice(1)} computer</>}</div>
              <span className="text-muted-foreground">{statusText(game, kind === "computer" ? "w" : onlineColor, thinking)}</span>
            </div>
            <div className="w-full max-w-[min(72vh,620px)]"><ChessBoard fen={currentFen} orientation={kind === "online" ? onlineColor : "w"} disabled={!canMove} onMove={(from, to) => void move(from, to)} /></div>
            {onlineError && <div className="flex w-full items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600"><WifiOff size={16} />{onlineError}</div>}
            {(game.isGameOver() || match?.status === "completed" || match?.status === "expired") && <button onClick={kind === "computer" ? startComputer : () => void findPlayer()} className="flex items-center gap-2 rounded-xl bg-[#0A7CFF] px-5 py-2.5 text-sm font-semibold text-white"><RotateCcw size={16} /> New Game</button>}
          </div>
        </div>
      )}
    </div>
  );
}
