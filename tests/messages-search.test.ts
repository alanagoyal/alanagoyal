import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getConversationNameMatches,
  getMessageSearchPreviewText,
  getMessageSearchResults,
  getNextMessageSearchResultIndex,
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

  it("does not match reaction types", () => {
    const reactedConversation: Conversation = {
      ...conversations[0],
      messages: [
        {
          id: "reaction-only",
          content: "Acknowledged",
          sender: "Ada Lovelace",
          timestamp: "2026-01-05",
          reactions: [
            { type: "like", sender: "me", timestamp: "2026-01-05" },
          ],
        },
      ],
    };

    assert.deepEqual(getMessageSearchResults([reactedConversation], "like"), []);
  });

  it("shows the matching text in long message previews", () => {
    const preview = getMessageSearchPreviewText(
      "It's been cool to see AI codegen tools make these dev tools more accessible. We get a lot of users coming from platforms like Bolt, Loveable, and v0.",
      "like",
      60,
    );

    assert.match(preview, /^…/);
    assert.match(preview, /platforms like Bolt/);
    assert.ok(preview.indexOf("like") <= 19);
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

  it("wraps keyboard navigation through the visible result list", () => {
    assert.equal(getNextMessageSearchResultIndex(0, 3, 1), 1);
    assert.equal(getNextMessageSearchResultIndex(2, 3, 1), 0);
    assert.equal(getNextMessageSearchResultIndex(0, 3, -1), 2);
    assert.equal(getNextMessageSearchResultIndex(0, 0, 1), 0);
  });
});
