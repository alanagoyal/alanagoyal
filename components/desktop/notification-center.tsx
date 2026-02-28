"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  MessageSquare,
  ImageIcon,
  Sun,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudSnow,
  CloudLightning,
} from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useWindowManager } from "@/lib/window-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePhotos } from "@/lib/photos/use-photos";
import { getThumbnailUrl } from "@/lib/photos/image-utils";
import { getEventsForDay, formatEventTime } from "@/components/apps/calendar/utils";
import { loadCalendars } from "@/components/apps/calendar/data";
import type { CalendarEvent } from "@/components/apps/calendar/types";
import type { Conversation } from "@/types/messages";
import type { Photo } from "@/types/photos";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

const cardClass = "bg-muted rounded-md p-3 mb-1.5";
const clickableCardClass =
  "bg-muted rounded-md p-3 mb-1.5 transition-colors cursor-pointer";

// WMO weather code → icon + description
function getWeatherInfo(code: number): {
  icon: React.ReactNode;
  description: string;
} {
  if (code === 0) return { icon: <Sun className="w-8 h-8" />, description: "Clear" };
  if (code <= 3) return { icon: <Cloud className="w-8 h-8" />, description: "Cloudy" };
  if (code <= 48) return { icon: <CloudFog className="w-8 h-8" />, description: "Foggy" };
  if (code <= 57) return { icon: <CloudDrizzle className="w-8 h-8" />, description: "Drizzle" };
  if (code <= 67) return { icon: <CloudRain className="w-8 h-8" />, description: "Rainy" };
  if (code <= 77) return { icon: <CloudSnow className="w-8 h-8" />, description: "Snowy" };
  if (code <= 82) return { icon: <CloudRain className="w-8 h-8" />, description: "Showers" };
  return { icon: <CloudLightning className="w-8 h-8" />, description: "Thunderstorm" };
}

// --- Calendar Widget ---
function CalendarWidget() {
  const { openWindow } = useWindowManager();

  const { events, calendarColors } = useMemo(() => {
    const today = new Date();
    let userEvents: CalendarEvent[] = [];
    try {
      const stored = localStorage.getItem("calendar-user-events");
      if (stored) userEvents = JSON.parse(stored);
    } catch {
      // ignore
    }

    const allEvents = getEventsForDay(userEvents, today);
    const calendars = loadCalendars();
    const colors: Record<string, string> = {};
    for (const c of calendars) {
      colors[c.id] = c.color;
    }

    // Sort: all-day first, then by startTime
    allEvents.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });

    return { events: allEvents, calendarColors: colors };
  }, []);

  const displayed = events.slice(0, 4);
  const overflow = events.length - 4;

  return (
    <div
      className={clickableCardClass}
      onClick={() => openWindow("calendar")}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Up Next</span>
      </div>
      {displayed.length === 0 ? (
        <p className="text-xs text-muted-foreground">No events today</p>
      ) : (
        <div className="space-y-1.5">
          {displayed.map((event) => (
            <div key={event.id} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{
                  backgroundColor:
                    calendarColors[event.calendarId] || "#888",
                }}
              />
              <span className="text-xs truncate flex-1">{event.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {event.isAllDay
                  ? "All Day"
                  : event.startTime && event.endTime
                    ? `${formatEventTime(event.startTime)} – ${formatEventTime(event.endTime)}`
                    : ""}
              </span>
            </div>
          ))}
          {overflow > 0 && (
            <p className="text-[10px] text-muted-foreground">
              +{overflow} more
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// --- Messages Widget ---
function MessagesWidget() {
  const { openWindow } = useWindowManager();

  const { totalUnread, latestConversation } = useMemo(() => {
    let conversations: Conversation[] = [];
    try {
      const stored = localStorage.getItem("dialogueConversations");
      if (stored) conversations = JSON.parse(stored);
    } catch {
      // ignore
    }

    const total = conversations.reduce(
      (sum, c) => sum + (c.unreadCount || 0),
      0
    );

    const unreadConversations = conversations
      .filter((c) => (c.unreadCount || 0) > 0)
      .sort(
        (a, b) =>
          new Date(b.lastMessageTime).getTime() -
          new Date(a.lastMessageTime).getTime()
      );

    return { totalUnread: total, latestConversation: unreadConversations[0] || null };
  }, []);

  const senderName = latestConversation?.recipients[0]?.name;
  const lastMessage =
    latestConversation?.messages[latestConversation.messages.length - 1];
  const initials = senderName
    ? senderName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <div
      className={clickableCardClass}
      onClick={() => openWindow("messages")}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold flex-1">Messages</span>
        {totalUnread > 0 && (
          <span className="bg-[#0A7CFF] text-white text-[10px] font-medium rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {totalUnread}
          </span>
        )}
      </div>
      {latestConversation && senderName && lastMessage ? (
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-b from-zinc-300 to-zinc-400 dark:from-zinc-500 dark:to-zinc-700 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-white">
              {initials}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{senderName}</p>
            <p className="text-[10px] text-muted-foreground line-clamp-2">
              {lastMessage.content}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No new messages</p>
      )}
    </div>
  );
}

// --- Weather Widget ---
interface WeatherData {
  temp: number;
  code: number;
  high: number;
  low: number;
}

function WeatherWidget({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;

  const weatherInfo = getWeatherInfo(weather.code);

  return (
    <div className={cardClass}>
      <p className="text-sm font-medium">San Francisco</p>
      <p className="text-4xl font-light mt-0.5">{Math.round(weather.temp)}°</p>
      <div className="flex items-center gap-1.5 mt-3">
        <div className="text-muted-foreground">{weatherInfo.icon}</div>
        <div>
          <p className="text-xs font-medium">{weatherInfo.description}</p>
          <p className="text-[10px] text-muted-foreground">
            H:{Math.round(weather.high)}° L:{Math.round(weather.low)}°
          </p>
        </div>
      </div>
    </div>
  );
}

// --- Photos Widget ---
function PhotosWidget({ photos }: { photos: Photo[] }) {
  const { openWindow } = useWindowManager();

  const recentPhotos = useMemo(() => {
    return [...photos]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 3);
  }, [photos]);

  if (recentPhotos.length === 0) return null;

  return (
    <div
      className={clickableCardClass}
      onClick={() => openWindow("photos")}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold">Recent Photos</span>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {recentPhotos.map((photo) => (
          <div
            key={photo.id}
            className="aspect-square rounded overflow-hidden relative"
          >
            <Image
              src={getThumbnailUrl(photo.url)}
              alt={photo.filename}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Notification Center ---
export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose, isOpen);

  // Fetch photos eagerly on mount so they're ready before panel opens
  const { photos } = usePhotos();

  // Fetch weather eagerly on mount so it's ready before panel opens
  const [weather, setWeather] = useState<WeatherData | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          "https://api.open-meteo.com/v1/forecast?latitude=37.78&longitude=-122.42&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&timezone=auto&forecast_days=1"
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setWeather({
            temp: data.current.temperature_2m,
            code: data.current.weather_code,
            high: data.daily.temperature_2m_max[0],
            low: data.daily.temperature_2m_min[0],
          });
        }
      } catch {
        // silently fail
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!isOpen) return null;

  const now = new Date();
  const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
  const monthDay = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  return (
    <div
      ref={menuRef}
      className="absolute top-7 right-0 w-80 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-xl shadow-2xl border border-muted-foreground/20 p-2 z-[70] max-h-[calc(100vh-3rem)]"
    >
      <ScrollArea className="h-full">
        {/* Date Header */}
        <div className="px-1 pt-1 pb-2">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {weekday}
          </p>
          <p className="text-2xl font-bold">{monthDay}</p>
        </div>

        <CalendarWidget />
        <MessagesWidget />
        <WeatherWidget weather={weather} />
        <PhotosWidget photos={photos} />
      </ScrollArea>
    </div>
  );
}
