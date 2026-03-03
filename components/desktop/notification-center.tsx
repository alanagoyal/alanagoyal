"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import Image from "next/image";
import {
  Calendar,
  MessageCircle,
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
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/components/apps/calendar/types";
import type { Conversation } from "@/types/messages";
import type { Photo } from "@/types/photos";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMessagesConversation?: (conversationId: string) => void;
}

const cardClass = "bg-muted rounded-md p-3 mb-1.5";
const clickableCardClass =
  "bg-muted rounded-md p-3 mb-1.5 transition-colors cursor-pointer";
const weatherCardClass = "h-[134px]";
const clickableWeatherCardClass = `${clickableCardClass} ${weatherCardClass}`;

type DayPhase = "night" | "dawn" | "day" | "dusk";
type WeatherMood = "clear" | "cloudy" | "fog" | "rain" | "snow" | "thunder";

interface WeatherWidgetScene {
  background: string;
  isDark: boolean;
  showStars: boolean;
}

function getDayPhase(iso: string): DayPhase {
  if (!iso) return "day";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "day";
  const hour = date.getHours();
  if (hour < 5 || hour >= 20) return "night";
  if (hour < 8) return "dawn";
  if (hour < 17) return "day";
  return "dusk";
}

function getWeatherMood(code: number): WeatherMood {
  if (code === 0) return "clear";
  if (code <= 3) return "cloudy";
  if (code <= 48) return "fog";
  if (code <= 77) return "snow";
  if (code <= 82) return "rain";
  return "thunder";
}

function getWeatherWidgetScene(currentTimeIso: string, weatherCode: number): WeatherWidgetScene {
  const phase = getDayPhase(currentTimeIso);
  const mood = getWeatherMood(weatherCode);

  if (phase === "night") {
    return {
      background:
        mood === "rain" || mood === "thunder"
          ? "linear-gradient(180deg, #080f2a 0%, #111b3f 45%, #243362 100%)"
          : "linear-gradient(180deg, #0a1231 0%, #15224a 42%, #314482 100%)",
      isDark: true,
      showStars: mood === "clear" || mood === "cloudy",
    };
  }

  if (phase === "dusk") {
    return {
      background: "linear-gradient(180deg, #1d2f63 0%, #3f4f8d 36%, #8f83a8 64%, #dd9d77 100%)",
      isDark: true,
      showStars: false,
    };
  }

  if (phase === "dawn") {
    return {
      background: "linear-gradient(180deg, #284f8e 0%, #4f78b2 38%, #8faccf 64%, #f5c38f 100%)",
      isDark: false,
      showStars: false,
    };
  }

  if (mood === "fog") {
    return {
      background: "linear-gradient(180deg, #5e7898 0%, #8097b0 48%, #a8b6c4 100%)",
      isDark: false,
      showStars: false,
    };
  }

  if (mood === "rain" || mood === "thunder") {
    return {
      background: "linear-gradient(180deg, #35567d 0%, #4e6f95 42%, #6284ac 100%)",
      isDark: false,
      showStars: false,
    };
  }

  return {
    background: "linear-gradient(180deg, #3f83c4 0%, #63a7df 44%, #8dc4ee 100%)",
    isDark: false,
    showStars: false,
  };
}

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
function CalendarWidget({
  onActivate,
  refreshKey,
}: {
  onActivate: () => void;
  refreshKey: number;
}) {
  const { openWindow } = useWindowManager();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendarColors, setCalendarColors] = useState<Record<string, string>>({});

  useEffect(() => {
    const today = new Date();
    let userEvents: CalendarEvent[] = [];
    try {
      const stored = localStorage.getItem("calendar-user-events");
      if (stored) userEvents = JSON.parse(stored);
    } catch {
      // ignore
    }

    const allEvents = getEventsForDay(userEvents, today);
    const now = new Date();
    const parseTimeForToday = (time: string | undefined): Date | null => {
      if (!time) return null;
      const [hours, minutes] = time.split(":").map(Number);
      if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
      const parsed = new Date(today);
      parsed.setHours(hours, minutes, 0, 0);
      return parsed;
    };
    const visibleEvents = allEvents.filter((event) => {
      if (event.isAllDay) return true;

      const start = parseTimeForToday(event.startTime);
      const end = parseTimeForToday(event.endTime);
      if (start && end) {
        // Keep future and in-progress events.
        return end >= now;
      }
      if (start) {
        return start >= now;
      }
      return false;
    });
    const calendars = loadCalendars();
    const colors: Record<string, string> = {};
    for (const c of calendars) {
      colors[c.id] = c.color;
    }

    // Sort: all-day first, then by startTime.
    visibleEvents.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });
    setEvents(visibleEvents);
    setCalendarColors(colors);
  }, [refreshKey]);

  const displayed = events.slice(0, 4);
  const overflow = events.length - 4;

  return (
    <div
      className={clickableCardClass}
      onClick={() => {
        openWindow("calendar");
        onActivate();
      }}
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
function MessagesWidget({
  onActivate,
  refreshKey,
  onOpenConversation,
}: {
  onActivate: () => void;
  refreshKey: number;
  onOpenConversation?: (conversationId: string) => void;
}) {
  const { openWindow } = useWindowManager();
  const [totalUnread, setTotalUnread] = useState(0);
  const [latestConversation, setLatestConversation] = useState<Conversation | null>(null);

  useEffect(() => {
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
    setTotalUnread(total);
    setLatestConversation(unreadConversations[0] || null);
  }, [refreshKey]);

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
      onClick={() => {
        if (latestConversation?.id && onOpenConversation) {
          onOpenConversation(latestConversation.id);
        } else {
          openWindow("messages");
        }
        onActivate();
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
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
  currentTime: string;
  code: number;
  high: number;
  low: number;
}

function WeatherWidgetSkeleton({ isDark }: { isDark: boolean }) {
  const skeletonClass = isDark ? "bg-white/20" : "bg-black/10";
  return (
    <>
      <div className={cn("h-4 w-24 rounded animate-pulse", skeletonClass)} />
      <div className={cn("h-10 w-20 rounded animate-pulse mt-2", skeletonClass)} />
      <div className="flex items-center gap-2 mt-3">
        <div className={cn("h-8 w-8 rounded animate-pulse", skeletonClass)} />
        <div className="space-y-1.5">
          <div className={cn("h-3 w-16 rounded animate-pulse", skeletonClass)} />
          <div className={cn("h-3 w-20 rounded animate-pulse", skeletonClass)} />
        </div>
      </div>
    </>
  );
}

// --- Photos Widget ---
function PhotosWidget({
  photos,
  loading,
  onActivate,
}: {
  photos: Photo[];
  loading: boolean;
  onActivate: () => void;
}) {
  const { openWindow } = useWindowManager();

  const recentPhotos = useMemo(() => {
    return [...photos]
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 3);
  }, [photos]);

  if (loading) {
    return (
      <div className={cardClass}>
        <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/15 animate-pulse mb-2" />
        <div className="grid grid-cols-3 gap-1.5">
          <div className="aspect-square rounded bg-black/10 dark:bg-white/15 animate-pulse" />
          <div className="aspect-square rounded bg-black/10 dark:bg-white/15 animate-pulse" />
          <div className="aspect-square rounded bg-black/10 dark:bg-white/15 animate-pulse" />
        </div>
      </div>
    );
  }

  if (recentPhotos.length === 0) return null;

  return (
    <div
      className={clickableCardClass}
      onClick={() => {
        openWindow("photos");
        onActivate();
      }}
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

function WeatherWidget({
  weather,
  loading,
  onActivate,
}: {
  weather: WeatherData | null;
  loading: boolean;
  onActivate: () => void;
}) {
  const { openWindow } = useWindowManager();
  const weatherInfo = weather ? getWeatherInfo(weather.code) : null;
  const scene = getWeatherWidgetScene(
    weather?.currentTime ?? new Date().toISOString(),
    weather?.code ?? 1
  );
  const textClassName = scene.isDark ? "text-white" : "text-slate-900";
  const mutedTextClassName = scene.isDark ? "text-white/75" : "text-slate-700/80";
  const iconClassName = scene.isDark ? "text-white/80" : "text-slate-700/75";

  return (
    <div
      className={cn(
        clickableWeatherCardClass,
        "relative overflow-hidden border",
        scene.isDark ? "border-white/20 text-white" : "border-white/35 text-slate-900"
      )}
      style={{ background: scene.background }}
      onClick={() => {
        openWindow("weather");
        onActivate();
      }}
    >
      {scene.showStars && (
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(2px 2px at 12px 18px, rgba(255,255,255,0.95), transparent 60%), radial-gradient(1.5px 1.5px at 52px 36px, rgba(255,255,255,0.85), transparent 60%), radial-gradient(2px 2px at 98px 62px, rgba(255,255,255,0.9), transparent 60%), radial-gradient(1.5px 1.5px at 154px 28px, rgba(255,255,255,0.8), transparent 60%)",
            backgroundSize: "180px 120px",
          }}
        />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/15" />
      <div className={cn("relative z-[1]", textClassName)}>
        {loading && <WeatherWidgetSkeleton isDark={scene.isDark} />}
        {!loading && !weather && (
          <p className={cn("text-xs", mutedTextClassName)}>Weather unavailable</p>
        )}
        {!loading && weather && (
          <>
            <p className="text-sm font-medium">San Francisco</p>
            <p className="text-4xl font-light mt-0.5">{Math.round(weather.temp)}°</p>
            <div className="flex items-center gap-1.5 mt-3">
              <div className={iconClassName}>{weatherInfo?.icon}</div>
              <div>
                <p className="text-xs font-medium">{weatherInfo?.description}</p>
                <p className={cn("text-[10px]", mutedTextClassName)}>
                  H:{Math.round(weather.high)}° L:{Math.round(weather.low)}°
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- Notification Center ---
export function NotificationCenter({
  isOpen,
  onClose,
  onOpenMessagesConversation,
}: NotificationCenterProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose, isOpen);
  const [openRefreshKey, setOpenRefreshKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    setOpenRefreshKey((key) => key + 1);
  }, [isOpen]);

  const { photos, loading: photosLoading } = usePhotos({ enabled: isOpen });

  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setWeatherLoading(true);
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
            currentTime: data.current.time ?? new Date().toISOString(),
            code: data.current.weather_code,
            high: data.daily.temperature_2m_max[0],
            low: data.daily.temperature_2m_min[0],
          });
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) {
          setWeatherLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

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
        <CalendarWidget onActivate={onClose} refreshKey={openRefreshKey} />
        <MessagesWidget
          onActivate={onClose}
          refreshKey={openRefreshKey}
          onOpenConversation={onOpenMessagesConversation}
        />
        <PhotosWidget photos={photos} loading={photosLoading} onActivate={onClose} />
        <WeatherWidget weather={weather} loading={weatherLoading} onActivate={onClose} />
      </ScrollArea>
    </div>
  );
}
