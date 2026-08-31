import assert from "node:assert/strict";
import test from "node:test";
import {
  apply2048Move,
  canMove2048,
  create2048Board,
  createMemoryDeck,
  createMemoryGameState,
  createMinefield,
  createSnakeFood,
  initializeMinefield,
  move2048,
  revealMinefield,
  stepSnake,
} from "../lib/games/solo";
import {
  BREAKOUT_LEVELS,
  CAMPAIGN_LEVEL_COUNT,
  clearCampaignLevels,
  loadCampaignLevel,
  MEMORY_LEVELS,
  MINESWEEPER_LEVELS,
  nextCampaignLevel,
  saveCampaignLevel,
} from "../lib/games/levels";

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
  removeItem(key: string) { this.values.delete(key); }
}

test("2048 merges each tile only once per move", () => {
  const result = move2048([
    2, 2, 2, 2,
    4, 0, 4, 4,
    0, 0, 0, 0,
    0, 0, 0, 0,
  ], "left");
  assert.deepEqual(result.board.slice(0, 8), [4, 4, 0, 0, 8, 4, 0, 0]);
  assert.equal(result.score, 16);
  assert.equal(result.moved, true);
});

test("2048 creates two starting tiles and detects a locked board", () => {
  assert.equal(create2048Board(() => 0).filter(Boolean).length, 2);
  assert.equal(canMove2048([
    2, 4, 2, 4,
    4, 2, 4, 2,
    2, 4, 2, 4,
    4, 2, 4, 2,
  ]), false);
});

test("2048 applies scoring atomically and deterministically", () => {
  const state = {
    board: [
      2, 2, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
      0, 0, 0, 0,
    ],
    score: 12,
    over: false,
  };
  const result = apply2048Move(state, "left", [0, 0]);
  assert.equal(result.score, 16);
  assert.deepEqual(result, apply2048Move(state, "left", [0, 0]));
});

test("minesweeper keeps the first cell and its neighbors safe", () => {
  const board = createMinefield(40, () => 0.4);
  assert.equal(board.filter((cell) => cell.mine).length, 10);
  const safeIndexes = [30, 31, 32, 39, 40, 41, 48, 49, 50];
  assert.equal(safeIndexes.some((index) => board[index].mine), false);
  assert.equal(revealMinefield(board, 40)[40].revealed, true);
});

test("minesweeper preserves flags when the minefield starts", () => {
  const emptyBoard = Array.from({ length: 81 }, () => ({ mine: false, adjacent: 0, revealed: false, flagged: false }));
  emptyBoard[0].flagged = true;
  const board = initializeMinefield(emptyBoard, 40, () => 0.4);
  assert.equal(board[0].flagged, true);
  assert.strictEqual(revealMinefield(board, 0), board);
});

test("snake grows on food and collides with walls", () => {
  const snake = [{ x: 2, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 1 }];
  const grown = stepSnake(snake, "right", { x: 3, y: 1 }, 4);
  assert.equal(grown.ate, true);
  assert.equal(grown.snake.length, 4);
  assert.equal(stepSnake(grown.snake, "right", { x: 0, y: 0 }, 4).crashed, true);
  const food = createSnakeFood([{ x: 0, y: 0 }], 2, () => 0);
  assert.notDeepEqual(food, { x: 0, y: 0 });
});

test("memory deck contains eight exact pairs", () => {
  const deck = createMemoryDeck(() => 0.5);
  assert.equal(deck.length, 16);
  assert.equal(new Set(deck).size, 8);
  for (const symbol of new Set(deck)) assert.equal(deck.filter((value) => value === symbol).length, 2);
});

test("memory deck draws each game from a varied emoji pool", () => {
  const firstGame = new Set(createMemoryDeck(() => 0));
  const nextGame = new Set(createMemoryDeck(() => 0.999));
  assert.notDeepEqual(firstGame, nextGame);
});

test("memory levels grow into square boards with exact pairs", () => {
  const levelTwoDeck = createMemoryDeck(() => 0.5, 5);
  assert.equal(levelTwoDeck.length, 25);
  assert.equal(levelTwoDeck[12], null);
  assert.equal(levelTwoDeck.filter((card) => card === null).length, 1);
  for (const symbol of new Set(levelTwoDeck.filter((card) => card !== null))) {
    assert.equal(levelTwoDeck.filter((value) => value === symbol).length, 2);
  }

  const levelThreeDeck = createMemoryDeck(() => 0.5, 6);
  assert.equal(levelThreeDeck.length, 36);
  assert.equal(levelThreeDeck.includes(null), false);
  assert.equal(new Set(levelThreeDeck).size, 18);
});

test("restored odd memory levels start with the free space matched", () => {
  const game = createMemoryGameState(() => 0.5, 5);
  assert.equal(game.deck[12], null);
  assert.deepEqual(game.matched, [12]);
});

test("campaign games share five explicitly tuned levels", () => {
  assert.equal(CAMPAIGN_LEVEL_COUNT, 5);
  assert.deepEqual(MEMORY_LEVELS.map((level) => level.gridSize), [4, 5, 6, 7, 8]);
  assert.deepEqual(MINESWEEPER_LEVELS, [
    { size: 6, mineCount: 5 },
    { size: 9, mineCount: 10 },
    { size: 12, mineCount: 20 },
    { size: 14, mineCount: 30 },
    { size: 16, mineCount: 40 },
  ]);
  assert.deepEqual(BREAKOUT_LEVELS.map((level) => level.rows), [3, 4, 5, 6, 7]);
  assert.equal(nextCampaignLevel(1), 2);
  assert.equal(nextCampaignLevel(5), null);

  const finalMemoryDeck = createMemoryDeck(() => 0.5, MEMORY_LEVELS[4].gridSize);
  assert.equal(finalMemoryDeck.length, 64);
  assert.equal(new Set(finalMemoryDeck).size, 32);
});

test("campaign levels persist per game until Games is closed", () => {
  const storage = new MemoryStorage();
  saveCampaignLevel("memory", 4, storage);
  saveCampaignLevel("breakout", 2, storage);
  assert.equal(loadCampaignLevel("memory", storage), 4);
  assert.equal(loadCampaignLevel("breakout", storage), 2);
  assert.equal(loadCampaignLevel("minesweeper", storage), 1);

  clearCampaignLevels(storage);
  assert.equal(loadCampaignLevel("memory", storage), 1);
  assert.equal(loadCampaignLevel("breakout", storage), 1);
});
