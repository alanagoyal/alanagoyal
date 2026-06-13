import type { MessagesNotificationPayload } from "@/types/messages/notification";

export interface PodcastNotificationPayload {
  id: string;
  type: "podcast";
  title: string;
  body: string;
  tweetUrl: string;
  authorName: string;
  authorHandle: string;
  tweetText: string;
  postedAtLabel: string;
  mediaThumbnailSrc: string;
  mediaAlt: string;
  timestampLabel: string;
  statusLabel: string;
}

export type DesktopNotificationPayload =
  | MessagesNotificationPayload
  | PodcastNotificationPayload;
