export type GridDirection = "up" | "down" | "left" | "right";

export interface Move2048Result {
  board: number[];
  score: number;
  moved: boolean;
}

export interface Game2048State {
  board: number[];
  score: number;
  over: boolean;
}

function collapse2048Line(line: number[]) {
  const values = line.filter(Boolean);
  const result: number[] = [];
  let score = 0;
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === values[index + 1]) {
      const merged = values[index] * 2;
      result.push(merged);
      score += merged;
      index += 1;
    } else {
      result.push(values[index]);
    }
  }
  while (result.length < 4) result.push(0);
  return { line: result, score };
}

export function move2048(board: number[], direction: GridDirection): Move2048Result {
  const next = Array(16).fill(0) as number[];
  let score = 0;
  for (let outer = 0; outer < 4; outer += 1) {
    const indexes = Array.from({ length: 4 }, (_, inner) => {
      if (direction === "left") return outer * 4 + inner;
      if (direction === "right") return outer * 4 + (3 - inner);
      if (direction === "up") return inner * 4 + outer;
      return (3 - inner) * 4 + outer;
    });
    const collapsed = collapse2048Line(indexes.map((index) => board[index]));
    score += collapsed.score;
    indexes.forEach((index, position) => { next[index] = collapsed.line[position]; });
  }
  return { board: next, score, moved: next.some((value, index) => value !== board[index]) };
}

export function add2048Tile(board: number[], random = Math.random) {
  const empty = board.flatMap((value, index) => value === 0 ? [index] : []);
  if (!empty.length) return [...board];
  const next = [...board];
  const index = empty[Math.min(empty.length - 1, Math.floor(random() * empty.length))];
  next[index] = random() < 0.9 ? 2 : 4;
  return next;
}

export function create2048Board(random = Math.random) {
  return add2048Tile(add2048Tile(Array(16).fill(0), random), random);
}

export function canMove2048(board: number[]) {
  if (board.includes(0)) return true;
  return (["up", "down", "left", "right"] as GridDirection[]).some((direction) => move2048(board, direction).moved);
}

export function apply2048Move(
  state: Game2048State,
  direction: GridDirection,
  randomValues: readonly [number, number],
): Game2048State {
  if (state.over) return state;
  const result = move2048(state.board, direction);
  if (!result.moved) return state;
  let randomIndex = 0;
  const board = add2048Tile(result.board, () => randomValues[randomIndex++]);
  return { board, score: state.score + result.score, over: !canMove2048(board) };
}

export interface MineCell {
  mine: boolean;
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
}

export function createMinefield(safeIndex: number, random = Math.random, size = 9, mineCount = 10): MineCell[] {
  const candidates = Array.from({ length: size * size }, (_, index) => index).filter((index) => {
    const rowDistance = Math.abs(Math.floor(index / size) - Math.floor(safeIndex / size));
    const columnDistance = Math.abs(index % size - safeIndex % size);
    return rowDistance > 1 || columnDistance > 1;
  });
  for (let index = candidates.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [candidates[index], candidates[swap]] = [candidates[swap], candidates[index]];
  }
  const mines = new Set(candidates.slice(0, mineCount));
  return Array.from({ length: size * size }, (_, index) => {
    const row = Math.floor(index / size);
    const column = index % size;
    let adjacent = 0;
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        const neighborRow = row + rowOffset;
        const neighborColumn = column + columnOffset;
        if (neighborRow >= 0 && neighborRow < size && neighborColumn >= 0 && neighborColumn < size && mines.has(neighborRow * size + neighborColumn)) adjacent += 1;
      }
    }
    return { mine: mines.has(index), adjacent, revealed: false, flagged: false };
  });
}

export function initializeMinefield(board: MineCell[], safeIndex: number, random = Math.random, size = 9, mineCount = 10) {
  return createMinefield(safeIndex, random, size, mineCount).map((cell, index) => ({
    ...cell,
    flagged: board[index]?.flagged ?? false,
  }));
}

export function revealMinefield(board: MineCell[], startIndex: number, size = 9) {
  if (board[startIndex]?.flagged || board[startIndex]?.revealed) return board;
  const next = board.map((cell) => ({ ...cell }));
  if (next[startIndex].mine) {
    return next.map((cell) => cell.mine ? { ...cell, revealed: true } : cell);
  }
  const pending = [startIndex];
  const visited = new Set<number>();
  while (pending.length) {
    const index = pending.shift()!;
    if (visited.has(index) || next[index].flagged || next[index].mine) continue;
    visited.add(index);
    next[index].revealed = true;
    if (next[index].adjacent !== 0) continue;
    const row = Math.floor(index / size);
    const column = index % size;
    for (let rowOffset = -1; rowOffset <= 1; rowOffset += 1) {
      for (let columnOffset = -1; columnOffset <= 1; columnOffset += 1) {
        const neighborRow = row + rowOffset;
        const neighborColumn = column + columnOffset;
        if (neighborRow >= 0 && neighborRow < size && neighborColumn >= 0 && neighborColumn < size) pending.push(neighborRow * size + neighborColumn);
      }
    }
  }
  return next;
}

export interface SnakePoint { x: number; y: number }

export function stepSnake(snake: SnakePoint[], direction: GridDirection, food: SnakePoint, size = 18) {
  const head = snake[0];
  const delta = direction === "up" ? { x: 0, y: -1 }
    : direction === "down" ? { x: 0, y: 1 }
      : direction === "left" ? { x: -1, y: 0 }
        : { x: 1, y: 0 };
  const nextHead = { x: head.x + delta.x, y: head.y + delta.y };
  const ate = nextHead.x === food.x && nextHead.y === food.y;
  const body = ate ? snake : snake.slice(0, -1);
  const crashed = nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= size || nextHead.y >= size
    || body.some((point) => point.x === nextHead.x && point.y === nextHead.y);
  return { snake: crashed ? snake : [nextHead, ...body], ate, crashed };
}

export function createSnakeFood(snake: SnakePoint[], size = 18, random = Math.random): SnakePoint {
  const free = Array.from({ length: size * size }, (_, index) => ({ x: index % size, y: Math.floor(index / size) }))
    .filter((point) => !snake.some((part) => part.x === point.x && part.y === point.y));
  return free[Math.min(free.length - 1, Math.floor(random() * free.length))] ?? { x: 0, y: 0 };
}

const MEMORY_SYMBOLS = [
  "😀", "🥸", "🤠", "👻", "🤖", "👽", "💩", "🎃",
  "🐶", "🐱", "🦊", "🐼", "🐸", "🦁", "🐙", "🦋",
  "🐳", "🦩", "🦖", "🐝", "🐢", "🦉", "🦀", "🐬",
  "🌵", "🍄", "🌻", "🌈", "🌙", "⭐️", "⚡️", "❄️",
  "🔥", "🌊", "🍀", "🌴", "🌸", "☀️", "🪐", "🌋",
  "🍒", "🍉", "🍋", "🥝", "🥑", "🌮", "🍕", "🍩",
  "🧁", "🍿", "🍪", "🍓", "🥨", "🧀", "🍭", "🥐",
  "⚽️", "🏀", "🎾", "🛹", "🎸", "🎨", "🎯", "🪁",
  "🎲", "🎳", "🧩", "🎮", "🎹", "🥁", "🏆", "⛸️",
  "🚀", "🚲", "🚂", "🚁", "⛵️", "🛸", "🏰", "🎡",
  "🗽", "⛺️", "🏝️", "🗿", "🚜", "🚒", "🛶", "🗼",
  "💎", "🎈", "🎁", "🔮", "🧸", "🪩", "👑", "🕶️",
  "📷", "💡", "⏰", "🧲", "🔑", "🪴", "🛎️", "🧭",
  "❤️", "💜", "💚", "💙", "💛", "🧡", "🤍", "🖤",
] as const;

export type MemoryCard = string | null;

export interface MemoryGameState {
  deck: MemoryCard[];
  matched: number[];
}

export const MAX_MEMORY_GRID_SIZE = Math.floor(Math.sqrt(MEMORY_SYMBOLS.length * 2 + 1));

export function createMemoryDeck(random = Math.random, gridSize = 4): MemoryCard[] {
  if (!Number.isInteger(gridSize) || gridSize < 2 || gridSize > MAX_MEMORY_GRID_SIZE) {
    throw new RangeError(`Memory grid size must be between 2 and ${MAX_MEMORY_GRID_SIZE}.`);
  }
  const cardCount = gridSize * gridSize;
  const pairCount = Math.floor(cardCount / 2);
  const available = [...MEMORY_SYMBOLS];
  const symbols = Array.from({ length: pairCount }, () => {
    const index = Math.min(available.length - 1, Math.floor(random() * available.length));
    return available.splice(index, 1)[0];
  });
  const deck: MemoryCard[] = symbols.flatMap((value) => [value, value]);
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [deck[index], deck[swap]] = [deck[swap], deck[index]];
  }
  if (cardCount % 2 === 1) deck.splice(Math.floor(cardCount / 2), 0, null);
  return deck;
}

export function createMemoryGameState(random = Math.random, gridSize = 4): MemoryGameState {
  const deck = createMemoryDeck(random, gridSize);
  const freeIndex = deck.findIndex((card) => card === null);
  return { deck, matched: freeIndex === -1 ? [] : [freeIndex] };
}
