import assert from "node:assert/strict";
import test from "node:test";

import {
  canStartMobileConversationLongPress,
  didMobileConversationLongPressMove,
  getConversationDisplayName,
  getConversationPreviewMessages,
  isConversationContextMenuKeyboardShortcut,
} from "../lib/messages/mobile-conversation-interactions";
import type { Conversation } from "../types/messages";

const conversation: Conversation = {
  id: "conversation-1",
  name: "Design chat",
  recipients: [{ id: "person-1", name: "Ada Lovelace" }],
  lastMessageTime: "2026-07-27T12:00:00.000Z",
  unreadCount: 0,
  messages: [
    {
      id: "system",
      content: "Ada joined the conversation",
      sender: "system",
      timestamp: "2026-07-27T11:57:00.000Z",
    },
    {
      id: "empty",
      content: "   ",
      sender: "Ada Lovelace",
      timestamp: "2026-07-27T11:58:00.000Z",
    },
    {
      id: "incoming",
      content: "Does this interaction feel native?",
      sender: "Ada Lovelace",
      timestamp: "2026-07-27T11:59:00.000Z",
    },
    {
      id: "outgoing",
      content: "The expanded preview does.",
      sender: "me",
      timestamp: "2026-07-27T12:00:00.000Z",
    },
  ],
};

test("starts conversation long presses only for touch-style pointers", () => {
  assert.equal(canStartMobileConversationLongPress("touch"), true);
  assert.equal(canStartMobileConversationLongPress("pen"), true);
  assert.equal(canStartMobileConversationLongPress("mouse"), false);
});

test("cancels a conversation long press after meaningful movement", () => {
  assert.equal(
    didMobileConversationLongPressMove({ x: 10, y: 10 }, { x: 20, y: 20 }),
    false,
  );
  assert.equal(
    didMobileConversationLongPressMove({ x: 10, y: 10 }, { x: 21, y: 10 }),
    true,
  );
});

test("recognizes conversation context-menu keyboard shortcuts", () => {
  assert.equal(
    isConversationContextMenuKeyboardShortcut("ContextMenu", false),
    true,
  );
  assert.equal(isConversationContextMenuKeyboardShortcut("F10", true), true);
  assert.equal(isConversationContextMenuKeyboardShortcut("F10", false), false);
});

test("builds a useful static conversation preview", () => {
  assert.equal(getConversationDisplayName(conversation), "Design chat");
  assert.deepEqual(
    getConversationPreviewMessages(conversation).map((message) => message.id),
    ["incoming", "outgoing"],
  );
  assert.deepEqual(getConversationPreviewMessages(conversation, 1), [
    conversation.messages[3],
  ]);
});
