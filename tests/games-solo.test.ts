import assert from "node:assert/strict";
import test from "node:test";
import {
  apply2048Move,
  canMove2048,
  create2048Board,
  createMemoryDeck,
  createMinefield,
  createSnakeFood,
  initializeMinefield,
  move2048,
  revealMinefield,
  stepSnake,
} from "../lib/games/solo";

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
