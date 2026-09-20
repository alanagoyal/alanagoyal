import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPhotoSearchDocument,
  normalizePhotoAnalysis,
  normalizePhotoSearchQuery,
  rankPhotoSearchCandidates,
  type PhotoSearchCandidate,
} from "../lib/photos/search";

test("normalizes bounded photo metadata from model output", () => {
  const result = normalizePhotoAnalysis(
    {
      caption: "  Friends eating pizza outside  ",
      tags: ["Pizza", "friends", "pizza", 12],
      ocr_text: "  Tony's Pizza  ",
      collections: ["friends", "unknown"],
    },
    ["flowers", "food", "friends"],
  );

  assert.deepEqual(result, {
    caption: "Friends eating pizza outside",
    tags: ["pizza", "friends"],
    ocrText: "Tony's Pizza",
    collections: ["friends"],
  });
});

test("builds a single search document from image metadata", () => {
  const document = buildPhotoSearchDocument({
    filename: "IMG_1001.jpeg",
    caption: "A red flower in a ceramic vase",
    tags: ["flower", "vase"],
    ocrText: "",
    collections: ["flowers"],
    timestamp: "2026-09-20T12:00:00.000Z",
  });

  assert.match(document, /red flower/);
  assert.match(document, /Tags: flower, vase/);
  assert.match(document, /Collections: flowers/);
  assert.match(document, /IMG_1001\.jpeg/);
});

test("accepts useful search queries and rejects one-character input", () => {
  assert.equal(normalizePhotoSearchQuery("  pizza night  "), "pizza night");
  assert.equal(normalizePhotoSearchQuery("x"), null);
  assert.equal(normalizePhotoSearchQuery(null), null);
});

test("Jev relevance reranks vector candidates without losing the fallback score", () => {
  const candidates: PhotoSearchCandidate[] = [
    {
      id: "vector-first",
      filename: "one.jpg",
      caption: "A restaurant table",
      tags: ["restaurant"],
      ocrText: "",
      collections: ["food"],
      similarity: 0.9,
    },
    {
      id: "jev-first",
      filename: "two.jpg",
      caption: "Friends making pizza together",
      tags: ["friends", "pizza"],
      ocrText: "",
      collections: ["friends"],
      similarity: 0.72,
    },
  ];

  const ranked = rankPhotoSearchCandidates(
    candidates,
    new Map([
      ["vector-first", 0.2],
      ["jev-first", 0.98],
    ]),
  );
  assert.deepEqual(ranked.map((candidate) => candidate.id), ["jev-first", "vector-first"]);
  assert.equal(rankPhotoSearchCandidates(candidates, new Map())[0].id, "vector-first");
});
