import type { PodcastNotificationPayload } from "@/types/desktop-notification";

export const PODCAST_TWEET_URL =
  "https://x.com/julesrosenberg/status/2065495897396658467?s=20";

const PODCAST_TWEET_ID = "2065495897396658467";
const PODCAST_TWEET_TEXT = `5 things @alanaagoyal does differently

> solo gp that commits code every single day
> doesn't take pitch meetings
> runs her agents in cmux on top of @mitchellh's ghostty
> built her personal website using a dozen of her own portco's products
> automated her investor updates...`;

export function getPodcastNotificationPayload(): PodcastNotificationPayload {
  return {
    id: `podcast-x-${PODCAST_TWEET_ID}`,
    type: "podcast",
    tweetUrl: PODCAST_TWEET_URL,
    authorName: "jules",
    authorHandle: "@julesrosenberg",
    authorAvatarSrc: "/podcast/jules-profile.jpg",
    authorAvatarAlt: "Jules Rosenberg profile photo",
    authorVerified: true,
    tweetText: PODCAST_TWEET_TEXT,
    postedAtLabel: "Jun 12",
    mediaThumbnailSrc: "/podcast/show-me-your-stack-thumb.jpg",
    mediaAlt: "Still from the Show Me Your Stack episode with Alana Goyal",
  };
}
