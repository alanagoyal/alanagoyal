"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { PodcastTweetCard } from "./x-podcast-notification";
import type {
  DesktopNotificationPayload,
  PodcastNotificationPayload,
} from "@/types/desktop-notification";
import type { MessagesNotificationPayload } from "@/types/messages/notification";

interface DesktopNotificationBannerProps {
  notification: DesktopNotificationPayload | null;
  onClick: (notification: DesktopNotificationPayload) => void;
  onDismiss: () => void;
  onHoverChange?: (hovered: boolean) => void;
}

function isPodcastNotification(
  notification: DesktopNotificationPayload
): notification is PodcastNotificationPayload {
  return notification.type === "podcast";
}

function getAvatarInitials(notification: MessagesNotificationPayload) {
  return notification.sender
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function MessagesNotificationContent({
  notification,
}: {
  notification: MessagesNotificationPayload;
}) {
  const avatarInitials = getAvatarInitials(notification);

  return (
    <div className="flex items-start gap-3">
      <div className="relative mt-0.5 shrink-0">
        <div className="w-12 h-12 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-400 dark:from-zinc-500 dark:to-zinc-700 flex items-center justify-center text-white text-[17px] font-semibold leading-none select-none">
          {avatarInitials}
        </div>
        <div className="absolute -bottom-1 -right-0.5">
          <Image
            src="/messages.png"
            alt="Messages"
            width={20}
            height={20}
            className="w-5 h-5 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]"
          />
        </div>
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[15px] font-semibold text-zinc-900 dark:text-white truncate">
            {notification.title}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-300 shrink-0">now</div>
        </div>
        <div className="text-[14px] text-zinc-800 dark:text-zinc-100/95 leading-[1.2] line-clamp-2 break-words">
          {notification.body}
        </div>
      </div>
    </div>
  );
}

function PodcastNotificationContent({
  notification,
}: {
  notification: PodcastNotificationPayload;
}) {
  return (
    <PodcastTweetCard
      notification={notification}
      className="border-0 bg-transparent p-0 shadow-none dark:bg-transparent"
    />
  );
}

export function DesktopNotificationBanner({
  notification,
  onClick,
  onDismiss,
  onHoverChange,
}: DesktopNotificationBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!notification) return;
    setIsVisible(false);
    const frame = requestAnimationFrame(() => {
      setIsVisible(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [notification]);

  const suppressPointerEvent = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleBannerClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!notification) return;
      if (isPodcastNotification(notification)) {
        onClick(notification);
        return;
      }

      // Defer activation so window-focus click-capture state from this click
      // cannot interfere with the newly focused Messages window.
      window.setTimeout(() => onClick(notification), 0);
    },
    [notification, onClick]
  );

  const handleDismissClick = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      onDismiss();
    },
    [onDismiss]
  );

  if (!notification) return null;
  const isPodcast = isPodcastNotification(notification);
  const widthClassName = isPodcast ? "w-[430px]" : "w-[390px]";
  const paddingClassName = isPodcast ? "px-4 py-3" : "px-4 py-2.5";

  return (
    <div className="fixed top-10 right-4 z-[120] pointer-events-none">
      <button
        onMouseDown={suppressPointerEvent}
        onMouseUp={suppressPointerEvent}
        onClick={handleBannerClick}
        onMouseEnter={() => onHoverChange?.(true)}
        onMouseLeave={() => onHoverChange?.(false)}
        className={`group relative pointer-events-auto ${widthClassName} max-w-[calc(100vw-24px)] rounded-2xl border border-black/10 dark:border-white/20 bg-[#f3f3f5]/96 dark:bg-zinc-800/96 backdrop-blur-xl shadow-[0_8px_24px_rgba(0,0,0,0.26)] text-left ${paddingClassName} transition-all duration-300 ${
          isVisible ? "translate-x-0 opacity-100" : "translate-x-[120%] opacity-0"
        }`}
      >
        <span
          onMouseDown={suppressPointerEvent}
          onMouseUp={suppressPointerEvent}
          onClick={handleDismissClick}
          role="button"
          aria-label="Dismiss notification"
          className="absolute -left-2.5 -top-1.5 w-[22px] h-[22px] rounded-full bg-[#c8c8cc]/90 dark:bg-[#525258]/90 backdrop-blur-xl border border-white/40 dark:border-white/10 shadow-[0_1px_4px_rgba(0,0,0,0.18)] dark:shadow-[0_1px_4px_rgba(0,0,0,0.4)] text-zinc-500/90 dark:text-zinc-400 grid place-items-center text-[14px] leading-none font-normal opacity-0 pointer-events-none can-hover:group-hover:opacity-100 can-hover:group-hover:pointer-events-auto transition-opacity duration-150"
        >
          ✕
        </span>
        {isPodcast ? (
          <PodcastNotificationContent notification={notification} />
        ) : (
          <MessagesNotificationContent notification={notification} />
        )}
      </button>
    </div>
  );
}
