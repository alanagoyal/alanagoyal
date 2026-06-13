import type { PodcastNotificationPayload } from "@/types/desktop-notification";

export const PODCAST_TWEET_URL =
  "https://x.com/julesrosenberg/status/2065495897396658467?s=20";

const PODCAST_TWEET_ID = "2065495897396658467";
const PODCAST_LAUNCH_DATE = new Date(2026, 5, 14);
const PODCAST_TWEET_TEXT = `5 things @alanaagoyal does differently

> solo gp that commits code every single day
> doesn't take pitch meetings
> runs her agents in cmux on top of @mitchellh's ghostty
> built her personal website using a dozen of her own portco's products
> automated her investor updates...`;

export const PODCAST_NOTIFICATION_DISMISSED_KEY =
  `podcast-x-notification-dismissed-${PODCAST_TWEET_ID}`;

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDaysUntilLaunch(now: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const today = startOfLocalDay(now).getTime();
  return Math.round((PODCAST_LAUNCH_DATE.getTime() - today) / msPerDay);
}

function getLaunchCopy(now: Date) {
  const daysUntilLaunch = getDaysUntilLaunch(now);

  if (daysUntilLaunch === 1) {
    return {
      title: "Podcast drops tomorrow",
      body: "Alana's episode launches June 14. Jules shared the announcement on X.",
      statusLabel: "tomorrow",
    };
  }

  if (daysUntilLaunch === 0) {
    return {
      title: "Podcast is out today",
      body: "Alana's episode is live. Jules shared the announcement on X.",
      statusLabel: "today",
    };
  }

  if (daysUntilLaunch < 0) {
    return {
      title: "Podcast episode is live",
      body: "Alana joined Jules for a new episode. Open the post on X.",
      statusLabel: "live",
    };
  }

  return {
    title: "Podcast drops June 14",
    body: "Alana's episode launches soon. Jules shared the announcement on X.",
    statusLabel: "soon",
  };
}

export function getPodcastNotificationPayload(now = new Date()): PodcastNotificationPayload {
  const copy = getLaunchCopy(now);

  return {
    id: `podcast-x-${PODCAST_TWEET_ID}`,
    type: "podcast",
    title: copy.title,
    body: copy.body,
    tweetUrl: PODCAST_TWEET_URL,
    authorName: "jules",
    authorHandle: "@julesrosenberg",
    tweetText: PODCAST_TWEET_TEXT,
    postedAtLabel: "Jun 12",
    mediaThumbnailSrc: "/podcast/show-me-your-stack-thumb.jpg",
    mediaAlt: "Still from the Show Me Your Stack episode with Alana Goyal",
    timestampLabel: "now",
    statusLabel: copy.statusLabel,
  };
}

export function loadPodcastNotificationDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(PODCAST_NOTIFICATION_DISMISSED_KEY) === "true";
}

export function savePodcastNotificationDismissed(): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PODCAST_NOTIFICATION_DISMISSED_KEY, "true");
}
