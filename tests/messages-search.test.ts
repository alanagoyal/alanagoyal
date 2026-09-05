import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getConversationNameMatches,
  getMessageSearchResults,
} from "../lib/messages/search";
import type { Conversation } from "../types/messages";

const conversations: Conversation[] = [
  {
    id: "one",
    recipients: [{ id: "person-one", name: "Ada Lovelace" }],
    messages: [
      { id: "one-old", content: "Analytical Engine", sender: "Ada Lovelace", timestamp: "2026-01-01" },
      { id: "one-system", content: "Engine notice", sender: "system", timestamp: "2026-01-02" },
      { id: "one-new", content: "The engine can compose", sender: "me", timestamp: "2026-01-03" },
    ],
    lastMessageTime: "2026-01-03",
    unreadCount: 0,
  },
  {
    id: "two",
    name: "Babbage group",
    recipients: [{ id: "person-two", name: "Charles Babbage" }],
    messages: [
      { id: "two-match", content: "A difference engine", sender: "Charles Babbage", timestamp: "2026-01-04" },
    ],
    lastMessageTime: "2026-01-04",
    unreadCount: 0,
  },
];

describe("Messages search", () => {
  it("returns message matches newest-first within conversation order", () => {
    assert.deepEqual(
      getMessageSearchResults(conversations, "ENGINE").map(({ message }) => message.id),
      ["one-new", "one-old", "two-match"],
    );
  });

  it("omits system messages and honors the result limit", () => {
    assert.deepEqual(
      getMessageSearchResults(conversations, "engine", 1).map(({ message }) => message.id),
      ["one-new"],
    );
  });

  it("matches the displayed conversation name", () => {
    assert.deepEqual(
      getConversationNameMatches(conversations, "babbage").map(({ id }) => id),
      ["two"],
    );
    assert.deepEqual(
      getConversationNameMatches(conversations, "ada").map(({ id }) => id),
      ["one"],
    );
  });
});
