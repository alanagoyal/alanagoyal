import assert from "node:assert/strict";
import test from "node:test";
import {
  findTextMatches,
  replaceAllTextMatches,
  replaceTextMatch,
} from "../lib/textedit-find";

test("finds non-overlapping matches without case sensitivity", () => {
  assert.deepEqual(findTextMatches("Hello hello HELLO", "hello"), [
    { start: 0, end: 5 },
    { start: 6, end: 11 },
    { start: 12, end: 17 },
  ]);
  assert.deepEqual(findTextMatches("aaaa", "aa"), [
    { start: 0, end: 2 },
    { start: 2, end: 4 },
  ]);
});

test("returns no matches for an empty query", () => {
  assert.deepEqual(findTextMatches("hello", ""), []);
});

test("replaces one selected match", () => {
  const content = "hello world hello";
  const matches = findTextMatches(content, "hello");

  assert.equal(replaceTextMatch(content, matches[1], "hi"), "hello world hi");
});

test("replaces all matches without shifting later ranges", () => {
  const content = "Hello hello HELLO";
  const matches = findTextMatches(content, "hello");

  assert.equal(replaceAllTextMatches(content, matches, "hi"), "hi hi hi");
});
