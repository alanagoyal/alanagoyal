import assert from "node:assert/strict";
import test from "node:test";

import {
  getConversationReadStateLabel,
  toggleConversationReadState,
} from "../lib/messages/read-state";
import type { Conversation } from "../types/messages";

const conversations: Conversation[] = [
  {
    id: "read",
    recipients: [{ id: "person-1", name: "Ada Lovelace" }],
    messages: [],
    lastMessageTime: "2026-08-05T12:00:00.000Z",
    unreadCount: 0,
  },
  {
    id: "unread",
    recipients: [{ id: "person-2", name: "Grace Hopper" }],
    messages: [],
    lastMessageTime: "2026-08-05T12:01:00.000Z",
    unreadCount: 3,
  },
];

test("labels read-state actions from the current unread count", () => {
  assert.equal(getConversationReadStateLabel(conversations[0]), "Mark as Unread");
  assert.equal(getConversationReadStateLabel(conversations[1]), "Mark as Read");
});

test("marks read conversations unread without mutating adjacent conversations", () => {
  const updated = toggleConversationReadState(conversations, "read");

  assert.equal(updated[0].unreadCount, 1);
  assert.equal(updated[1], conversations[1]);
  assert.equal(conversations[0].unreadCount, 0);
});

test("marks unread conversations read", () => {
  const updated = toggleConversationReadState(conversations, "unread");

  assert.equal(updated[1].unreadCount, 0);
});
