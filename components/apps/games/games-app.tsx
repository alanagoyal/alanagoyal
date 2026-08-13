"use client";

import { Chess, type Square } from "chess.js";
import { ChevronLeft, LoaderCircle, RotateCcw, SlidersHorizontal, Wifi, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameTileIcon, type LibraryGameId } from "@/components/apps/games/game-icons";
import { BreakoutGame, MemoryGame, MinesweeperGame, SnakeGame, TwentyFortyEightGame } from "@/components/apps/games/solo-games";
import { WindowControls } from "@/components/window-controls";
import { WindowNavShell, WindowNavSpacer } from "@/components/window-nav-shell";
import { gamesApi, type WaitingPlayer } from "@/lib/games/api";
import {
  applyChessMove,
  createChessGame,
  legalTargets,
  type ChessDifficulty,
  type ChessMoveRecord,
} from "@/lib/games/chess";
import {
  loadVisitorIdentity,
  loadPlayerName,
  MATCHMAKING_TIMEOUT_MS,
  normalizePlayerName,
  savePlayerName,
  type GameMatch,
  type VisitorIdentity,
} from "@/lib/games/matches";
import { useWindowNavBehavior } from "@/lib/use-window-nav-behavior";
import { cn } from "@/lib/utils";

type Screen = "library" | "setup" | "waiting" | LibraryGameId;
type PlayKind = "computer" | "online";
type ChessSound = "capture" | "move-self" | "notify";

interface GamesAppProps {
  waitingPlayer?: WaitingPlayer;
  onWaitingBadgeChange?: (waiting: boolean) => void;
}

const PIECES: Record<string, string> = {
  p: "♟︎", n: "♞︎", b: "♝︎", r: "♜︎", q: "♛︎", k: "♚︎",
};
const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const DIFFICULTIES: ChessDifficulty[] = ["easy", "medium", "hard"];
const MIN_COMPUTER_TURN_MS = 250;

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

function formatCountdownTime(elapsedMilliseconds: number) {
  const seconds = Math.max(0, Math.ceil((MATCHMAKING_TIMEOUT_MS - elapsedMilliseconds) / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

const LIBRARY_GAMES: Array<{ id: LibraryGameId; name: string; description: string }> = [
  { id: "chess", name: "Chess", description: "Computer & online play" },
  { id: "snake", name: "Snake", description: "Classic arcade" },
  { id: "2048", name: "2048", description: "Number puzzle" },
  { id: "minesweeper", name: "Minesweeper", description: "Logic puzzle" },
  { id: "memory", name: "Memory Match", description: "Card matching" },
  { id: "breakout", name: "Breakout", description: "Classic arcade" },
];

const LAST_PLAYED_KEY = "games-library-last-played-v1";

function loadLastPlayed() {
  if (typeof window === "undefined") return {} as Partial<Record<LibraryGameId, number>>;
  try { return JSON.parse(window.localStorage.getItem(LAST_PLAYED_KEY) ?? "{}") as Partial<Record<LibraryGameId, number>>; }
  catch { return {}; }
}

function relativePlayedAt(timestamp?: number) {
  if (!timestamp) return "Added today";
  const elapsed = Date.now() - timestamp;
  if (elapsed < 60_000) return "Played just now";
  if (elapsed < 3_600_000) return `Played ${Math.max(1, Math.floor(elapsed / 60_000))}m ago`;
  if (elapsed < 86_400_000) return `Played ${Math.max(1, Math.floor(elapsed / 3_600_000))}h ago`;
  return `Played ${Math.max(1, Math.floor(elapsed / 86_400_000))}d ago`;
}

function CenteredScrollScreen({ children, contentClassName }: {
  children: React.ReactNode;
  contentClassName: string;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-background">
      <div className="flex min-h-full w-full items-center justify-center p-8">
        <div className={contentClassName}>{children}</div>
      </div>
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

function matchResultText(match: GameMatch | null, game: Chess, playerColor: "w" | "b") {
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
    <div className="grid aspect-square w-full grid-cols-8 grid-rows-8 overflow-hidden rounded-xl [container-type:inline-size] shadow-[0_18px_55px_rgba(15,23,42,.28)] ring-1 ring-black/15">
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
              "relative flex min-h-0 min-w-0 items-center justify-center text-[clamp(1.35rem,9.5cqw,3.2rem)] leading-none",
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

export function GamesApp({ waitingPlayer = { waiting: false, name: null }, onWaitingBadgeChange }: GamesAppProps) {
  const nav = useWindowNavBehavior({ isDesktop: true, isMobile: false, shellEnabled: true });
  const [screen, setScreen] = useState<Screen>("library");
  const [kind, setKind] = useState<PlayKind>("computer");
  const [difficulty, setDifficulty] = useState<ChessDifficulty>("medium");
  const [computerOptionsOpen, setComputerOptionsOpen] = useState(false);
  const [visitorOptionsOpen, setVisitorOptionsOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [fen, setFen] = useState(() => new Chess().fen());
  const [computerHistory, setComputerHistory] = useState<ChessMoveRecord[]>([]);
  const [thinking, setThinking] = useState(false);
  const [match, setMatch] = useState<GameMatch | null>(null);
  const [identity, setIdentity] = useState<VisitorIdentity | null>(null);
  const [onlineError, setOnlineError] = useState<string | null>(null);
  const waitingPlayerName = waitingPlayer.waiting ? waitingPlayer.name : null;
  const [waitingElapsed, setWaitingElapsed] = useState(0);
  const [waitingTimedOut, setWaitingTimedOut] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "name">("recent");
  const [lastPlayed, setLastPlayed] = useState<Partial<Record<LibraryGameId, number>>>({});
  const workerRef = useRef<Worker | null>(null);
  const computerMoveTimerRef = useRef<number | null>(null);
  const waitingStartedAtRef = useRef<number | null>(null);
  const timeoutHandledRef = useRef(false);
  const onlineSoundRef = useRef({ matchId: "", historyLength: 0 });

  useEffect(() => {
    let cancelled = false;
    const visitor = loadVisitorIdentity();
    setIdentity(visitor);
    setPlayerName(loadPlayerName());
    void gamesApi.resume(visitor).then((response) => {
      if (cancelled || !response.match) return;
      setKind("online");
      setMatch(response.match);
      const resumedName = response.match.white_visitor_id === visitor.id
        ? response.match.white_name
        : response.match.black_name;
      if (resumedName) {
        setPlayerName(resumedName);
        savePlayerName(resumedName);
      }
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

  useEffect(() => { setLastPlayed(loadLastPlayed()); }, []);

  const openLibraryGame = (gameId: LibraryGameId) => {
    const nextPlayed = { ...lastPlayed, [gameId]: Date.now() };
    setLastPlayed(nextPlayed);
    window.localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(nextPlayed));
    setScreen(gameId === "chess" ? "setup" : gameId);
  };
  const cancelComputerMove = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    if (computerMoveTimerRef.current !== null) {
      window.clearTimeout(computerMoveTimerRef.current);
      computerMoveTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelComputerMove(), [cancelComputerMove]);

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
    const sendHeartbeat = async () => {
      if (document.hidden) return;
      const response = await gamesApi.heartbeat(identity, matchId);
      if (response.match) setMatch(response.match);
    };
    const heartbeat = window.setInterval(() => void sendHeartbeat().catch(() => undefined), 15_000);
    const poll = window.setInterval(() => { if (!document.hidden) void syncMatch(); }, 2_000);
    const onVisible = async () => {
      if (document.hidden) return;
      try {
        await sendHeartbeat();
        await syncMatch();
      } catch {
        setOnlineError("Couldn’t reconnect.");
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => { window.clearInterval(heartbeat); window.clearInterval(poll); document.removeEventListener("visibilitychange", onVisible); };
  }, [identity, match?.status, matchId, syncMatch]);

  const startComputer = (level: ChessDifficulty) => {
    cancelComputerMove();
    setThinking(false);
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
    const normalizedName = normalizePlayerName(playerName);
    if (!normalizedName || normalizedName.length > 20) {
      setOnlineError("Enter a name between 1 and 20 characters.");
      return;
    }
    const visitor = identity ?? loadVisitorIdentity();
    if (!visitor.id) return;
    primeChessSounds();
    savePlayerName(normalizedName);
    setPlayerName(normalizedName);
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
      const response = await gamesApi.matchmake(visitor, normalizedName);
      if (response.match) {
        setMatch(response.match);
        if (response.match.status === "active") onWaitingBadgeChange?.(false);
      }
    } catch (error) {
      setOnlineError(error instanceof Error ? error.message : "Online play is unavailable.");
      setMatch(null);
      setWaitingElapsed(0);
      waitingStartedAtRef.current = null;
      timeoutHandledRef.current = false;
      setVisitorOptionsOpen(true);
      setScreen("setup");
    }
  };

  const timeoutMatchmaking = useCallback(async () => {
    if (timeoutHandledRef.current) return;
    timeoutHandledRef.current = true;
    if (identity && match?.status === "waiting") {
      try {
        const response = await gamesApi.cancelWaiting(identity, match.id, match.version);
        if (response.match?.status === "active") {
          setMatch(response.match);
          setWaitingTimedOut(false);
          onWaitingBadgeChange?.(false);
          return;
        }
      } catch {
        timeoutHandledRef.current = false;
        setOnlineError("Couldn’t stop matchmaking. Reconnecting…");
        void syncMatch();
        return;
      }
    }
    setMatch(null);
    setWaitingTimedOut(true);
    onWaitingBadgeChange?.(false);
  }, [identity, match, onWaitingBadgeChange, syncMatch]);

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
    cancelComputerMove();
    setThinking(true);
    const startedAt = performance.now();
    const worker = new Worker(new URL("./chess-ai.worker.ts", import.meta.url));
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ from: Square; to: Square; promotion?: string } | null>) => {
      worker.terminate();
      if (workerRef.current === worker) workerRef.current = null;
      const move = event.data;
      const remainingDelay = Math.max(0, MIN_COMPUTER_TURN_MS - (performance.now() - startedAt));
      computerMoveTimerRef.current = window.setTimeout(() => {
        computerMoveTimerRef.current = null;
        if (move) {
          const result = applyChessMove(nextFen, move.from, move.to, move.promotion, history);
          setFen(result.fen);
          setComputerHistory(result.history);
          playChessSound(result.move.captured ? "capture" : "move-self");
        }
        setThinking(false);
      }, remainingDelay);
    };
    worker.onerror = () => {
      if (workerRef.current === worker) workerRef.current = null;
      setThinking(false);
      worker.terminate();
    };
    worker.postMessage({ fen: nextFen, difficulty });
  }, [cancelComputerMove, difficulty]);

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

  const leave = (destination: Screen = "library") => {
    cancelComputerMove();
    setThinking(false);
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
  const ownName = kind === "online"
    ? ((onlineColor === "w" ? match?.white_name : match?.black_name) ?? playerName) || "You"
    : "You";
  const opponentName = kind === "online"
    ? (onlineColor === "w" ? match?.black_name : match?.white_name) ?? "Opponent"
    : "Computer";
  const gameEnded = game.isGameOver() || match?.status === "completed" || match?.status === "expired";
  const isOwnTurn = !gameEnded && (kind === "computer"
    ? !thinking && game.turn() === "w"
    : match?.status === "active" && game.turn() === onlineColor);
  const isOpponentTurn = !gameEnded && !isOwnTurn;
  const finalStatus = kind === "online"
    ? matchResultText(match, game, onlineColor)
    : statusText(game, "w", thinking);
  const startNewGame = () => {
    if (kind === "computer") {
      startComputer(difficulty);
      return;
    }
    void findPlayer();
  };
  const sortedLibraryGames = useMemo(() => {
    return [...LIBRARY_GAMES].sort((left, right) => sortBy === "name"
        ? left.name.localeCompare(right.name)
        : (lastPlayed[right.id] ?? 0) - (lastPlayed[left.id] ?? 0));
  }, [lastPlayed, sortBy]);
  const navAction = screen === "chess" && gameEnded ? (
    <button
      type="button"
      onClick={startNewGame}
      onMouseDown={(event) => event.stopPropagation()}
      className="flex h-8 items-center gap-1.5 rounded-md bg-[#0A7CFF] px-2.5 text-xs font-semibold text-white can-hover:hover:bg-[#0870e5]"
      title="Start a new game"
      aria-label="New Game"
    >
      <RotateCcw size={14} />
      New Game
    </button>
  ) : kind === "online" && (screen === "waiting" || screen === "chess") && !waitingTimedOut ? (
    onlineError ? (
      <span className="flex h-8 w-8 items-center justify-center text-red-500" title="Disconnected" aria-label="Disconnected">
        <WifiOff size={16} />
      </span>
    ) : match?.status === "active" ? (
      <span className="flex h-8 w-8 items-center justify-center text-emerald-500" title="Connected" aria-label="Connected">
        <Wifi size={16} />
      </span>
    ) : (
      <span className="flex h-8 w-8 items-center justify-center text-amber-500" title="Waiting for player" aria-label="Waiting for player">
        <Wifi size={16} />
      </span>
    )
  ) : <WindowNavSpacer isMobile={false} />;

  const goBack = () => {
    if (screen === "chess" || screen === "waiting") {
      leave("setup");
      return;
    }
    setComputerOptionsOpen(false);
    setVisitorOptionsOpen(false);
    setScreen("library");
  };

  const backButton = screen === "library" ? null : (
    <button
      onClick={goBack}
      onMouseDown={(event) => event.stopPropagation()}
      className="flex h-7 w-7 items-center justify-center rounded-md text-[#0A7CFF] can-hover:hover:bg-black/5"
      aria-label="Go back"
    >
      <ChevronLeft size={22} />
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
        center={screen === "library" ? <span /> : <p className="truncate text-center text-sm font-semibold">{screen === "setup" || screen === "waiting" || screen === "chess" ? "Chess" : LIBRARY_GAMES.find((libraryGame) => libraryGame.id === screen)?.name}</p>}
        right={navAction}
      />

      {screen === "library" && (
        <div className="min-h-0 flex-1 overflow-auto bg-background px-7 pb-7 pt-5">
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-5 flex items-center justify-between">
              <h1 className="text-xl font-semibold tracking-tight">Your Games</h1>
              <button type="button" onClick={() => setSortBy((value) => value === "recent" ? "name" : "recent")} className="flex h-8 items-center gap-1.5 rounded-full bg-muted px-3 text-xs font-medium text-muted-foreground can-hover:hover:text-foreground" title={`Sort by ${sortBy === "recent" ? "name" : "recently played"}`}><SlidersHorizontal size={14} />{sortBy === "recent" ? "Recent" : "Name"}</button>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-5 min-[620px]:grid-cols-2 min-[1080px]:grid-cols-3">
                {sortedLibraryGames.map((libraryGame) => (
                  <div key={libraryGame.id} className="flex min-w-0 items-center gap-3">
                    <span className="relative shrink-0">
                      <GameTileIcon game={libraryGame.id} className="h-[82px] w-[82px]" />
                      {libraryGame.id === "chess" && waitingPlayerName && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white shadow-sm">1</span>}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{libraryGame.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{libraryGame.id === "chess" && waitingPlayerName ? `${waitingPlayerName} is ready` : relativePlayedAt(lastPlayed[libraryGame.id])}</p>
                      <p className="truncate text-xs text-muted-foreground">{libraryGame.description}</p>
                      <button type="button" aria-label={`${libraryGame.id === "chess" && waitingPlayerName ? "Join" : "Play"} ${libraryGame.name}`} onClick={() => openLibraryGame(libraryGame.id)} className="mt-2 min-w-[68px] rounded-full bg-muted px-4 py-1 text-xs font-semibold transition-colors can-hover:hover:bg-muted-foreground/20">{libraryGame.id === "chess" && waitingPlayerName ? "Join" : "Play"}</button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {screen === "setup" && (
        <CenteredScrollScreen contentClassName="w-full max-w-[500px] pb-32">
            <div className="mb-7 text-center">
              <GameTileIcon game="chess" className="mx-auto h-20 w-20" />
              <h1 className="mt-3 text-2xl font-semibold tracking-tight">Chess</h1>
            </div>
            <div className="grid grid-cols-2 items-start gap-3">
              <div className={cn(
                "relative border border-muted-foreground/20 bg-background shadow-sm",
                computerOptionsOpen ? "rounded-t-2xl" : "rounded-2xl",
              )}>
                <button
                  onClick={() => {
                    setVisitorOptionsOpen(false);
                    setComputerOptionsOpen((open) => !open);
                  }}
                  className="w-full p-5 text-left"
                  aria-expanded={computerOptionsOpen}
                >
                  <h2 className="font-semibold">Play Computer</h2>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">Play privately on this device.</p>
                </button>
                {computerOptionsOpen && (
                  <div className="absolute left-[-1px] right-[-1px] top-full z-10 rounded-b-2xl border-x border-b border-muted-foreground/20 bg-background p-3 shadow-sm">
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
              <div className={cn(
                "relative border border-muted-foreground/20 bg-background shadow-sm",
                visitorOptionsOpen ? "rounded-t-2xl" : "rounded-2xl",
              )}>
                <button
                  onClick={() => {
                    setComputerOptionsOpen(false);
                    setVisitorOptionsOpen((open) => !open);
                    setOnlineError(null);
                  }}
                  className="w-full p-5 text-left"
                  aria-expanded={visitorOptionsOpen}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{waitingPlayerName ? `Join ${waitingPlayerName}` : "Play a Visitor"}</h2>
                      <p className="mt-1 text-sm leading-snug text-muted-foreground">
                        {waitingPlayerName ? `${waitingPlayerName} is ready to play.` : "Meet someone else on the site."}
                      </p>
                    </div>
                    {waitingPlayerName && <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-semibold text-white">1</span>}
                  </div>
                </button>
                {visitorOptionsOpen && (
                  <form
                    className="absolute left-[-1px] right-[-1px] top-full z-10 rounded-b-2xl border-x border-b border-muted-foreground/20 bg-background p-3 shadow-sm"
                    onSubmit={(event) => {
                      event.preventDefault();
                      void findPlayer();
                    }}
                  >
                    <label htmlFor="chess-player-name" className="mb-2 block text-xs font-medium text-muted-foreground">Your name</label>
                    <div className="flex gap-2">
                      <input
                        id="chess-player-name"
                        value={playerName}
                        onChange={(event) => {
                          setPlayerName(event.target.value);
                          setOnlineError(null);
                        }}
                        maxLength={20}
                        autoComplete="nickname"
                        autoFocus
                        placeholder="Name"
                        onKeyDown={(event) => {
                          if (event.key === "Escape") event.currentTarget.blur();
                        }}
                        className="min-w-0 flex-1 rounded-lg border border-muted-foreground/25 bg-background px-3 py-2 text-sm outline-none focus:border-[#0A7CFF] focus:ring-2 focus:ring-[#0A7CFF]/15"
                      />
                      <button type="submit" className="rounded-lg bg-[#0A7CFF] px-4 py-2 text-sm font-semibold text-white can-hover:hover:bg-[#0870e5]">
                        {waitingPlayerName ? "Join" : "Play"}
                      </button>
                    </div>
                    {onlineError && <p className="mt-2 text-xs text-red-600">{onlineError}</p>}
                  </form>
                )}
              </div>
            </div>
        </CenteredScrollScreen>
      )}

      {screen === "waiting" && (
        <CenteredScrollScreen contentClassName="w-full max-w-[390px] text-center">
            {waitingTimedOut ? (
              <>
                <h1 className="text-2xl font-semibold tracking-tight">No other players found</h1>
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
                <h1 className="mt-4 text-2xl font-semibold tracking-tight">Waiting for another player…</h1>
                <p className="mt-2 text-sm text-muted-foreground">Another visitor can join from Games.</p>
                <p className="mt-5 font-mono text-2xl tabular-nums text-foreground">{formatCountdownTime(waitingElapsed)}</p>
                {onlineError && <p className="mt-4 text-sm text-red-600">{onlineError}</p>}
              </>
            )}
        </CenteredScrollScreen>
      )}

      {screen === "chess" && (
        <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-background px-5 py-4">
          <div className="flex h-full min-h-0 w-full max-w-[680px] flex-col items-center">
            <div className="flex min-h-0 w-full flex-1 flex-col items-center gap-[13px]">
              <div className="flex h-5 w-full shrink-0 items-center justify-center gap-2 text-sm font-semibold">
                <span>{opponentName}</span>
                {isOpponentTurn && <span className="h-2 w-2 rounded-full bg-[#0A7CFF] shadow-[0_0_0_3px_rgba(10,124,255,.12)]" />}
              </div>
              <div className="flex min-h-0 w-full flex-1 items-center justify-center">
                <div className="aspect-square h-full max-h-full max-w-full">
                  <ChessBoard fen={currentFen} orientation={kind === "online" ? onlineColor : "w"} disabled={!canMove} onMove={(from, to) => void move(from, to)} />
                </div>
              </div>
              <div className="flex h-5 w-full shrink-0 items-center justify-center gap-2 text-sm font-semibold">
                {gameEnded ? (
                  <span className="font-normal text-muted-foreground">{finalStatus}</span>
                ) : (
                  <>
                    <span>{ownName}</span>
                    {isOwnTurn && <span className="h-2 w-2 rounded-full bg-[#0A7CFF] shadow-[0_0_0_3px_rgba(10,124,255,.12)]" />}
                  </>
                )}
              </div>
            </div>
            {onlineError && <div className="flex w-full shrink-0 items-center gap-2 rounded-xl bg-red-500/10 px-3 py-2 text-sm text-red-600"><WifiOff size={16} />{onlineError}</div>}
          </div>
        </div>
      )}

      {screen === "snake" && <SnakeGame />}
      {screen === "2048" && <TwentyFortyEightGame />}
      {screen === "minesweeper" && <MinesweeperGame />}
      {screen === "memory" && <MemoryGame />}
      {screen === "breakout" && <BreakoutGame />}
    </div>
  );
}
