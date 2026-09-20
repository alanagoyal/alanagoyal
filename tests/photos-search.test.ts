import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePhotoAnalysis,
  normalizePhotoSearchQuery,
  rankPhotoSearchCandidates,
  scorePhotoTextMatch,
  type PhotoSearchCandidate,
} from "../lib/photos/search";

test("normalizes bounded photo metadata from model output", () => {
  const result = normalizePhotoAnalysis(
    {
      search_text: "  Friends eating pizza outside at Tony's Pizza  ",
      collections: ["friends", "unknown"],
    },
    ["flowers", "food", "friends"],
  );

  assert.deepEqual(result, {
    searchText: "Friends eating pizza outside at Tony's Pizza",
    collections: ["friends"],
  });
});

test("scores a direct text match without an external ranker", () => {
  const candidate: PhotoSearchCandidate = {
    id: "pizza",
    filename: "IMG_1001.jpeg",
    searchText: "Friends making pizza together at a restaurant",
    collections: ["friends"],
    timestamp: "2026-09-20T12:00:00.000Z",
  };

  assert.equal(scorePhotoTextMatch("friends pizza", candidate), 1);
  assert.equal(scorePhotoTextMatch("flowers", candidate), 0);
});

test("accepts useful search queries and rejects one-character input", () => {
  assert.equal(normalizePhotoSearchQuery("  pizza night  "), "pizza night");
  assert.equal(normalizePhotoSearchQuery("x"), null);
  assert.equal(normalizePhotoSearchQuery(null), null);
});

test("Jev relevance ranks candidates and text matching remains the fallback", () => {
  const candidates: PhotoSearchCandidate[] = [
    {
      id: "text-first",
      filename: "one.jpg",
      searchText: "A restaurant table with pizza",
      collections: ["food"],
      timestamp: "2026-09-20T12:00:00.000Z",
    },
    {
      id: "jev-first",
      filename: "two.jpg",
      searchText: "Friends cooking dinner together",
      collections: ["friends"],
      timestamp: "2026-09-19T12:00:00.000Z",
    },
  ];

  const ranked = rankPhotoSearchCandidates(
    "pizza",
    candidates,
    new Map([
      ["text-first", 0.2],
      ["jev-first", 0.98],
    ]),
  );
  assert.deepEqual(ranked.map((candidate) => candidate.id), ["jev-first", "text-first"]);
  assert.equal(rankPhotoSearchCandidates("pizza", candidates, new Map())[0].id, "text-first");
});
