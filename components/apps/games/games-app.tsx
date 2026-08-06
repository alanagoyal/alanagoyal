"use client";

import { Chess, type Square } from "chess.js";
import { ChevronLeft, LoaderCircle, Monitor, RotateCcw, Users, Wifi, WifiOff } from "lucide-react";
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
import {
  loadVisitorIdentity,
  MATCHMAKING_TIMEOUT_MS,
  type GameMatch,
  type VisitorIdentity,
} from "@/lib/games/matches";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { cn } from "@/lib/utils";

type Screen = "games" | "setup" | "waiting" | "chess";
type PlayKind = "computer" | "online";
type ChessSound = "capture" | "move-self" | "notify";

interface GamesAppProps {
  onWaitingBadgeChange?: (waiting: boolean) => void;
}

const PIECES: Record<string, string> = {
  p: "♟︎", n: "♞︎", b: "♝︎", r: "♜︎", q: "♛︎", k: "♚︎",
};
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const DIFFICULTIES: ChessDifficulty[] = ["easy", "medium", "hard"];

function playChessSound(sound: ChessSound) {
  const audio = new Audio(`/sounds/chess/${sound}.mp3`);
  audio.volume = sound === "notify" ? 0.65 : 0.8;
  void audio.play().catch(() => undefined);
}

function primeChessSounds() {
  const audio = new Audio("/sounds/chess/move-self.mp3");
  audio.volume = 0;
  void audio.play().then(() => {
    audio.pause();
    audio.currentTime = 0;
  }).catch(() => undefined);
}

function formatElapsedTime(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

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

export function GamesApp({ onWaitingBadgeChange }: GamesAppProps) {
  const nav = useWindowNavBehavior({ isDesktop: true, isMobile: false, shellEnabled: true });
  const [screen, setScreen] = useState<Screen>("games");
  const [kind, setKind] = useState<PlayKind>("computer");
  const [difficulty, setDifficulty] = useState<ChessDifficulty>("medium");
  const [computerOptionsOpen, setComputerOptionsOpen] = useState(false);
  const [fen, setFen] = useState(() => new Chess().fen());
  const [computerHistory, setComputerHistory] = useState<ChessMoveRecord[]>([]);
  const [thinking, setThinking] = useState(false);
  const [match, setMatch] = useState<GameMatch | null>(null);
  const [identity, setIdentity] = useState<VisitorIdentity | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const [visitorWaiting, setVisitorWaiting] = useState(false);
  const [waitingElapsed, setWaitingElapsed] = useState(0);
  const [waitingTimedOut, setWaitingTimedOut] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const waitingStartedAtRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const onlineSoundRef = useRef({ matchId: "", historyLength: 0 });

  useEffect(() => {
    let cancelled = false;
    const visitor = loadVisitorIdentity();
    setIdentity(visitor);
    void gamesApi.resume(visitor).then((response) => {
      if (cancelled || !response.match) return;
      setKind("online");
      setMatch(response.match);
      onWaitingBadgeChange?.(false);
      if (response.match.status === "active") {
        setScreen("chess");
        return;
      }
      const startedAt = Date.parse(response.match.created_at);
      waitingStartedAtRef.current = Number.isFinite(startedAt) ? startedAt : Date.now();
      setWaitingElapsed(Date.now() - waitingStartedAtRef.current);
      setScreen("waiting");
    }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [onWaitingBadgeChange]);
  useEffect(() => () => workerRef.current?.terminate(), []);

  useEffect(() => {
    if (screen !== "games" && screen !== "setup") return;
    let cancelled = false;
    const refresh = async () => {
      const waiting = await gamesApi.waitingBadge().catch(() => false);
      if (cancelled) return;
      setVisitorWaiting(waiting);
      onWaitingBadgeChange?.(waiting);
    };
    void refresh();
    const interval = window.setInterval(() => void refresh(), 5_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [onWaitingBadgeChange, screen]);

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
    primeChessSounds();
    setKind("computer");
    setDifficulty(level);
    setComputerOptionsOpen(false);
    setFen(new Chess().fen());
    setComputerHistory([]);
    setMatch(null);
    setOnlineError(null);
    setScreen("chess");
  };

  const findPlayer = async () => {
    const visitor = identity ?? loadVisitorIdentity();
    if (!visitor.id) return;
    primeChessSounds();
    if (!identity) setIdentity(visitor);
    setOnlineError(null);
    setKind("online");
    setMatch(null);
    setWaitingElapsed(0);
    setWaitingTimedOut(false);
    timeoutHandledRef.current = false;
    waitingStartedAtRef.current = Date.now();
    setScreen("waiting");
    try {
      const response = await gamesApi.matchmake(visitor);
      if (response.match) {
        setMatch(response.match);
        if (response.match.status === "active") onWaitingBadgeChange?.(false);
      }
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Online play is unavailable.");
    }
  };

  const timeoutMatchmaking = useCallback(() => {
    if (timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    if (identity && match?.status === "waiting") {
      void gamesApi.leave(identity, match.id).catch(() => undefined);
    }
    setMatch(null);
    setWaitingTimedOut(true);
    setVisitorWaiting(false);
    onWaitingBadgeChange?.(false);
  }, [identity, match, onWaitingBadgeChange]);

  useEffect(() => {
    if (screen !== "waiting" || waitingTimedOut || match?.status === "active") return;
    if (!waitingStartedAtRef.current) waitingStartedAtRef.current = Date.now();
    const update = () => {
      const elapsed = Date.now() - (waitingStartedAtRef.current ?? Date.now());
      setWaitingElapsed(elapsed);
      if (elapsed >= MATCHMAKING_TIMEOUT_MS) void timeoutMatchmaking();
    };
    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [match?.status, screen, timeoutMatchmaking, waitingTimedOut]);

  useEffect(() => {
    if (screen !== "waiting" || match?.status !== "active") return;
    playChessSound("notify");
    setVisitorWaiting(false);
    onWaitingBadgeChange?.(false);
    setScreen("chess");
  }, [match?.status, onWaitingBadgeChange, screen]);

  useEffect(() => {
    if (!match) {
      onlineSoundRef.current = { matchId: "", historyLength: 0 };
      return;
    }
    const historyLength = match.move_history.length;
    if (onlineSoundRef.current.matchId !== match.id) {
      onlineSoundRef.current = { matchId: match.id, historyLength };
      return;
    }
    if (screen === "chess" && historyLength > onlineSoundRef.current.historyLength) {
      const latestMove = match.move_history.at(-1);
      playChessSound(latestMove?.captured ? "capture" : "move-self");
    }
    onlineSoundRef.current.historyLength = historyLength;
  }, [match, screen]);

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
        playChessSound(result.move.captured ? "capture" : "move-self");
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
        playChessSound(result.move.captured ? "capture" : "move-self");
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

  const leave = (destination: Screen = "games") => {
    if (kind === "online" && identity && match) {
      void gamesApi.leave(identity, match.id).catch(() => undefined);
    }
    setMatch(null);
    setOnlineError(null);
    setWaitingTimedOut(false);
    setWaitingElapsed(0);
    waitingStartedAtRef.current = null;
    timeoutHandledRef.current = false;
    setScreen(destination);
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
    if (screen === "chess" || screen === "waiting") {
      leave(screen === "waiting" ? "setup" : "games");
      return;
    }
    setComputerOptionsOpen(false);
    setScreen("games");
  };

  const backButton = screen === "games" ? null : (
    <button onClick={goBack} onMouseDown={(e) => e.stopPropagation()} className="flex items-center gap-0.5 text-sm text-[#0A7CFF]">
      <ChevronLeft size={21} /> {screen === "waiting" ? "Chess" : "Games"}
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
        center={<p className="truncate text-center text-sm font-semibold">{screen === "games" ? "Games" : "Chess"}</p>}
        right={<WindowNavSpacer isMobile={false} />}
      />

      {screen === "games" && (
        <div className="flex flex-1 items-start overflow-auto bg-background p-6">
          <button
            onClick={() => setScreen("setup")}
            className="flex w-[370px] items-center gap-4 rounded-2xl p-3 text-left transition-colors can-hover:hover:bg-muted"
          >
            <ChessTileIcon className="h-[88px] w-[88px] shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-xl font-semibold tracking-tight">Chess</p>
              <p className="mt-1 text-sm leading-snug text-muted-foreground">Play the computer or another visitor.</p>
              <p className="mt-3 text-sm font-medium text-[#0A7CFF]">Play</p>
            </div>
          </button>
        </div>
      )}

      {screen === "setup" && (
        <div className="flex flex-1 items-center justify-center overflow-auto bg-background p-8">
          <div className="w-full max-w-[500px]">
            <div className="mb-6 text-center">
              <ChessTileIcon className="mx-auto h-20 w-20" />
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Chess</h1>
              <p className="mt-1 text-sm text-muted-foreground">Choose how you want to play.</p>
            </div>
            <div className="grid grid-cols-2 items-start gap-3">
              <div className="rounded-2xl border border-muted-foreground/20 bg-background shadow-sm">
                <button
                  onClick={() => setComputerOptionsOpen((open) => !open)}
                  className="w-full p-5 text-left"
                  aria-expanded={computerOptionsOpen}
                >
                  <Monitor className="mb-4 text-[#0A7CFF]" size={25} />
                  <h2 className="font-semibold">Play Computer</h2>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">Play privately on this device.</p>
                </button>
                {computerOptionsOpen && (
                  <div className="border-t border-muted-foreground/20 p-3">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Difficulty</p>
                    <div className="grid grid-cols-3 rounded-lg bg-muted p-0.5" role="group" aria-label="Computer difficulty">
                      {DIFFICULTIES.map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level)}
                          className={cn(
                            "rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                            difficulty === level
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground can-hover:hover:text-foreground",
                          )}
                          aria-pressed={difficulty === level}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => startComputer(difficulty)}
                      className="mt-3 w-full rounded-lg bg-[#0A7CFF] px-3 py-2 text-sm font-semibold text-white can-hover:hover:bg-[#0870e5]"
                    >
                      Play
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => void findPlayer()} className="rounded-2xl border border-muted-foreground/20 bg-background/80 p-5 text-left shadow-sm transition-colors can-hover:hover:bg-muted/60">
                <div className="mb-4 flex items-start justify-between">
                  <Users className="text-[#0A7CFF]" size={25} />
                  {visitorWaiting && <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">1</span>}
                </div>
                <h2 className="font-semibold">{visitorWaiting ? "Join a Visitor" : "Play a Visitor"}</h2>
                <p className="mt-1 text-sm leading-snug text-muted-foreground">{visitorWaiting ? "Someone is waiting to play." : "Meet someone else on the site."}</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "waiting" && (
        <div className="flex flex-1 items-center justify-center overflow-auto bg-background p-8">
          <div className="w-full max-w-[390px] text-center">
            {waitingTimedOut ? (
              <>
                <Users className="mx-auto text-muted-foreground" size={34} />
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">No other players found</h1>
                <p className="mt-2 text-sm text-muted-foreground">Nobody joined this time. You can try again or play the computer.</p>
                <div className="mt-6 flex justify-center gap-2">
                  <button
                    onClick={() => {
                      setWaitingTimedOut(false);
                      setComputerOptionsOpen(true);
                      setScreen("setup");
                    }}
                    className="rounded-lg border border-muted-foreground/20 bg-background px-4 py-2 text-sm font-medium shadow-sm can-hover:hover:bg-muted"
                  >
                    Play Computer
                  </button>
                  <button onClick={() => void findPlayer()} className="rounded-lg bg-[#0A7CFF] px-4 py-2 text-sm font-semibold text-white can-hover:hover:bg-[#0870e5]">
                    Try Again
                  </button>
                </div>
              </>
            ) : (
              <>
                <LoaderCircle className="mx-auto animate-spin text-[#0A7CFF]" size={34} />
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">Waiting for a player…</h1>
                <p className="mt-2 text-sm text-muted-foreground">Another visitor can join from Games.</p>
                <p className="mt-5 font-mono text-2xl tabular-nums text-foreground">{formatElapsedTime(waitingElapsed)}</p>
                {onlineError && <p className="mt-4 text-sm text-red-600">{onlineError}</p>}
              </>
            )}
          </div>
        </div>
      )}

      {screen === "chess" && (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-background p-4">
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
