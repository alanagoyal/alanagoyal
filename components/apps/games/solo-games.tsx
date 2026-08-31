"use client";

import { Flag, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  apply2048Move,
  create2048Board,
  createMemoryGameState,
  createSnakeFood,
  type Game2048State,
  type GridDirection,
  initializeMinefield,
  type MineCell,
  revealMinefield,
  type SnakePoint,
  stepSnake,
} from "@/lib/games/solo";
import {
  BREAKOUT_LEVELS,
  CAMPAIGN_LEVEL_COUNT,
  type CampaignLevel,
  getCampaignConfig,
  loadCampaignLevel,
  MEMORY_LEVELS,
  MINESWEEPER_LEVELS,
  nextCampaignLevel,
  saveCampaignLevel,
} from "@/lib/games/levels";
import { cn } from "@/lib/utils";

function GameButton({ children, onClick, primary = false, disabled = false }: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-45",
        primary ? "bg-[#0A7CFF] text-white can-hover:hover:bg-[#0870e5]" : "bg-muted text-foreground can-hover:hover:bg-muted-foreground/15",
      )}
    >
      {children}
    </button>
  );
}

function GameFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto bg-background [container-type:size]">
      <div className="flex min-h-full w-full items-center justify-center p-5">
        {children}
      </div>
    </div>
  );
}

function GameStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-nowrap text-xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}

function CampaignHeader({ level, stats, onRestart }: {
  level: CampaignLevel;
  stats: Array<{ label: string; value: React.ReactNode }>;
  onRestart: () => void;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex gap-4 sm:gap-6">
        <GameStat label="Level" value={`${level} of ${CAMPAIGN_LEVEL_COUNT}`} />
        {stats.map((stat) => <GameStat key={stat.label} label={stat.label} value={stat.value} />)}
      </div>
      <GameButton onClick={onRestart}><RotateCcw size={14} />Restart Level</GameButton>
    </div>
  );
}

function CampaignResultOverlay({ level, result, detail, failureTitle, onAction, className, buttonClassName }: {
  level: CampaignLevel;
  result: "complete" | "failed";
  detail: string;
  failureTitle?: string;
  onAction: () => void;
  className?: string;
  buttonClassName?: string;
}) {
  const nextLevel = nextCampaignLevel(level);
  const title = result === "failed"
    ? failureTitle ?? "Game Over"
    : nextLevel
      ? `Level ${level} complete!`
      : "All levels complete!";
  const action = result === "failed"
    ? "Try Again"
    : nextLevel
      ? `Continue to Level ${nextLevel}`
      : "Play Again";

  return (
    <div className={cn("absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-white backdrop-blur-[3px]", className)}>
      <p className="text-2xl font-semibold">{title}</p>
      <p className="mt-1 text-sm text-white/75">{detail}</p>
      <button type="button" onClick={onAction} className={cn("mt-4 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 can-hover:hover:bg-white/90", buttonClassName)}>{action}</button>
    </div>
  );
}

const DIRECTION_KEYS: Record<string, GridDirection | undefined> = {
  ArrowUp: "up", w: "up", W: "up",
  ArrowDown: "down", s: "down", S: "down",
  ArrowLeft: "left", a: "left", A: "left",
  ArrowRight: "right", d: "right", D: "right",
};

export function SnakeGame() {
  const initialSnake = (): SnakePoint[] => [{ x: 8, y: 9 }, { x: 7, y: 9 }, { x: 6, y: 9 }];
  const [snake, setSnake] = useState<SnakePoint[]>(initialSnake);
  const [food, setFood] = useState(() => createSnakeFood(initialSnake()));
  const [direction, setDirection] = useState<GridDirection>("right");
  const [running, setRunning] = useState(false);
  const [over, setOver] = useState(false);
  const directionRef = useRef(direction);

  const reset = useCallback(() => {
    const next = initialSnake();
    setSnake(next);
    setFood(createSnakeFood(next));
    directionRef.current = "right";
    setDirection("right");
    setRunning(false);
    setOver(false);
  }, []);

  const turn = useCallback((next: GridDirection) => {
    const opposite = { up: "down", down: "up", left: "right", right: "left" } as const;
    if (opposite[directionRef.current] === next) return;
    directionRef.current = next;
    setDirection(next);
    if (!over) setRunning(true);
  }, [over]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const next = DIRECTION_KEYS[event.key];
      if (!next) {
        if (event.key === " " && !over) {
          event.preventDefault();
          setRunning((value) => !value);
        }
        return;
      }
      event.preventDefault();
      turn(next);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [over, turn]);

  useEffect(() => {
    if (!running || over) return;
    const timer = window.setInterval(() => {
      setSnake((current) => {
        const result = stepSnake(current, directionRef.current, food);
        if (result.crashed) {
          setRunning(false);
          setOver(true);
          return current;
        }
        if (result.ate) setFood(createSnakeFood(result.snake));
        return result.snake;
      });
    }, 120);
    return () => window.clearInterval(timer);
  }, [food, over, running]);

  return (
    <GameFrame>
      <div className="flex w-[min(100%,calc(100cqh-132px))] max-w-[420px] flex-col items-center gap-4">
        <div className="flex w-full items-center justify-between">
          <div><p className="text-xs text-muted-foreground">Score</p><p className="text-xl font-semibold tabular-nums">{snake.length - 3}</p></div>
          <div className="flex gap-2">
            <GameButton onClick={() => setRunning((value) => !value)} disabled={over}>{running ? <Pause size={14} /> : <Play size={14} />}{running ? "Pause" : "Play"}</GameButton>
            <GameButton onClick={reset}><RotateCcw size={14} />New Game</GameButton>
          </div>
        </div>
        <div className="relative grid aspect-square w-full max-w-[420px] grid-cols-[repeat(18,minmax(0,1fr))] overflow-hidden rounded-2xl bg-[#11271c] p-1.5 shadow-[0_18px_55px_rgba(15,23,42,.25)] ring-1 ring-black/20">
          {Array.from({ length: 324 }, (_, index) => {
            const x = index % 18;
            const y = Math.floor(index / 18);
            const snakeIndex = snake.findIndex((part) => part.x === x && part.y === y);
            const isFood = food.x === x && food.y === y;
            return <span key={index} className="aspect-square p-[10%]">{(snakeIndex >= 0 || isFood) && <span className={cn("block h-full w-full", isFood ? "rounded-full bg-[#ffd84d] shadow-[0_0_10px_rgba(255,216,77,.7)]" : snakeIndex === 0 ? "rounded-[35%] bg-[#6cf19a]" : "rounded-[30%] bg-[#36cf70]")} />}</span>;
          })}
          {(!running || over) && (
            <button type="button" onClick={over ? reset : () => setRunning(true)} className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 text-white backdrop-blur-[2px]">
              <span className="text-xl font-semibold">{over ? "Game Over" : "Snake"}</span>
              <span className="mt-1 text-sm text-white/75">{over ? "Click to play again" : "Use arrow keys or WASD"}</span>
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:hidden">
          <span /><GameButton onClick={() => turn("up")}>↑</GameButton><span />
          <GameButton onClick={() => turn("left")}>←</GameButton><GameButton onClick={() => turn("down")}>↓</GameButton><GameButton onClick={() => turn("right")}>→</GameButton>
        </div>
        <p className="text-center text-xs text-muted-foreground">Arrow keys or WASD to steer · Space to pause</p>
      </div>
    </GameFrame>
  );
}

const TILE_COLORS: Record<number, string> = {
  0: "bg-black/5 dark:bg-white/10 text-transparent", 2: "bg-[#eee4da] text-[#776e65]", 4: "bg-[#ede0c8] text-[#776e65]",
  8: "bg-[#f2b179] text-white", 16: "bg-[#f59563] text-white", 32: "bg-[#f67c5f] text-white", 64: "bg-[#f65e3b] text-white",
  128: "bg-[#edcf72] text-white", 256: "bg-[#edcc61] text-white", 512: "bg-[#edc850] text-white", 1024: "bg-[#edc53f] text-white", 2048: "bg-[#edc22e] text-white",
};

export function TwentyFortyEightGame() {
  const [game, setGame] = useState<Game2048State>(() => ({ board: create2048Board(), score: 0, over: false }));

  const reset = useCallback(() => setGame({ board: create2048Board(), score: 0, over: false }), []);
  const playMove = useCallback((direction: GridDirection) => {
    const randomValues = [Math.random(), Math.random()] as const;
    setGame((current) => apply2048Move(current, direction, randomValues));
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const direction = DIRECTION_KEYS[event.key];
      if (!direction) return;
      event.preventDefault();
      playMove(direction);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playMove]);

  return (
    <GameFrame>
      <div className="flex w-[min(100%,calc(100cqh-136px))] max-w-[440px] flex-col gap-4">
        <div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Score</p><p className="text-2xl font-semibold tabular-nums">{game.score}</p></div><GameButton onClick={reset}><RotateCcw size={14} />New Game</GameButton></div>
        <div className="relative grid aspect-square grid-cols-4 gap-2 rounded-2xl bg-[#bbada0] p-2 shadow-[0_18px_55px_rgba(15,23,42,.22)]">
          {game.board.map((value, index) => <span key={index} className={cn("flex items-center justify-center rounded-xl font-bold shadow-sm", TILE_COLORS[value] ?? "bg-[#3c3a32] text-white", value >= 1024 ? "text-xl" : value >= 128 ? "text-2xl" : "text-3xl")}>{value || "·"}</span>)}
          {game.over && <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#eee4da]/80 text-[#776e65] backdrop-blur-[2px]"><p className="text-2xl font-bold">Game Over</p><button onClick={reset} className="mt-3 rounded-lg bg-[#8f7a66] px-4 py-2 text-sm font-semibold text-white">Try Again</button></div>}
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:hidden"><span /><GameButton onClick={() => playMove("up")}>↑</GameButton><span /><GameButton onClick={() => playMove("left")}>←</GameButton><GameButton onClick={() => playMove("down")}>↓</GameButton><GameButton onClick={() => playMove("right")}>→</GameButton></div>
        <p className="text-center text-xs text-muted-foreground">Use arrow keys or WASD to combine matching tiles.</p>
      </div>
    </GameFrame>
  );
}

const NUMBER_COLORS = ["", "text-blue-600", "text-emerald-600", "text-red-600", "text-purple-600", "text-amber-700", "text-cyan-700", "text-foreground", "text-muted-foreground"];

function createEmptyMineBoard(size: number): MineCell[] {
  return Array.from({ length: size * size }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false }));
}

export function MinesweeperGame() {
  const initialLevelRef = useRef(loadCampaignLevel("minesweeper"));
  const [level, setLevel] = useState<CampaignLevel>(initialLevelRef.current);
  const levelConfig = getCampaignConfig(MINESWEEPER_LEVELS, level);
  const [board, setBoard] = useState<MineCell[]>(() => createEmptyMineBoard(getCampaignConfig(MINESWEEPER_LEVELS, initialLevelRef.current).size));
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [seconds, setSeconds] = useState(0);

  const startLevel = useCallback((nextLevel: CampaignLevel) => {
    const nextConfig = getCampaignConfig(MINESWEEPER_LEVELS, nextLevel);
    saveCampaignLevel("minesweeper", nextLevel);
    setLevel(nextLevel);
    setBoard(createEmptyMineBoard(nextConfig.size));
    setStarted(false);
    setStatus("playing");
    setSeconds(0);
  }, []);
  const reset = useCallback(() => startLevel(level), [level, startLevel]);

  useEffect(() => {
    if (!started || status !== "playing") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.min(999, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, status]);

  const reveal = (index: number) => {
    if (status !== "playing" || board[index].flagged || board[index].revealed) return;
    const source = started ? board : initializeMinefield(board, index, Math.random, levelConfig.size, levelConfig.mineCount);
    if (!started) setStarted(true);
    const next = revealMinefield(source, index, levelConfig.size);
    if (next[index].mine) setStatus("lost");
    else if (next.every((cell) => cell.mine || cell.revealed)) setStatus("won");
    setBoard(next);
  };

  const toggleFlag = (index: number) => {
    if (status !== "playing" || board[index].revealed) return;
    setBoard((current) => current.map((cell, cellIndex) => cellIndex === index ? { ...cell, flagged: !cell.flagged } : cell));
  };
  const flags = board.filter((cell) => cell.flagged).length;

  return (
    <GameFrame>
      <div className="flex w-[min(100%,calc(100cqh-148px))] max-w-[470px] flex-col gap-4">
        <CampaignHeader
          level={level}
          stats={[
            { label: "Board", value: `${levelConfig.size}×${levelConfig.size}` },
            { label: "Mines", value: Math.max(0, levelConfig.mineCount - flags) },
            { label: "Time", value: seconds },
          ]}
          onRestart={reset}
        />
        <div
          className="relative grid aspect-square gap-[clamp(1px,.45cqw,2px)] rounded-2xl bg-[#95a2af] p-[clamp(4px,1.7cqw,8px)] shadow-[0_18px_55px_rgba(15,23,42,.22)] [container-type:inline-size]"
          style={{ gridTemplateColumns: `repeat(${levelConfig.size}, minmax(0, 1fr))` }}
        >
          {board.map((cell, index) => (
            <button key={index} type="button" aria-label={`Cell ${index + 1}${cell.flagged ? ", flagged" : ""}`} onClick={() => reveal(index)} onContextMenu={(event) => { event.preventDefault(); toggleFlag(index); }} className={cn("flex aspect-square min-h-0 min-w-0 items-center justify-center rounded-[clamp(2px,1cqw,4px)] font-bold", cell.revealed ? "bg-[#e8edf1] dark:bg-[#343a40]" : "bg-[#c8d0d8] shadow-[inset_1px_1px_0_rgba(255,255,255,.75),inset_-1px_-1px_0_rgba(50,60,70,.35)] can-hover:hover:bg-[#d5dce2]", NUMBER_COLORS[cell.adjacent])} style={{ fontSize: `clamp(0.55rem, ${21 / levelConfig.size}cqw, 1rem)` }}>
              {cell.flagged ? <Flag size={14} className="fill-red-500 text-red-600" /> : cell.revealed && cell.mine ? "💣" : cell.revealed && cell.adjacent ? cell.adjacent : ""}
            </button>
          ))}
          {status !== "playing" && (
            <CampaignResultOverlay
              level={level}
              result={status === "won" ? "complete" : "failed"}
              failureTitle="Boom!"
              detail={status === "won" ? `Cleared in ${seconds} seconds` : `There are ${levelConfig.mineCount} mines on this board`}
              onAction={() => startLevel(status === "won" ? nextCampaignLevel(level) ?? 1 : level)}
              className="rounded-2xl bg-black/45"
            />
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">Click to reveal · Right-click to place a flag · Your first click is always safe</p>
      </div>
    </GameFrame>
  );
}

export function MemoryGame() {
  const initialLevelRef = useRef(loadCampaignLevel("memory"));
  const [level, setLevel] = useState<CampaignLevel>(initialLevelRef.current);
  const levelConfig = getCampaignConfig(MEMORY_LEVELS, level);
  const [initialGame] = useState(() => createMemoryGameState(Math.random, getCampaignConfig(MEMORY_LEVELS, initialLevelRef.current).gridSize));
  const [deck, setDeck] = useState(initialGame.deck);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>(initialGame.matched);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const flipTimerRef = useRef<number | null>(null);

  const startLevel = useCallback((nextLevel: CampaignLevel) => {
    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
    flipTimerRef.current = null;
    const nextConfig = getCampaignConfig(MEMORY_LEVELS, nextLevel);
    const nextGame = createMemoryGameState(Math.random, nextConfig.gridSize);
    saveCampaignLevel("memory", nextLevel);
    setLevel(nextLevel);
    setDeck(nextGame.deck);
    setFlipped([]);
    setMatched(nextGame.matched);
    setMoves(0);
    setLocked(false);
  }, []);
  const reset = useCallback(() => startLevel(level), [level, startLevel]);

  useEffect(() => () => {
    if (flipTimerRef.current !== null) window.clearTimeout(flipTimerRef.current);
  }, []);

  const flip = (index: number) => {
    if (locked || flipped.includes(index) || matched.includes(index)) return;
    if (flipped.length === 0) { setFlipped([index]); return; }
    const first = flipped[0];
    setFlipped([first, index]);
    setMoves((value) => value + 1);
    setLocked(true);
    flipTimerRef.current = window.setTimeout(() => {
      if (deck[first] === deck[index]) setMatched((current) => [...current, first, index]);
      setFlipped([]);
      setLocked(false);
      flipTimerRef.current = null;
    }, deck[first] === deck[index] ? 450 : 750);
  };
  const won = matched.length === deck.length;

  return (
    <GameFrame>
      <div className="flex w-[min(100%,calc(100cqh-132px))] max-w-[500px] flex-col gap-4">
        <CampaignHeader
          level={level}
          stats={[
            { label: "Board", value: `${levelConfig.gridSize}×${levelConfig.gridSize}` },
            { label: "Moves", value: moves },
          ]}
          onRestart={reset}
        />
        <div
          className="relative grid aspect-square gap-[clamp(3px,1.5cqw,8px)] rounded-2xl bg-[linear-gradient(145deg,#35266e,#6f50c9)] p-[clamp(6px,2.5cqw,12px)] shadow-[0_18px_55px_rgba(15,23,42,.24)] [container-type:inline-size]"
          style={{ gridTemplateColumns: `repeat(${levelConfig.gridSize}, minmax(0, 1fr))` }}
        >
          {deck.map((value, index) => {
            const visible = flipped.includes(index) || matched.includes(index);
            const free = value === null;
            return <button key={index} type="button" onClick={() => flip(index)} aria-label={free ? "Free space" : visible ? value : `Hidden card ${index + 1}`} className={cn("flex min-h-0 min-w-0 items-center justify-center rounded-[clamp(5px,2.5cqw,12px)] border border-white/20 shadow-md transition-all duration-200", visible ? "rotate-0 bg-white dark:bg-[#25242a]" : "bg-white/16 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,.22),transparent_45%)] can-hover:hover:bg-white/24", matched.includes(index) && "opacity-70 ring-2 ring-[#7fffc6]", free && "cursor-default bg-white/25 text-white ring-white/25")}><span className={visible ? "scale-100" : "scale-0"} style={{ fontSize: `clamp(0.75rem, ${28 / levelConfig.gridSize}cqw, 1.875rem)` }}>{free ? "★" : value}</span></button>;
          })}
          {won && (
            <CampaignResultOverlay
              level={level}
              result="complete"
              detail={`Finished in ${moves} moves`}
              onAction={() => startLevel(nextCampaignLevel(level) ?? 1)}
              className="rounded-2xl bg-[#2f2264]/75"
              buttonClassName="text-[#35266e]"
            />
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">Find all {Math.floor(deck.length / 2)} matching pairs{deck.includes(null) ? " · The star is a free space" : ""}.</p>
      </div>
    </GameFrame>
  );
}

interface BreakoutState {
  ballX: number; ballY: number; ballDX: number; ballDY: number;
  paddleX: number; bricks: boolean[]; lives: number; score: number;
  mode: "ready" | "playing" | "won" | "lost";
}

function createBreakoutState(config: { rows: number; ballSpeed: number; paddleWidth: number }): BreakoutState {
  return {
    ballX: 320,
    ballY: 348,
    ballDX: config.ballSpeed,
    ballDY: -config.ballSpeed,
    paddleX: (640 - config.paddleWidth) / 2,
    bricks: Array(config.rows * 8).fill(true),
    lives: 3,
    score: 0,
    mode: "ready",
  };
}

export function BreakoutGame() {
  const initialLevelRef = useRef(loadCampaignLevel("breakout"));
  const [level, setLevel] = useState<CampaignLevel>(initialLevelRef.current);
  const levelConfig = getCampaignConfig(BREAKOUT_LEVELS, level);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BreakoutState>(createBreakoutState(getCampaignConfig(BREAKOUT_LEVELS, initialLevelRef.current)));
  const keysRef = useRef({ left: false, right: false });
  const [, render] = useState(0);

  const startLevel = useCallback((nextLevel: CampaignLevel, launch = false) => {
    const nextConfig = getCampaignConfig(BREAKOUT_LEVELS, nextLevel);
    const nextState = createBreakoutState(nextConfig);
    if (launch) nextState.mode = "playing";
    saveCampaignLevel("breakout", nextLevel);
    setLevel(nextLevel);
    stateRef.current = nextState;
    render((value) => value + 1);
  }, []);
  const reset = useCallback(() => startLevel(level), [level, startLevel]);
  const launch = useCallback(() => {
    if (stateRef.current.mode !== "ready") return;
    stateRef.current.mode = "playing";
    render((value) => value + 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let frame = 0;
    const key = (event: KeyboardEvent, pressed: boolean) => {
      if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D", " "].includes(event.key)) event.preventDefault();
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keysRef.current.left = pressed;
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keysRef.current.right = pressed;
      if (pressed && event.key === " ") launch();
    };
    const down = (event: KeyboardEvent) => key(event, true);
    const up = (event: KeyboardEvent) => key(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const loop = () => {
      const game = stateRef.current;
      if (game.mode === "playing") {
        if (keysRef.current.left) game.paddleX = Math.max(0, game.paddleX - 7);
        if (keysRef.current.right) game.paddleX = Math.min(640 - levelConfig.paddleWidth, game.paddleX + 7);
        game.ballX += game.ballDX;
        game.ballY += game.ballDY;
        if (game.ballX <= 9 || game.ballX >= 631) game.ballDX *= -1;
        if (game.ballY <= 9) game.ballDY = Math.abs(game.ballDY);
        if (game.ballDY > 0 && game.ballY >= 370 && game.ballY <= 387 && game.ballX >= game.paddleX - 5 && game.ballX <= game.paddleX + levelConfig.paddleWidth + 5) {
          game.ballDY = -Math.abs(game.ballDY);
          game.ballDX = ((game.ballX - (game.paddleX + levelConfig.paddleWidth / 2)) / (levelConfig.paddleWidth / 2)) * levelConfig.ballSpeed * 1.4;
        }
        for (let index = 0; index < game.bricks.length; index += 1) {
          if (!game.bricks[index]) continue;
          const column = index % 8;
          const row = Math.floor(index / 8);
          const x = 16 + column * 77;
          const y = 38 + row * 27;
          if (game.ballX + 8 >= x && game.ballX - 8 <= x + 69 && game.ballY + 8 >= y && game.ballY - 8 <= y + 18) {
            game.bricks[index] = false;
            game.ballDY *= -1;
            game.score += 10;
            render((value) => value + 1);
            break;
          }
        }
        if (game.bricks.every((brick) => !brick)) {
          game.mode = "won";
          render((value) => value + 1);
        }
        if (game.ballY > 430) {
          game.lives -= 1;
          if (game.lives <= 0) game.mode = "lost";
          else {
            game.ballX = 320;
            game.ballY = 348;
            game.ballDX = game.ballDX < 0 ? -levelConfig.ballSpeed : levelConfig.ballSpeed;
            game.ballDY = -levelConfig.ballSpeed;
            game.paddleX = (640 - levelConfig.paddleWidth) / 2;
            game.mode = "ready";
          }
          render((value) => value + 1);
        }
      }

      const gradient = context.createLinearGradient(0, 0, 640, 420);
      gradient.addColorStop(0, "#17112e"); gradient.addColorStop(1, "#32194f");
      context.fillStyle = gradient; context.fillRect(0, 0, 640, 420);
      const colors = ["#ff6685", "#ff9f5b", "#ffe066", "#5ee39c", "#5cc8ff", "#9b8cff", "#f27ee6"];
      game.bricks.forEach((brick, index) => {
        if (!brick) return;
        const column = index % 8; const row = Math.floor(index / 8);
        context.fillStyle = colors[row % colors.length];
        context.beginPath(); context.roundRect(16 + column * 77, 38 + row * 27, 69, 18, 5); context.fill();
      });
      context.fillStyle = "rgba(255,255,255,.92)"; context.beginPath(); context.roundRect(game.paddleX, 378, levelConfig.paddleWidth, 12, 6); context.fill();
      context.shadowColor = "rgba(255,255,255,.65)"; context.shadowBlur = 12; context.beginPath(); context.arc(game.ballX, game.ballY, 8, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0;
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [launch, levelConfig]);

  const game = stateRef.current;
  return (
    <GameFrame>
      <div className="flex w-[min(100%,640px,calc(152.38cqh-189px))] flex-col gap-3">
        <CampaignHeader
          level={level}
          stats={[
            { label: "Score", value: game.score },
            { label: "Lives", value: game.lives },
          ]}
          onRestart={reset}
        />
        <div className="relative overflow-hidden rounded-2xl shadow-[0_18px_55px_rgba(15,23,42,.28)] ring-1 ring-black/20">
          <canvas ref={canvasRef} width={640} height={420} className="block aspect-[32/21] w-full" onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); stateRef.current.paddleX = Math.max(0, Math.min(640 - levelConfig.paddleWidth, ((event.clientX - bounds.left) / bounds.width) * 640 - levelConfig.paddleWidth / 2)); }} />
          {game.mode === "ready" && <button type="button" onClick={launch} className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 text-white backdrop-blur-[1px]"><span className="text-2xl font-semibold">Breakout</span><span className="mt-1 text-sm text-white/75">Click or press Space to launch</span></button>}
          {game.mode === "won" && (
            <CampaignResultOverlay
              level={level}
              result="complete"
              detail={`Cleared ${levelConfig.rows * 8} bricks for ${game.score} points`}
              onAction={() => startLevel(nextCampaignLevel(level) ?? 1)}
              className="bg-black/45"
            />
          )}
          {game.mode === "lost" && (
            <CampaignResultOverlay
              level={level}
              result="failed"
              detail={`Final score: ${game.score}`}
              onAction={() => startLevel(level, true)}
              className="bg-black/45"
            />
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">Arrow keys or A/D to move · You can also move the pointer over the board</p>
      </div>
    </GameFrame>
  );
}
