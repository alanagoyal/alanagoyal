"use client";

import { Flag, Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  apply2048Move,
  create2048Board,
  createMemoryDeck,
  createSnakeFood,
  type Game2048State,
  type GridDirection,
  initializeMinefield,
  type MineCell,
  revealMinefield,
  type SnakePoint,
  stepSnake,
} from "@/lib/games/solo";
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

export function MinesweeperGame() {
  const emptyBoard = () => Array.from({ length: 81 }, (): MineCell => ({ mine: false, adjacent: 0, revealed: false, flagged: false }));
  const [board, setBoard] = useState<MineCell[]>(emptyBoard);
  const [started, setStarted] = useState(false);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");
  const [seconds, setSeconds] = useState(0);

  const reset = useCallback(() => { setBoard(emptyBoard()); setStarted(false); setStatus("playing"); setSeconds(0); }, []);
  useEffect(() => {
    if (!started || status !== "playing") return;
    const timer = window.setInterval(() => setSeconds((value) => Math.min(999, value + 1)), 1000);
    return () => window.clearInterval(timer);
  }, [started, status]);

  const reveal = (index: number) => {
    if (status !== "playing" || board[index].flagged || board[index].revealed) return;
    const source = started ? board : initializeMinefield(board, index);
    if (!started) setStarted(true);
    const next = revealMinefield(source, index);
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
        <div className="flex items-end justify-between"><div className="flex gap-5"><div><p className="text-xs text-muted-foreground">Mines</p><p className="text-xl font-semibold tabular-nums">{Math.max(0, 10 - flags)}</p></div><div><p className="text-xs text-muted-foreground">Time</p><p className="text-xl font-semibold tabular-nums">{seconds}</p></div></div><GameButton onClick={reset}><RotateCcw size={14} />New Game</GameButton></div>
        <div className="relative grid aspect-square grid-cols-9 gap-[2px] rounded-2xl bg-[#95a2af] p-2 shadow-[0_18px_55px_rgba(15,23,42,.22)]">
          {board.map((cell, index) => (
            <button key={index} type="button" aria-label={`Cell ${index + 1}${cell.flagged ? ", flagged" : ""}`} onClick={() => reveal(index)} onContextMenu={(event) => { event.preventDefault(); toggleFlag(index); }} className={cn("flex aspect-square items-center justify-center rounded-[4px] text-sm font-bold sm:text-base", cell.revealed ? "bg-[#e8edf1] dark:bg-[#343a40]" : "bg-[#c8d0d8] shadow-[inset_1px_1px_0_rgba(255,255,255,.75),inset_-1px_-1px_0_rgba(50,60,70,.35)] can-hover:hover:bg-[#d5dce2]", NUMBER_COLORS[cell.adjacent])}>
              {cell.flagged ? <Flag size={14} className="fill-red-500 text-red-600" /> : cell.revealed && cell.mine ? "💣" : cell.revealed && cell.adjacent ? cell.adjacent : ""}
            </button>
          ))}
          {status !== "playing" && <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/35 text-white backdrop-blur-[2px]"><p className="text-2xl font-semibold">{status === "won" ? "You cleared it!" : "Boom!"}</p><button onClick={reset} className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900">Play Again</button></div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Click to reveal · Right-click to place a flag · Your first click is always safe</p>
      </div>
    </GameFrame>
  );
}

export function MemoryGame() {
  const [deck, setDeck] = useState(() => createMemoryDeck());
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const reset = useCallback(() => { setDeck(createMemoryDeck()); setFlipped([]); setMatched([]); setMoves(0); setLocked(false); }, []);
  const flip = (index: number) => {
    if (locked || flipped.includes(index) || matched.includes(index)) return;
    if (flipped.length === 0) { setFlipped([index]); return; }
    const first = flipped[0];
    setFlipped([first, index]);
    setMoves((value) => value + 1);
    setLocked(true);
    window.setTimeout(() => {
      if (deck[first] === deck[index]) setMatched((current) => [...current, first, index]);
      setFlipped([]);
      setLocked(false);
    }, deck[first] === deck[index] ? 450 : 750);
  };
  const won = matched.length === deck.length;

  return (
    <GameFrame>
      <div className="flex w-[min(100%,calc(100cqh-132px))] max-w-[470px] flex-col gap-4">
        <div className="flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Moves</p><p className="text-xl font-semibold tabular-nums">{moves}</p></div><GameButton onClick={reset}><RotateCcw size={14} />New Game</GameButton></div>
        <div className="relative grid aspect-square grid-cols-4 gap-2 rounded-2xl bg-[linear-gradient(145deg,#35266e,#6f50c9)] p-3 shadow-[0_18px_55px_rgba(15,23,42,.24)]">
          {deck.map((value, index) => {
            const visible = flipped.includes(index) || matched.includes(index);
            return <button key={index} type="button" onClick={() => flip(index)} aria-label={visible ? value : `Hidden card ${index + 1}`} className={cn("flex items-center justify-center rounded-xl border border-white/20 text-3xl shadow-md transition-all duration-200", visible ? "rotate-0 bg-white dark:bg-[#25242a]" : "bg-white/16 bg-[radial-gradient(circle_at_35%_30%,rgba(255,255,255,.22),transparent_45%)] can-hover:hover:bg-white/24", matched.includes(index) && "opacity-70 ring-2 ring-[#7fffc6]")}><span className={visible ? "scale-100" : "scale-0"}>{value}</span></button>;
          })}
          {won && <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#2f2264]/70 text-white backdrop-blur-[3px]"><p className="text-2xl font-semibold">All matched!</p><p className="mt-1 text-sm text-white/75">Finished in {moves} moves</p><button onClick={reset} className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#35266e]">Play Again</button></div>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Find all eight matching pairs.</p>
      </div>
    </GameFrame>
  );
}

interface BreakoutState {
  ballX: number; ballY: number; ballDX: number; ballDY: number;
  paddleX: number; bricks: boolean[]; lives: number; score: number;
  mode: "ready" | "playing" | "won" | "lost";
}

const createBreakoutState = (): BreakoutState => ({ ballX: 320, ballY: 348, ballDX: 3.4, ballDY: -3.4, paddleX: 270, bricks: Array(40).fill(true), lives: 3, score: 0, mode: "ready" });

export function BreakoutGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BreakoutState>(createBreakoutState());
  const keysRef = useRef({ left: false, right: false });
  const [, render] = useState(0);

  const reset = useCallback(() => { stateRef.current = createBreakoutState(); render((value) => value + 1); }, []);
  const start = useCallback(() => {
    if (stateRef.current.mode === "won" || stateRef.current.mode === "lost") reset();
    stateRef.current.mode = "playing";
    render((value) => value + 1);
  }, [reset]);

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
      if (pressed && event.key === " ") start();
    };
    const down = (event: KeyboardEvent) => key(event, true);
    const up = (event: KeyboardEvent) => key(event, false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);

    const loop = () => {
      const game = stateRef.current;
      if (game.mode === "playing") {
        if (keysRef.current.left) game.paddleX = Math.max(0, game.paddleX - 7);
        if (keysRef.current.right) game.paddleX = Math.min(540, game.paddleX + 7);
        game.ballX += game.ballDX;
        game.ballY += game.ballDY;
        if (game.ballX <= 9 || game.ballX >= 631) game.ballDX *= -1;
        if (game.ballY <= 9) game.ballDY = Math.abs(game.ballDY);
        if (game.ballDY > 0 && game.ballY >= 370 && game.ballY <= 387 && game.ballX >= game.paddleX - 5 && game.ballX <= game.paddleX + 105) {
          game.ballDY = -Math.abs(game.ballDY);
          game.ballDX = ((game.ballX - (game.paddleX + 50)) / 50) * 4.8;
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
        if (game.bricks.every((brick) => !brick)) game.mode = "won";
        if (game.ballY > 430) {
          game.lives -= 1;
          if (game.lives <= 0) game.mode = "lost";
          else { game.ballX = 320; game.ballY = 348; game.ballDX = game.ballDX < 0 ? -3.4 : 3.4; game.ballDY = -3.4; game.paddleX = 270; game.mode = "ready"; }
          render((value) => value + 1);
        }
      }

      const gradient = context.createLinearGradient(0, 0, 640, 420);
      gradient.addColorStop(0, "#17112e"); gradient.addColorStop(1, "#32194f");
      context.fillStyle = gradient; context.fillRect(0, 0, 640, 420);
      const colors = ["#ff6685", "#ff9f5b", "#ffe066", "#5ee39c", "#5cc8ff"];
      game.bricks.forEach((brick, index) => {
        if (!brick) return;
        const column = index % 8; const row = Math.floor(index / 8);
        context.fillStyle = colors[row];
        context.beginPath(); context.roundRect(16 + column * 77, 38 + row * 27, 69, 18, 5); context.fill();
      });
      context.fillStyle = "rgba(255,255,255,.92)"; context.beginPath(); context.roundRect(game.paddleX, 378, 100, 12, 6); context.fill();
      context.shadowColor = "rgba(255,255,255,.65)"; context.shadowBlur = 12; context.beginPath(); context.arc(game.ballX, game.ballY, 8, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0;
      frame = window.requestAnimationFrame(loop);
    };
    loop();
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [start]);

  const game = stateRef.current;
  return (
    <GameFrame>
      <div className="flex w-[min(100%,640px,calc(152.38cqh-189px))] flex-col gap-3">
        <div className="flex items-end justify-between"><div className="flex gap-5"><div><p className="text-xs text-muted-foreground">Score</p><p className="text-xl font-semibold tabular-nums">{game.score}</p></div><div><p className="text-xs text-muted-foreground">Lives</p><p className="text-xl font-semibold tabular-nums">{game.lives}</p></div></div><GameButton onClick={reset}><RotateCcw size={14} />New Game</GameButton></div>
        <div className="relative overflow-hidden rounded-2xl shadow-[0_18px_55px_rgba(15,23,42,.28)] ring-1 ring-black/20">
          <canvas ref={canvasRef} width={640} height={420} className="block aspect-[32/21] w-full" onPointerMove={(event) => { const bounds = event.currentTarget.getBoundingClientRect(); stateRef.current.paddleX = Math.max(0, Math.min(540, ((event.clientX - bounds.left) / bounds.width) * 640 - 50)); }} />
          {game.mode !== "playing" && <button type="button" onClick={start} className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 text-white backdrop-blur-[1px]"><span className="text-2xl font-semibold">{game.mode === "won" ? "You cleared the board!" : game.mode === "lost" ? "Game Over" : "Breakout"}</span><span className="mt-1 text-sm text-white/75">Click or press Space to {game.mode === "ready" ? "launch" : "play again"}</span></button>}
        </div>
        <p className="text-center text-xs text-muted-foreground">Arrow keys or A/D to move · You can also move the pointer over the board</p>
      </div>
    </GameFrame>
  );
}
