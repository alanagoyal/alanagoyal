import type { MessagesNotificationPayload } from "@/types/messages/notification";

export interface PodcastNotificationPayload {
  id: string;
  type: "podcast";
  tweetUrl: string;
  authorName: string;
  authorHandle: string;
  authorAvatarSrc: string;
  authorAvatarAlt: string;
  authorVerified: boolean;
  tweetText: string;
  postedAtLabel: string;
  mediaThumbnailSrc: string;
  mediaAlt: string;
}

export type DesktopNotificationPayload =
  | MessagesNotificationPayload
  | PodcastNotificationPayload;
