import assert from "node:assert/strict";
import test from "node:test";

import {
  dismissNotificationCenterItem,
  getUnreadMessagesNotification,
  getWeatherNotificationSignature,
  isNotificationCenterItemDismissed,
  NOTIFICATION_CENTER_DISMISSAL_KEY_PREFIX,
  shouldHideNotificationCenterItem,
} from "../lib/notification-center";
import type { Conversation } from "../types/messages";

function createStorage(initialValues: Record<string, string> = {}) {
  const values = new Map(Object.entries(initialValues));

  return {
    getItem(key: string) {
      return values.get(key) ?? null;
    },
    setItem(key: string, nextValue: string) {
      values.set(key, nextValue);
    },
  };
}

test("notification-center dismissal is independent and content-aware", () => {
  const storage = createStorage();

  assert.equal(
    isNotificationCenterItemDismissed(storage, "messages", "message-1"),
    false
  );
  dismissNotificationCenterItem(storage, "messages", "message-1");
  assert.equal(
    isNotificationCenterItemDismissed(storage, "messages", "message-1"),
    true
  );
  assert.equal(
    isNotificationCenterItemDismissed(storage, "messages", "message-2"),
    false
  );
  assert.equal(
    isNotificationCenterItemDismissed(storage, "weather", "message-1"),
    false
  );
});

test("notification-center dismissal tolerates unavailable browser storage", () => {
  const storage = {
    getItem() {
      throw new Error("unavailable");
    },
    setItem() {
      throw new Error("unavailable");
    },
  };

  assert.equal(
    isNotificationCenterItemDismissed(storage, "podcast", "episode-1"),
    false
  );
  assert.doesNotThrow(() =>
    dismissNotificationCenterItem(storage, "podcast", "episode-1")
  );
});

test("messages notification appears only for unread conversations", () => {
  const readConversation: Conversation = {
    id: "read",
    recipients: [{ id: "one", name: "One" }],
    messages: [
      { id: "read-message", content: "Read", sender: "one", timestamp: "2026-08-16T09:00:00Z" },
    ],
    lastMessageTime: "2026-08-16T09:00:00Z",
    unreadCount: 0,
  };
  assert.equal(getUnreadMessagesNotification([readConversation]), null);

  const olderUnread: Conversation = {
    ...readConversation,
    id: "older",
    messages: [
      { id: "older-message", content: "Older", sender: "one", timestamp: "2026-08-16T10:00:00Z" },
    ],
    lastMessageTime: "2026-08-16T10:00:00Z",
    unreadCount: 2,
  };
  const latestUnread: Conversation = {
    ...readConversation,
    id: "latest",
    messages: [
      { id: "latest-message", content: "Latest", sender: "one", timestamp: "2026-08-16T11:00:00Z" },
    ],
    lastMessageTime: "2026-08-16T11:00:00Z",
    unreadCount: 1,
  };
  const notification = getUnreadMessagesNotification([
    readConversation,
    olderUnread,
    latestUnread,
  ]);

  assert.equal(notification?.latestConversation.id, "latest");
  assert.equal(notification?.totalUnread, 3);
  assert.match(notification?.signature ?? "", /latest:1/);
  assert.match(notification?.signature ?? "", /older:2/);
});

test("dismissal keys remain scoped to Notification Center", () => {
  const storage = createStorage({
    [`${NOTIFICATION_CENTER_DISMISSAL_KEY_PREFIX}photos`]: "photo-1",
  });

  assert.equal(
    isNotificationCenterItemDismissed(storage, "photos", "photo-1"),
    true
  );
});

test("weather dismissal stays stable while a loaded forecast refreshes", () => {
  const weather = {
    temp: 62,
    currentTime: "2026-08-18T09:00",
    code: 1,
    high: 68,
    low: 54,
  };
  const loadedSignature = getWeatherNotificationSignature(weather, false);

  assert.equal(
    getWeatherNotificationSignature(weather, true),
    loadedSignature
  );
  assert.notEqual(getWeatherNotificationSignature(null, true), loadedSignature);
});

test("weather loading stays hidden until its dismissed signature resolves", () => {
  const storage = createStorage();
  const loadedSignature = "2026-08-18T09:00:62:1:68:54";
  dismissNotificationCenterItem(storage, "weather", loadedSignature);

  assert.equal(
    isNotificationCenterItemDismissed(storage, "weather", "loading"),
    false
  );
  assert.equal(
    shouldHideNotificationCenterItem(storage, "weather", "loading", true),
    true
  );
  assert.equal(
    shouldHideNotificationCenterItem(
      storage,
      "weather",
      "2026-08-18T10:00:63:1:69:55"
    ),
    false
  );
});
