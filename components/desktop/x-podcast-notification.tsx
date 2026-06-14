"use client";

import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PodcastNotificationPayload } from "@/types/desktop-notification";

function VerifiedBadge() {
  return (
    <svg
      viewBox="0 0 22 22"
      role="img"
      aria-label="Verified"
      className="h-[17px] w-[17px] shrink-0 text-[#1d9bf0]"
    >
      <path
        fill="currentColor"
        d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816Z"
      />
      <path
        fill="white"
        d="m9.662 14.85-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246Z"
      />
    </svg>
  );
}

export function PodcastTweetCard({
  notification,
  compact = false,
  className,
}: {
  notification: PodcastNotificationPayload;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-zinc-200/80 bg-white/78 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.52)] dark:border-white/10 dark:bg-zinc-950/48",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative shrink-0 overflow-hidden rounded-full bg-zinc-950 shadow-sm",
            compact ? "h-8 w-8" : "h-9 w-9"
          )}
        >
          <Image
            src={notification.authorAvatarSrc}
            alt={notification.authorAvatarAlt}
            fill
            sizes={compact ? "32px" : "36px"}
            className="object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-zinc-950 dark:text-white">
              {notification.authorName}
            </span>
            {notification.authorVerified && (
              <span className="shrink-0" title="Verified">
                <VerifiedBadge />
              </span>
            )}
            <span className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">
              {notification.authorHandle}
            </span>
            <span className="shrink-0 text-[12px] text-zinc-500 dark:text-zinc-400">
              · {notification.postedAtLabel}
            </span>
          </div>
          <div
            className={cn(
              "mt-2 whitespace-pre-line text-zinc-900 dark:text-zinc-50",
              compact
                ? "line-clamp-5 text-[12px] leading-[1.25]"
                : "line-clamp-6 text-[13px] leading-[1.28]"
            )}
          >
            {notification.tweetText}
          </div>
          <div
            className={cn(
              "relative mt-3 aspect-video overflow-hidden rounded-xl border border-zinc-200/70 bg-zinc-950 dark:border-white/10",
              compact ? "max-h-[132px]" : ""
            )}
          >
            <Image
              src={notification.mediaThumbnailSrc}
              alt={notification.mediaAlt}
              fill
              sizes={compact ? "280px" : "360px"}
              className="object-cover"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-transparent" />
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-black/72 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              <Play className="h-3 w-3 fill-white" />
              Video
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
