"use client";

import { useEffect, useState, useCallback } from "react";
import { useWindowManager } from "@/lib/window-context";
import { getAppById } from "@/lib/app-config";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faApple } from "@fortawesome/free-brands-svg-icons";
import { faWifi, faBatteryFull, faSliders } from "@fortawesome/free-solid-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import { cn } from "@/lib/utils";
import { AppleMenu } from "./apple-menu";
import { BatteryMenu, WifiMenu, ControlCenterMenu } from "./status-menus";
import { NotificationCenter } from "./notification-center";
import { AppMenu } from "./app-menu";
import { FileMenu } from "./file-menu";
import { FinderViewMenu } from "./finder-view-menu";
import { CalendarViewMenu } from "./calendar-view-menu";
import { WeatherViewMenu } from "./weather-view-menu";
import { TextEditEditMenu } from "./textedit-edit-menu";
import { TextEditFormatMenu } from "./textedit-format-menu";
import { TextEditFileMenu, TextEditRenameDialog } from "./textedit-file-menu";
import { PreviewFileMenu } from "./preview-file-menu";
import { AboutDialog } from "./about-dialog";
import { FocusMenu, FOCUS_STATUS_CONFIG } from "./focus-menu";
import { useFileMenuActions } from "@/lib/file-menu-context";
import { useSystemSettings } from "@/lib/system-settings-context";
import {
  getDelayUntilNextClockRefresh,
  getMenuBarClockRefreshMs,
} from "@/lib/menu-bar-clock";
import type { PodcastNotificationPayload } from "@/types/desktop-notification";
import type { FinderViewMode } from "@/components/apps/finder/view-mode";
import type { WeatherTemperatureUnit } from "@/lib/weather";
import { TEXTEDIT_OPEN_FIND_EVENT } from "@/lib/textedit-find";

type OpenMenu = "apple" | "appMenu" | "fileMenu" | "textEditFileMenu" | "previewFileMenu" | "finderViewMenu" | "calendarViewMenu" | "weatherViewMenu" | "textEditEditMenu" | "textEditFormatMenu" | "battery" | "wifi" | "focusMenu" | "controlCenter" | "notificationCenter" | null;

const LOW_POWER_MODE_STORAGE_KEY = "desktop-low-power-mode";

function AnalogClock({ date }: { date: Date }) {
  const minuteAngle = date.getMinutes() * 6;
  const hourAngle = (date.getHours() % 12) * 30 + date.getMinutes() * 0.5;

  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 3.5v1M10 15.5v1M3.5 10h1M15.5 10h1" stroke="currentColor" strokeWidth="1" />
      <path d="M10 10V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform={`rotate(${hourAngle} 10 10)`} />
      <path d="M10 10V4.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" transform={`rotate(${minuteAngle} 10 10)`} />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
    </svg>
  );
}

interface MenuBarProps {
  onOpenSettings?: () => void;
  onOpenWifiSettings?: () => void;
  onOpenFocusSettings?: () => void;
  onOpenAbout?: () => void;
  onSleep?: () => void;
  onRestart?: () => void;
  onShutdown?: () => void;
  onLockScreen?: () => void;
  onLogout?: () => void;
  onOpenMessagesConversation?: (conversationId: string) => void;
  onOpenPodcastNotification?: (notification: PodcastNotificationPayload) => void;
  finderViewMode?: FinderViewMode;
  onFinderViewModeChange?: (mode: FinderViewMode) => void;
  finderStatusBarVisible?: boolean;
  onFinderStatusBarVisibleChange?: (visible: boolean) => void;
  finderPathBarVisible?: boolean;
  onFinderPathBarVisibleChange?: (visible: boolean) => void;
  calendarWeekNumbersVisible?: boolean;
  onCalendarWeekNumbersVisibleChange?: (visible: boolean) => void;
  weatherTemperatureUnit?: WeatherTemperatureUnit;
  onWeatherTemperatureUnitChange?: (unit: WeatherTemperatureUnit) => void;
  onTextEditNew?: () => void;
  onTextEditOpen?: () => void;
  onTextEditClose?: (windowId: string) => void;
  onTextEditSave?: (windowId: string) => void;
  onTextEditDuplicate?: (windowId: string) => void;
  onTextEditRename?: (windowId: string, fileName: string) => string | null;
  onTextEditWrapToPageChange?: (windowId: string, wrapToPage: boolean) => void;
  onPreviewOpen?: () => void;
  onPreviewClose?: (windowId: string) => void;
}

export function MenuBar({
  onOpenSettings,
  onOpenWifiSettings,
  onOpenFocusSettings,
  onOpenAbout,
  onSleep,
  onRestart,
  onShutdown,
  onLockScreen,
  onLogout,
  onOpenMessagesConversation,
  onOpenPodcastNotification,
  finderViewMode = "list",
  onFinderViewModeChange,
  finderStatusBarVisible = false,
  onFinderStatusBarVisibleChange,
  finderPathBarVisible = false,
  onFinderPathBarVisibleChange,
  calendarWeekNumbersVisible = false,
  onCalendarWeekNumbersVisibleChange,
  weatherTemperatureUnit = "fahrenheit",
  onWeatherTemperatureUnitChange,
  onTextEditNew,
  onTextEditOpen,
  onTextEditClose,
  onTextEditSave,
  onTextEditDuplicate,
  onTextEditRename,
  onTextEditWrapToPageChange,
  onPreviewOpen,
  onPreviewClose,
}: MenuBarProps) {
  const fileMenuActions = useFileMenuActions();
  const {
    focusMode,
    menuBarBackground,
    clockShowDate,
    clockShowDayOfWeek,
    clockStyle,
    clockShowAmPm,
    clockFlashSeparators,
    clockShowSeconds,
  } = useSystemSettings();
  const { getFocusedAppId, closeApp, state, setMenuOpen } = useWindowManager();
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [datePrefix, setDatePrefix] = useState<string>("");
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
  const [textEditRenameOpen, setTextEditRenameOpen] = useState(false);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const [hasLoadedLowPowerMode, setHasLoadedLowPowerMode] = useState(false);

  useEffect(() => {
    setLowPowerMode(window.localStorage.getItem(LOW_POWER_MODE_STORAGE_KEY) === "true");
    setHasLoadedLowPowerMode(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedLowPowerMode) return;
    window.localStorage.setItem(LOW_POWER_MODE_STORAGE_KEY, String(lowPowerMode));
  }, [hasLoadedLowPowerMode, lowPowerMode]);

  // Sync menu open state to window context (used to prevent window focus when menu is open)
  useEffect(() => {
    setMenuOpen(!!openMenu);
  }, [openMenu, setMenuOpen]);

  const focusedAppId = getFocusedAppId(); // This returns the base app ID (e.g., "textedit")
  const focusedApp = focusedAppId ? getAppById(focusedAppId) : null;
  const focusedWindowId = state.focusedWindowId; // This is the actual window ID (e.g., "textedit-0")
  const focusedTextEditFilePath = focusedAppId === "textedit" && focusedWindowId
    ? String(state.windows[focusedWindowId]?.metadata?.filePath ?? "")
    : "";
  const focusedTextEditFileName = focusedTextEditFilePath.split("/").pop() || "Untitled.txt";
  const focusedTextEditWrapToPage = focusedAppId === "textedit" && focusedWindowId
    ? state.windows[focusedWindowId]?.metadata?.wrapToPage === true
    : false;
  const activeFocus =
    focusMode === "off" ? null : FOCUS_STATUS_CONFIG[focusMode];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateParts = [
        clockShowDayOfWeek
          ? now.toLocaleDateString("en-US", { weekday: "short" })
          : null,
        clockShowDate
          ? now.toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null,
      ].filter(Boolean);
      const timeParts = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        second: clockShowSeconds ? "2-digit" : undefined,
        hour12: true,
      }).formatToParts(now);
      let time = timeParts
        .filter((part) => clockShowAmPm || part.type !== "dayPeriod")
        .map((part) => part.value)
        .join("")
        .trim();

      if (
        clockStyle === "digital" &&
        clockFlashSeparators &&
        Math.floor(now.getMilliseconds() / 500) % 2
      ) {
        time = time.replaceAll(":", " ");
      }

      const prefix = dateParts.join(" ");
      setCurrentDate(now);
      setDatePrefix(prefix);
      setCurrentTime(prefix ? `${prefix} ${time}` : time);
    };

    updateTime();
    const refreshMs = getMenuBarClockRefreshMs({
      clockStyle,
      flashSeparators: clockFlashSeparators,
      showSeconds: clockShowSeconds,
    });
    let timeout: ReturnType<typeof setTimeout>;

    const scheduleNextUpdate = () => {
      timeout = setTimeout(() => {
        updateTime();
        scheduleNextUpdate();
      }, getDelayUntilNextClockRefresh(Date.now(), refreshMs));
    };

    scheduleNextUpdate();
    return () => clearTimeout(timeout);
  }, [
    clockFlashSeparators,
    clockShowAmPm,
    clockShowDate,
    clockShowDayOfWeek,
    clockShowSeconds,
    clockStyle,
  ]);

  // Helper to quit the focused app (quits all windows for multi-window apps)
  // Storage is cleared automatically by closeApp → clearAppState
  const quitFocusedApp = useCallback(() => {
    if (!focusedAppId) return;
    closeApp(focusedAppId);
  }, [focusedAppId, closeApp]);

  // Q shortcut to quit the focused app (closes all windows for multi-window apps)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Q key when not in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Finder can be closed but not quit
      if (e.key.toLowerCase() === "q" && focusedWindowId && focusedAppId !== "finder") {
        e.preventDefault();
        quitFocusedApp();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [focusedWindowId, focusedAppId, quitFocusedApp]);

  const toggleMenu = (menu: OpenMenu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const closeMenu = useCallback(() => setOpenMenu(null), []);

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 h-7 flex items-center justify-between px-4 z-[70] select-none",
        menuBarBackground &&
          "border-b border-white/10 bg-white/55 backdrop-blur-md dark:bg-black/55"
      )}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => toggleMenu("apple")}
          className={cn(
            "flex items-center justify-center w-6 h-5 -ml-1 rounded transition-colors",
            openMenu === "apple" ? "bg-blue-500" : "can-hover:hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon
            icon={faApple as IconProp}
            className={cn(
              "w-4 h-4",
              openMenu === "apple" ? "text-white" : "text-black dark:text-white"
            )}
          />
        </button>
        <div data-testid="menu-bar-app-commands" className="flex items-center gap-1">
          <button
            onClick={() => toggleMenu("appMenu")}
            className={cn(
              "text-sm font-semibold px-2 py-0.5 rounded transition-colors",
              openMenu === "appMenu"
                ? "bg-blue-500 text-white"
                : "text-black dark:text-white can-hover:hover:bg-white/10"
            )}
          >
            {focusedApp?.menuBarTitle || "Finder"}
          </button>
          {(focusedAppId === "notes" || focusedAppId === "messages") && (
            <button
              onClick={() => toggleMenu("fileMenu")}
              className={cn(
                "text-sm px-2 py-0.5 rounded transition-colors",
                openMenu === "fileMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black dark:text-white can-hover:hover:bg-white/10"
              )}
            >
              File
            </button>
          )}
          {focusedAppId === "textedit" && (
            <button
              onClick={() => toggleMenu("textEditFileMenu")}
              className={cn(
                "rounded px-2 py-0.5 text-sm transition-colors",
                openMenu === "textEditFileMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black can-hover:hover:bg-white/10 dark:text-white"
              )}
            >
              File
            </button>
          )}
          {focusedAppId === "preview" && (
            <button
              onClick={() => toggleMenu("previewFileMenu")}
              className={cn(
                "rounded px-2 py-0.5 text-sm transition-colors",
                openMenu === "previewFileMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black can-hover:hover:bg-white/10 dark:text-white"
              )}
            >
              File
            </button>
          )}
          {focusedAppId === "finder" && (
            <button
              onClick={() => toggleMenu("finderViewMenu")}
              className={cn(
                "text-sm px-2 py-0.5 rounded transition-colors",
                openMenu === "finderViewMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black dark:text-white can-hover:hover:bg-white/10"
              )}
            >
              View
            </button>
          )}
          {focusedAppId === "calendar" && (
            <button
              onClick={() => toggleMenu("calendarViewMenu")}
              className={cn(
                "rounded px-2 py-0.5 text-sm transition-colors",
                openMenu === "calendarViewMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black can-hover:hover:bg-white/10 dark:text-white"
              )}
            >
              View
            </button>
          )}
          {focusedAppId === "weather" && (
            <button
              onClick={() => toggleMenu("weatherViewMenu")}
              className={cn(
                "rounded px-2 py-0.5 text-sm transition-colors",
                openMenu === "weatherViewMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black can-hover:hover:bg-white/10 dark:text-white"
              )}
            >
              View
            </button>
          )}
          {focusedAppId === "textedit" && (
            <button
              onClick={() => toggleMenu("textEditEditMenu")}
              className={cn(
                "rounded px-2 py-0.5 text-sm transition-colors",
                openMenu === "textEditEditMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black can-hover:hover:bg-white/10 dark:text-white"
              )}
            >
              Edit
            </button>
          )}
          {focusedAppId === "textedit" && (
            <button
              onClick={() => toggleMenu("textEditFormatMenu")}
              className={cn(
                "rounded px-2 py-0.5 text-sm transition-colors",
                openMenu === "textEditFormatMenu"
                  ? "bg-blue-500 text-white"
                  : "text-black can-hover:hover:bg-white/10 dark:text-white"
              )}
            >
              Format
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        {/* Battery */}
        <button
          onClick={() => toggleMenu("battery")}
          aria-label={`Battery, 97%${lowPowerMode ? ", Low Power Mode on" : ""}`}
          className={cn(
            "flex items-center justify-center w-7 h-5 rounded transition-colors",
            openMenu === "battery" ? "bg-white/30 dark:bg-white/20" : "can-hover:hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon
            icon={faBatteryFull}
            className={cn(
              "h-3.5 w-5 transition-colors",
              lowPowerMode ? "text-yellow-500" : "text-black dark:text-white"
            )}
          />
        </button>

        {/* Wi-Fi */}
        <button
          onClick={() => toggleMenu("wifi")}
          className={cn(
            "flex items-center justify-center w-7 h-5 rounded transition-colors",
            openMenu === "wifi" ? "bg-white/30 dark:bg-white/20" : "can-hover:hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon icon={faWifi} className="w-4 h-4 text-black dark:text-white" />
        </button>

        {/* Active Focus status */}
        {activeFocus && (
          <button
            onClick={() => toggleMenu("focusMenu")}
            aria-label={`${activeFocus.name} Focus, on`}
            title={`${activeFocus.name} Focus`}
            className={cn(
              "flex h-5 w-7 items-center justify-center rounded transition-colors",
              openMenu === "focusMenu"
                ? "bg-white/30 dark:bg-white/20"
                : "can-hover:hover:bg-white/10"
            )}
          >
            <activeFocus.icon
              aria-hidden="true"
              className="h-4 w-4 text-black dark:text-white"
            />
          </button>
        )}

        {/* Control Center */}
        <button
          onClick={() => toggleMenu("controlCenter")}
          aria-label="Control Center"
          className={cn(
            "flex items-center justify-center w-7 h-5 rounded transition-colors",
            openMenu === "controlCenter" ? "bg-white/30 dark:bg-white/20" : "can-hover:hover:bg-white/10"
          )}
        >
          <FontAwesomeIcon icon={faSliders} className="w-4 h-4 text-black dark:text-white" />
        </button>

        {/* Date/Time */}
        <button
          onClick={() => toggleMenu("notificationCenter")}
          aria-label={currentDate ? currentDate.toLocaleString("en-US") : "Date and time"}
          data-testid="menu-bar-clock"
          className={cn(
            "flex items-center gap-1.5 text-sm px-2 py-0.5 rounded transition-colors ml-1",
            openMenu === "notificationCenter"
              ? "bg-white/30 dark:bg-white/20"
              : "can-hover:hover:bg-white/10",
            "text-black dark:text-white"
          )}
        >
          {clockStyle === "analog" && currentDate ? (
            <>
              {datePrefix && <span>{datePrefix}</span>}
              <AnalogClock date={currentDate} />
            </>
          ) : (
            currentTime
          )}
        </button>
      </div>

      {/* Menus */}
      <AppleMenu
        isOpen={openMenu === "apple"}
        onClose={closeMenu}
        onAboutThisMac={() => onOpenAbout?.()}
        onSystemSettings={() => onOpenSettings?.()}
        onSleep={() => onSleep?.()}
        onRestart={() => onRestart?.()}
        onShutdown={() => onShutdown?.()}
        onLockScreen={() => onLockScreen?.()}
        onLogout={() => onLogout?.()}
      />

      <BatteryMenu
        isOpen={openMenu === "battery"}
        onClose={closeMenu}
        onOpenSettings={onOpenSettings}
        lowPowerMode={lowPowerMode}
        onLowPowerModeChange={setLowPowerMode}
      />

      <WifiMenu
        isOpen={openMenu === "wifi"}
        onClose={closeMenu}
        onOpenWifiSettings={onOpenWifiSettings}
      />

      <FocusMenu
        isOpen={openMenu === "focusMenu"}
        onClose={closeMenu}
        onOpenSettings={onOpenFocusSettings}
      />

      <ControlCenterMenu
        isOpen={openMenu === "controlCenter"}
        onClose={closeMenu}
        onOpenSettings={onOpenSettings}
      />

      <AppMenu
        isOpen={openMenu === "appMenu"}
        onClose={closeMenu}
        appId={focusedAppId || "finder"}
        appName={focusedApp?.menuBarTitle || "Finder"}
        onAbout={() => setAboutDialogOpen(true)}
        onQuit={quitFocusedApp}
      />

      <FileMenu
        isOpen={openMenu === "fileMenu"}
        onClose={closeMenu}
        appId={focusedAppId || ""}
        onNewNote={fileMenuActions.onNewNote}
        onPinNote={fileMenuActions.onPinNote}
        onDeleteNote={fileMenuActions.onDeleteNote}
        noteIsPinned={fileMenuActions.noteIsPinned}
        onNewChat={fileMenuActions.onNewChat}
        onPinChat={fileMenuActions.onPinChat}
        onHideAlerts={fileMenuActions.onHideAlerts}
        onDeleteChat={fileMenuActions.onDeleteChat}
        chatIsPinned={fileMenuActions.chatIsPinned}
        hideAlertsActive={fileMenuActions.hideAlertsActive}
      />

      <FinderViewMenu
        isOpen={openMenu === "finderViewMenu"}
        onClose={closeMenu}
        viewMode={finderViewMode}
        onViewModeChange={(mode) => onFinderViewModeChange?.(mode)}
        statusBarVisible={finderStatusBarVisible}
        onStatusBarVisibleChange={(visible) => onFinderStatusBarVisibleChange?.(visible)}
        pathBarVisible={finderPathBarVisible}
        onPathBarVisibleChange={(visible) => onFinderPathBarVisibleChange?.(visible)}
      />

      <CalendarViewMenu
        isOpen={openMenu === "calendarViewMenu"}
        onClose={closeMenu}
        weekNumbersVisible={calendarWeekNumbersVisible}
        onWeekNumbersVisibleChange={(visible) =>
          onCalendarWeekNumbersVisibleChange?.(visible)
        }
      />

      <WeatherViewMenu
        isOpen={openMenu === "weatherViewMenu"}
        onClose={closeMenu}
        temperatureUnit={weatherTemperatureUnit}
        onTemperatureUnitChange={(unit) =>
          onWeatherTemperatureUnitChange?.(unit)
        }
      />

      <TextEditEditMenu
        isOpen={openMenu === "textEditEditMenu"}
        onClose={closeMenu}
        onFind={() => {
          window.dispatchEvent(
            new CustomEvent(TEXTEDIT_OPEN_FIND_EVENT, {
              detail: { windowId: focusedWindowId },
            })
          );
        }}
      />

      <TextEditFormatMenu
        isOpen={openMenu === "textEditFormatMenu"}
        onClose={closeMenu}
        wrapToPage={focusedTextEditWrapToPage}
        onWrapToPageChange={(wrapToPage) => {
          if (focusedWindowId) {
            onTextEditWrapToPageChange?.(focusedWindowId, wrapToPage);
          }
        }}
      />

      <TextEditFileMenu
        isOpen={openMenu === "textEditFileMenu"}
        onClose={closeMenu}
        onNew={() => onTextEditNew?.()}
        onOpen={() => onTextEditOpen?.()}
        onCloseDocument={() => focusedWindowId && onTextEditClose?.(focusedWindowId)}
        onSave={() => focusedWindowId && onTextEditSave?.(focusedWindowId)}
        onDuplicate={() => focusedWindowId && onTextEditDuplicate?.(focusedWindowId)}
        onRename={() => setTextEditRenameOpen(true)}
        renameDisabled={focusedTextEditFilePath.startsWith("/Users/alanagoyal/Projects/")}
      />

      <PreviewFileMenu
        isOpen={openMenu === "previewFileMenu"}
        onClose={closeMenu}
        onOpen={() => onPreviewOpen?.()}
        onCloseWindow={() => focusedWindowId && onPreviewClose?.(focusedWindowId)}
      />

      <TextEditRenameDialog
        isOpen={textEditRenameOpen}
        initialName={focusedTextEditFileName}
        onClose={() => setTextEditRenameOpen(false)}
        onRename={(fileName) => {
          if (!focusedWindowId) return "No document is focused.";
          return onTextEditRename?.(focusedWindowId, fileName) ?? null;
        }}
      />

      <NotificationCenter
        isOpen={openMenu === "notificationCenter"}
        onClose={closeMenu}
        onOpenMessagesConversation={onOpenMessagesConversation}
        onOpenPodcastNotification={onOpenPodcastNotification}
      />

      <AboutDialog
        isOpen={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
        appName={focusedApp?.menuBarTitle || "Finder"}
        appId={focusedAppId || "finder"}
      />
    </div>
  );
}
