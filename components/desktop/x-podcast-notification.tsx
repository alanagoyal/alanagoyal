"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXTwitter } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PodcastNotificationPayload } from "@/types/desktop-notification";

export function XAppIcon({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-[10px] bg-zinc-950 text-white shadow-sm",
        className
      )}
    >
      <FontAwesomeIcon
        icon={faXTwitter as IconProp}
        className={cn("h-5 w-5", iconClassName)}
      />
    </div>
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
        <XAppIcon className={cn("shrink-0 rounded-full", compact ? "h-8 w-8" : "h-9 w-9")} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-zinc-950 dark:text-white">
              {notification.authorName}
            </span>
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
