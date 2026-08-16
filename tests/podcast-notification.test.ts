import assert from "node:assert/strict";
import test from "node:test";

import {
  dismissPodcastNotification,
  isPodcastNotificationDismissed,
  PODCAST_NOTIFICATION_DISMISSAL_KEY,
} from "../lib/podcast-notification";

function createStorage(initialValue: string | null = null) {
  let value = initialValue;

  return {
    getItem(key: string) {
      return key === PODCAST_NOTIFICATION_DISMISSAL_KEY ? value : null;
    },
    setItem(key: string, nextValue: string) {
      if (key === PODCAST_NOTIFICATION_DISMISSAL_KEY) value = nextValue;
    },
  };
}

test("podcast dismissal persists only for the current notification", () => {
  const storage = createStorage();

  assert.equal(isPodcastNotificationDismissed(storage), false);
  dismissPodcastNotification(storage);
  assert.equal(isPodcastNotificationDismissed(storage), true);
  assert.equal(
    isPodcastNotificationDismissed(createStorage("an-older-notification")),
    false
  );
});

test("podcast dismissal tolerates unavailable browser storage", () => {
  const storage = {
    getItem() {
      throw new Error("unavailable");
    },
    setItem() {
      throw new Error("unavailable");
    },
  };

  assert.equal(isPodcastNotificationDismissed(storage), false);
  assert.doesNotThrow(() => dismissPodcastNotification(storage));
});
