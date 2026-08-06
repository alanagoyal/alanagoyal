"use client";

import { Chess, type Square } from "chess.js";
import { ChevronLeft, Monitor, RotateCcw, Sparkles, Users, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { gamesApi } from "@/lib/games/api";
import {
  applyChessMove,
  createChessGame,
  legalTargets,
  type ChessDifficulty,
  type ChessMoveRecord,
} from "@/lib/games/chess";
import { loadVisitorIdentity, type GameMatch, type VisitorIdentity } from "@/lib/games/matches";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { cn } from "@/lib/utils";

type Screen = "library" | "setup" | "difficulty" | "chess";
type PlayKind = "computer" | "online";

const PIECES: Record<string, string> = {
  p: "♟︎", n: "♞︎", b: "♝︎", r: "♜︎", q: "♛︎", k: "♚︎",
};
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

function ChessTileIcon({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex aspect-square items-center justify-center rounded-[22%] bg-[linear-gradient(145deg,#8798b5_0%,#293851_48%,#101827_100%)] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,.45),0_6px_16px_rgba(15,23,42,.25)] ring-1 ring-black/15",
        className,
      )}
    >
      <span className="-translate-y-[2%] font-serif text-[3.65rem] leading-none drop-shadow-[0_3px_3px_rgba(0,0,0,.4)]">♞︎</span>
    </div>
  );
}

function statusText(game: Chess, playerColor: "w" | "b", thinking: boolean) {
  if (game.isCheckmate()) return game.turn() === playerColor ? "Checkmate — you lost" : "Checkmate — you won";
  if (game.isDraw()) return "Draw";
  if (thinking) return "Thinking…";
  const yours = game.turn() === playerColor;
  return `${yours ? "Your" : "Opponent’s"} turn${game.inCheck() ? " · Check" : ""}`;
}

function onlineStatusText(match: GameMatch | null, game: Chess, playerColor: "w" | "b") {
  if (!match || match.status === "waiting") return "Finding another visitor…";
  if (match.status === "expired") return "No player joined";
  if (match.status === "completed") {
    if (match.result === "abandoned") return "Opponent left";
    if (match.result === "draw") return "Draw";
    if (match.result === (playerColor === "w" ? "white" : "black")) return "You won";
    if (match.result) return "You lost";
  }
  return statusText(game, playerColor, false);
}

function OnlineMatchLabel({ status }: { status?: GameMatch["status"] }) {
  if (!status || status === "waiting") {
    return <><span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Waiting for a player…</>;
  }
  if (status === "active") {
    return <><Wifi size={15} className="text-emerald-500" /> Online match</>;
  }
  return <><WifiOff size={15} className="text-muted-foreground" /> Match ended</>;
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
              "relative flex aspect-square items-center justify-center text-[clamp(1.8rem,4vw,3.2rem)] leading-none",
              light ? "bg-[#E8EDF6]" : "bg-[#6685B8]",
              selected === square && "after:absolute after:inset-0 after:bg-[#0A7CFF]/35"
            )}
          >
            {target && <span className="absolute h-[24%] w-[24%] rounded-full bg-[#10254b]/35" />}
            {piece && (
              <span
                className={cn(
                  "relative z-[1] font-serif leading-none",
                  piece.color === "w"
                    ? "text-[#FFF8E7] drop-shadow-[0_1px_1px_rgba(15,23,42,.7)]"
                    : "text-[#172033] drop-shadow-[0_1px_1px_rgba(255,255,255,.2)]",
                )}
              >
                {PIECES[piece.type]}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function GamesApp() {
  const nav = useWindowNavBehavior({ isDesktop: true, isMobile: false, shellEnabled: true });
  const [screen, setScreen] = useState<Screen>("library");
  const [kind, setKind] = useState<PlayKind>("computer");
  const [difficulty, setDifficulty] = useState<ChessDifficulty>("medium");
  const [fen, setFen] = useState(() => new Chess().fen());
  const [computerHistory, setComputerHistory] = useState<ChessMoveRecord[]>([]);
  const [thinking, setThinking] = useState(false);
  const [match, setMatch] = useState<GameMatch | null>(null);
  const [identity, setIdentity] = useState<VisitorIdentity | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => setIdentity(loadVisitorIdentity()), []);
  useEffect(() => () => workerRef.current?.terminate(), []);

  const matchId = match?.id;
  const syncMatch = useCallback(async () => {
    if (!identity || !matchId) return;
    try {
      const response = await gamesApi.get(identity, matchId);
      if (response.match) {
        setMatch(response.match);
        setOnlineError(null);
      }
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Couldn’t reconnect.");
    }
  }, [identity, matchId]);

  useEffect(() => {
    if (!identity || !matchId || match?.status === "completed" || match?.status === "expired") return;
    const heartbeat = window.setInterval(() => void gamesApi.heartbeat(identity, matchId).then((r) => r.match && setMatch(r.match)).catch(() => undefined), 15_000);
    const poll = window.setInterval(() => void syncMatch(), 2_000);
    const onVisible = () => { if (!document.hidden) void syncMatch(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(heartbeat); window.clearInterval(poll); document.removeEventListener("visibilitychange", onVisible); };
  }, [identity, match?.status, matchId, syncMatch]);

  const startComputer = (level: ChessDifficulty) => {
    setKind("computer");
    setDifficulty(level);
    setFen(new Chess().fen());
    setComputerHistory([]);
    setMatch(null);
    setScreen("chess");
  };

  const findPlayer = async () => {
    const visitor = identity ?? loadVisitorIdentity();
    if (!visitor.id) return;
    if (!identity) setIdentity(visitor);
    setOnlineError(null);
    setKind("online");
    setScreen("chess");
    try {
      const response = await gamesApi.matchmake(visitor);
      if (response.match) setMatch(response.match);
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Online play is unavailable.");
    }
  };

  const runComputerMove = useCallback((nextFen: string, history: ChessMoveRecord[]) => {
    setThinking(true);
    const worker = new Worker(new URL("./chess-ai.worker.ts", import.meta.url));
    workerRef.current?.terminate();
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ from: Square; to: Square; promotion?: string } | null>) => {
      if (event.data) {
        const result = applyChessMove(
          nextFen,
          event.data.from,
          event.data.to,
          event.data.promotion,
          history,
        );
        setFen(result.fen);
        setComputerHistory(result.history);
      }
      setThinking(false);
      worker.terminate();
    };
    worker.onerror = () => { setThinking(false); worker.terminate(); };
    worker.postMessage({ fen: nextFen, difficulty });
  }, [difficulty]);

  const move = async (from: Square, to: Square) => {
    if (kind === "computer") {
      try {
        const result = applyChessMove(fen, from, to, "q", computerHistory);
        setFen(result.fen);
        setComputerHistory(result.history);
        if (!result.outcome) runComputerMove(result.fen, result.history);
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
  const game = useMemo(
    () => createChessGame(
      currentFen,
      kind === "online" ? (match?.move_history ?? []) : computerHistory,
    ),
    [computerHistory, currentFen, kind, match?.move_history],
  );
  const onlineColor = match && identity ? (match.white_visitor_id === identity.id ? "w" : "b") : "w";
  const canMove = kind === "computer"
    ? !thinking && game.turn() === "w" && !game.isGameOver()
    : match?.status === "active" && game.turn() === onlineColor && !game.isGameOver();

  const goBack = () => {
    if (screen === "chess") {
      void leave();
      return;
    }
    setScreen(screen === "difficulty" ? "setup" : "library");
  };

  const backButton = screen === "library" ? null : (
    <button onClick={goBack} onMouseDown={(e) => e.stopPropagation()} className="flex items-center gap-0.5 text-sm text-[#0A7CFF]">
      <ChevronLeft size={21} /> {screen === "difficulty" ? "Chess" : "Games"}
    </button>
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background">
      <WindowNavShell
        isMobile={false}
        onMouseDown={nav.onDragStart}
        left={(
          <div className="flex items-center gap-3">
            <WindowControls inShell={nav.inShell} onClose={nav.onClose} onMinimize={nav.onMinimize} onToggleMaximize={nav.onToggleMaximize} isMaximized={nav.isMaximized} closeLabel={nav.closeLabel} />
            {backButton}
          </div>
        )}
        center={<p className="truncate text-center text-sm font-semibold">{screen === "library" ? "Games" : "Chess"}</p>}
        right={<WindowNavSpacer isMobile={false} />}
      />

      {screen === "library" && (
        <div className="relative flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_20%_0%,rgba(104,92,255,.2),transparent_42%),radial-gradient(circle_at_85%_90%,rgba(10,124,255,.16),transparent_44%)] p-7">
          <div className="w-full max-w-[430px] rounded-[30px] border border-white/50 bg-white/45 p-4 shadow-[0_28px_90px_rgba(26,35,76,.22)] backdrop-blur-2xl dark:border-white/10 dark:bg-white/[.07]">
            <p className="mb-3 px-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Library</p>
            <button
              onClick={() => setScreen("setup")}
              className="group flex w-full items-center gap-4 rounded-[22px] bg-background/75 p-3 text-left shadow-sm ring-1 ring-black/[.06] transition-transform can-hover:hover:-translate-y-0.5 can-hover:hover:shadow-lg dark:bg-black/20 dark:ring-white/10"
            >
              <ChessTileIcon className="h-[88px] w-[88px] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xl font-semibold tracking-tight">Chess</p>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">Play the computer or another visitor.</p>
                <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-[#0A7CFF]"><Sparkles size={15} /> Play</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {screen === "setup" && (
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,rgba(88,86,214,.13),transparent_48%)] p-8">
          <div className="w-full max-w-[500px]">
            <div className="mb-6 text-center">
              <ChessTileIcon className="mx-auto h-20 w-20" />
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Chess</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose how you want to play.</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setScreen("difficulty")} className="rounded-2xl border border-muted-foreground/20 bg-background/80 p-5 text-left shadow-sm transition-colors can-hover:hover:bg-muted/60">
                <Monitor className="mb-4 text-[#0A7CFF]" size={25} />
                <h2 className="font-semibold">Play Computer</h2>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">Play privately on this device.</p>
              </button>
              <button onClick={() => void findPlayer()} className="rounded-2xl border border-muted-foreground/20 bg-background/80 p-5 text-left shadow-sm transition-colors can-hover:hover:bg-muted/60">
                <Users className="mb-4 text-[#0A7CFF]" size={25} />
                <h2 className="font-semibold">Play a Visitor</h2>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">Meet someone else on the site.</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "difficulty" && (
        <div className="flex flex-1 items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,rgba(88,86,214,.13),transparent_48%)] p-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-6 text-center">
              <Monitor className="mx-auto text-[#0A7CFF]" size={30} />
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Play Computer</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose a difficulty.</p>
            </div>
            <div className="space-y-2">
              {(["easy", "medium", "hard"] as ChessDifficulty[]).map((level) => (
                <button key={level} onClick={() => startComputer(level)} className="flex w-full items-center justify-between rounded-2xl border border-muted-foreground/20 bg-background/80 px-5 py-4 text-left shadow-sm transition-colors can-hover:hover:bg-muted/60">
                  <span className="font-medium capitalize">{level}</span>
                  <ChevronLeft className="rotate-180 text-muted-foreground" size={19} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {screen === "chess" && (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top,rgba(80,112,190,.17),transparent_48%)] p-4">
          <div className="flex h-full min-h-0 w-full max-w-[680px] flex-col items-center gap-2.5">
            <div className="flex w-full shrink-0 items-center justify-between text-sm">
              <div className="flex items-center gap-2 font-medium">
                {kind === "online"
                  ? <OnlineMatchLabel status={match?.status} />
                  : <><Monitor size={15} /> {difficulty[0].toUpperCase() + difficulty.slice(1)} computer</>}
              </div>
              <span className="text-muted-foreground">{kind === "online" ? onlineStatusText(match, game, onlineColor) : statusText(game, "w", thinking)}</span>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center">
              <div className="aspect-square h-full max-h-full max-w-full">
                <ChessBoard fen={currentFen} orientation={kind === "online" ? onlineColor : "w"} disabled={!canMove} onMove={(from, to) => void move(from, to)} />
              </div>
            </div>
            {onlineError && <div className="flex w-full shrink-0 items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600"><WifiOff size={16} />{onlineError}</div>}
            {(game.isGameOver() || match?.status === "completed" || match?.status === "expired") && <button onClick={kind === "computer" ? () => startComputer(difficulty) : () => void findPlayer()} className="flex shrink-0 items-center gap-2 rounded-xl bg-[#0A7CFF] px-5 py-2.5 text-sm font-semibold text-white"><RotateCcw size={16} /> New Game</button>}
          </div>
        </div>
      )}
    </div>
  );
}
