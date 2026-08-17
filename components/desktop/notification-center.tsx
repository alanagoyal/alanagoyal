"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
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
  X,
} from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { useWindowManager } from "@/lib/window-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { usePhotos } from "@/lib/photos/use-photos";
import { getThumbnailUrl } from "@/lib/photos/image-utils";
import { getEventsForDay, formatEventTime } from "@/components/apps/calendar/utils";
import { loadCalendars } from "@/components/apps/calendar/data";
import { WeatherSceneEffects } from "@/components/apps/weather/weather-scene-effects";
import { PodcastTweetCard } from "@/components/desktop/x-podcast-notification";
import {
  buildOpenMeteoForecastUrl,
  getWeatherDescription,
  getWeatherIconName,
  getWeatherScene,
} from "@/lib/weather";
import { getPodcastNotificationPayload } from "@/lib/podcast-notification";
import {
  dismissNotificationCenterItems,
  getUnreadMessagesNotification,
  isNotificationCenterItemDismissed,
} from "@/lib/notification-center";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/components/apps/calendar/types";
import type { Conversation } from "@/types/messages";
import type { PodcastNotificationPayload } from "@/types/desktop-notification";
import type { Photo } from "@/types/photos";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenMessagesConversation?: (conversationId: string) => void;
  onOpenPodcastNotification?: (notification: PodcastNotificationPayload) => void;
}

const notificationCardClass = "mb-1.5 rounded-md p-3";
const cardClass = `${notificationCardClass} bg-muted`;
const clickableCardClass =
  `${cardClass} cursor-pointer text-left transition-colors`;
const weatherCardClass = `${notificationCardClass} h-[134px]`;
const clickableWeatherCardClass = `${weatherCardClass} transition-colors cursor-pointer`;

interface RegisteredClearableItem {
  itemId: string;
  onDismiss: () => void;
  signature: string;
}

interface NotificationCenterClearAllContextValue {
  clearAll: () => void;
  registerItem: (item: RegisteredClearableItem) => () => void;
}

const NotificationCenterClearAllContext =
  createContext<NotificationCenterClearAllContextValue | null>(null);

function useNotificationCenterClearAll() {
  const value = useContext(NotificationCenterClearAllContext);
  if (!value) {
    throw new Error(
      "ClearableCard must be inside NotificationCenterClearAllProvider"
    );
  }
  return value;
}

function NotificationCenterClearAllProvider({
  children,
}: {
  children: ReactNode;
}) {
  const itemsRef = useRef(new Map<string, RegisteredClearableItem>());

  const registerItem = useCallback((item: RegisteredClearableItem) => {
    itemsRef.current.set(item.itemId, item);

    return () => {
      const registeredItem = itemsRef.current.get(item.itemId);
      if (registeredItem === item) {
        itemsRef.current.delete(item.itemId);
      }
    };
  }, []);

  const clearAll = useCallback(() => {
    const items = [...itemsRef.current.values()];
    dismissNotificationCenterItems(
      window.sessionStorage,
      items.map(({ itemId, signature }) => ({ itemId, signature }))
    );
    items.forEach(({ onDismiss }) => onDismiss());
  }, []);

  const value = useMemo(
    () => ({ clearAll, registerItem }),
    [clearAll, registerItem]
  );

  return (
    <NotificationCenterClearAllContext.Provider value={value}>
      {children}
    </NotificationCenterClearAllContext.Provider>
  );
}

function ClearableCard({
  children,
  itemId,
  signature,
}: {
  children: ReactNode;
  itemId: string;
  signature: string;
}) {
  const { clearAll, registerItem } = useNotificationCenterClearAll();
  const [isDismissed, setIsDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsDismissed(
      isNotificationCenterItemDismissed(
        window.sessionStorage,
        itemId,
        signature
      )
    );
  }, [itemId, signature]);

  useEffect(() => {
    if (isDismissed !== false) return;

    return registerItem({
      itemId,
      signature,
      onDismiss: () => setIsDismissed(true),
    });
  }, [isDismissed, itemId, registerItem, signature]);

  if (isDismissed !== false) return null;

  return (
    <div className="group/card relative">
      {children}
      <button
        type="button"
        aria-label="Clear all notifications"
        className="group/clear absolute -left-1.5 -top-1.5 z-[2] flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-700/90 text-zinc-200 opacity-0 shadow-md backdrop-blur-md transition-[width,opacity,background-color] duration-150 focus:w-[68px] focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 can-hover:group-hover/card:opacity-100 can-hover:hover:w-[68px] can-hover:hover:bg-zinc-700"
        onClick={clearAll}
      >
        <X
          className="absolute size-3.5 transition-opacity group-focus/clear:opacity-0 can-hover:group-hover/clear:opacity-0"
          strokeWidth={2}
        />
        <span className="whitespace-nowrap text-[11px] font-medium opacity-0 transition-opacity group-focus/clear:opacity-100 can-hover:group-hover/clear:opacity-100">
          Clear All
        </span>
      </button>
    </div>
  );
}

function PodcastNotificationWidget({
  onActivate,
  onOpen,
}: {
  onActivate: () => void;
  onOpen?: (notification: PodcastNotificationPayload) => void;
}) {
  const notification = getPodcastNotificationPayload();

  return (
    <ClearableCard
      itemId="podcast"
      signature={notification.id}
    >
      <button
        type="button"
        className={`${clickableCardClass} w-full`}
        onClick={() => {
          if (onOpen) {
            onOpen(notification);
          } else {
            window.open(notification.tweetUrl, "_blank", "noopener,noreferrer");
          }
          onActivate();
        }}
      >
        <PodcastTweetCard
          notification={notification}
          compact
          className="rounded-none border-0 bg-transparent p-0 shadow-none dark:bg-transparent"
        />
      </button>
    </ClearableCard>
  );
}

// WMO weather code → icon + description
function getWeatherInfo(code: number): {
  icon: React.ReactNode;
  description: string;
} {
  const description = getWeatherDescription(code);
  const iconName = getWeatherIconName(code);

  switch (iconName) {
    case "sun":
      return { icon: <Sun className="w-8 h-8" />, description };
    case "cloud":
      return { icon: <Cloud className="w-8 h-8" />, description };
    case "fog":
      return { icon: <CloudFog className="w-8 h-8" />, description };
    case "drizzle":
      return { icon: <CloudDrizzle className="w-8 h-8" />, description };
    case "rain":
      return { icon: <CloudRain className="w-8 h-8" />, description };
    case "snow":
      return { icon: <CloudSnow className="w-8 h-8" />, description };
    case "thunder":
      return { icon: <CloudLightning className="w-8 h-8" />, description };
    default:
      return { icon: <Cloud className="w-8 h-8" />, description };
  }
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
  const todaySignature = `${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDate()}`;
  const signature = [
    todaySignature,
    ...events.map((event) =>
      [event.id, event.title, event.startTime, event.endTime].join(":")
    ),
  ].join("|");

  return (
    <ClearableCard
      itemId="calendar"
      signature={signature}
    >
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
    </ClearableCard>
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
  const [notification, setNotification] = useState<
    ReturnType<typeof getUnreadMessagesNotification> | undefined
  >(undefined);

  useEffect(() => {
    let conversations: Conversation[] = [];
    try {
      const stored = localStorage.getItem("dialogueConversations");
      if (stored) conversations = JSON.parse(stored);
    } catch {
      // ignore
    }

    setNotification(getUnreadMessagesNotification(conversations));
  }, [refreshKey]);

  if (!notification) return null;

  const { latestConversation, signature, totalUnread } = notification;

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

  if (!senderName || !lastMessage) return null;

  return (
    <ClearableCard
      itemId="messages"
      signature={signature}
    >
      <div
        className={clickableCardClass}
        onClick={() => {
          if (onOpenConversation) {
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
          <span className="bg-[#0A7CFF] text-white text-[10px] font-medium rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
            {totalUnread}
          </span>
        </div>
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
      </div>
    </ClearableCard>
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

function WeatherWidgetSkeleton() {
  const skeletonClass = "bg-white/20";
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
      <ClearableCard
        itemId="photos"
        signature="loading"
      >
        <div className={cardClass}>
          <div className="h-4 w-24 rounded bg-black/10 dark:bg-white/15 animate-pulse mb-2" />
          <div className="grid grid-cols-3 gap-1.5">
            <div className="aspect-square rounded bg-black/10 dark:bg-white/15 animate-pulse" />
            <div className="aspect-square rounded bg-black/10 dark:bg-white/15 animate-pulse" />
            <div className="aspect-square rounded bg-black/10 dark:bg-white/15 animate-pulse" />
          </div>
        </div>
      </ClearableCard>
    );
  }

  if (recentPhotos.length === 0) return null;
  const signature = recentPhotos.map((photo) => photo.id).join("|");

  return (
    <ClearableCard
      itemId="photos"
      signature={signature}
    >
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
    </ClearableCard>
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
  const scene = getWeatherScene(
    weather?.currentTime ?? new Date().toISOString(),
    weather?.code ?? 1
  );
  const textClassName = "text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.45)]";
  const mutedTextClassName = "text-white/78 [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]";
  const iconClassName = "text-white/82";
  const today = new Date();
  const unavailableSignature = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const signature = loading
    ? "loading"
    : weather
      ? [
          weather.currentTime,
          weather.temp,
          weather.code,
          weather.high,
          weather.low,
        ].join(":")
      : `unavailable:${unavailableSignature}`;

  return (
    <ClearableCard
      itemId="weather"
      signature={signature}
    >
      <div
        className={cn(
          clickableWeatherCardClass,
          "relative overflow-hidden text-white"
        )}
        style={{ background: scene.background }}
        onClick={() => {
          openWindow("weather");
          onActivate();
        }}
      >
        <WeatherSceneEffects scene={scene} surface="preview" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/14" />
        <div className={cn("relative z-[1]", textClassName)}>
          {loading && <WeatherWidgetSkeleton />}
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
    </ClearableCard>
  );
}

// --- Notification Center ---
export function NotificationCenter({
  isOpen,
  onClose,
  onOpenMessagesConversation,
  onOpenPodcastNotification,
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
          buildOpenMeteoForecastUrl({
            latitude: 37.78,
            longitude: -122.42,
            currentFields: ["temperature_2m", "weather_code"],
            dailyFields: ["temperature_2m_max", "temperature_2m_min"],
            forecastDays: 1,
          })
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
      className="absolute top-7 right-0 z-[70] max-h-[calc(100vh-3rem)] w-80 overflow-hidden rounded-lg border border-muted-foreground/20 bg-white/95 p-2 shadow-2xl backdrop-blur-xl dark:bg-zinc-800/95"
    >
      <ScrollArea
        className="max-h-[calc(100vh-4rem-2px)]"
        viewportClassName="max-h-[inherit]"
      >
        <NotificationCenterClearAllProvider>
          {/* Date Header */}
          <div className="px-1 pt-1 pb-2">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {weekday}
            </p>
            <p className="text-2xl font-bold">{monthDay}</p>
          </div>
          <CalendarWidget onActivate={onClose} refreshKey={openRefreshKey} />
          <PodcastNotificationWidget
            onActivate={onClose}
            onOpen={onOpenPodcastNotification}
          />
          <MessagesWidget
            onActivate={onClose}
            refreshKey={openRefreshKey}
            onOpenConversation={onOpenMessagesConversation}
          />
          <PhotosWidget
            photos={photos}
            loading={photosLoading}
            onActivate={onClose}
          />
          <WeatherWidget
            weather={weather}
            loading={weatherLoading}
            onActivate={onClose}
          />
        </NotificationCenterClearAllProvider>
      </ScrollArea>
    </div>
  );
}
