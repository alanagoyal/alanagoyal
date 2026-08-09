"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Check, ImagePlus, LoaderCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getThumbnailPath, getWallpaperPath, OS_VERSIONS } from "@/lib/os-versions";
import { usePhotos } from "@/lib/photos/use-photos";
import { useSystemSettings } from "@/lib/system-settings-context";

const THEME_WALLPAPERS = [...OS_VERSIONS].reverse();

interface WallpaperPanelProps {
  isMobile?: boolean;
}

export function WallpaperPanel({ isMobile = false }: WallpaperPanelProps) {
  const { osVersionId, wallpaperUrl, setWallpaperUrl } = useSystemSettings();
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const { photos, loading, error } = usePhotos({ enabled: isPhotoPickerOpen });

  const orderedPhotos = useMemo(
    () => [...photos].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)),
    [photos]
  );
  const selectedThemeId = THEME_WALLPAPERS.find((os) =>
    wallpaperUrl ? getWallpaperPath(os.id) === wallpaperUrl : os.id === osVersionId
  )?.id;
  const isPhotoWallpaper = Boolean(wallpaperUrl && !selectedThemeId);
  const activeWallpaperUrl = wallpaperUrl ?? getWallpaperPath(osVersionId);
  const activeTheme = THEME_WALLPAPERS.find((os) => os.id === selectedThemeId);

  const selectThemeWallpaper = (osId: string) => {
    setWallpaperUrl(osId === osVersionId ? null : getWallpaperPath(osId));
  };

  return (
    <div
      className={cn(
        "mx-auto w-full max-w-5xl",
        isMobile ? "space-y-7 px-4 py-5 pb-10" : "space-y-8 p-6 pb-10"
      )}
      data-testid="settings-wallpaper-panel"
    >
      {isMobile && <h1 className="text-2xl font-bold">Wallpaper</h1>}

      <section className={cn("grid gap-5", !isMobile && "grid-cols-[minmax(220px,0.9fr)_minmax(250px,1.1fr)] items-center")}>
        <div className="relative aspect-[8/5] overflow-hidden rounded-xl border border-border/70 bg-muted shadow-sm">
          <Image
            src={activeWallpaperUrl}
            alt="Current wallpaper"
            fill
            priority
            sizes={isMobile ? "calc(100vw - 32px)" : "420px"}
            className="object-cover"
            unoptimized
          />
        </div>
        <div className={cn("rounded-2xl bg-muted/50", isMobile ? "p-4" : "p-5")}>
          <p className="text-sm text-muted-foreground">Current wallpaper</p>
          <h2 className="mt-1 text-xl font-semibold">
            {isPhotoWallpaper ? "From Photos" : activeTheme?.name ?? "Theme wallpaper"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This wallpaper appears on both the desktop and lock screen.
          </p>
        </div>
      </section>

      <section aria-labelledby="theme-wallpapers-heading">
        <h2 id="theme-wallpapers-heading" className="mb-3 text-base font-semibold">
          Theme Wallpapers
        </h2>
        <div className={cn(isMobile ? "grid grid-cols-2 gap-x-3 gap-y-5" : "flex gap-4 overflow-x-auto pb-3")}>
          {THEME_WALLPAPERS.map((os) => {
            const isSelected = selectedThemeId === os.id;
            return (
              <button
                key={os.id}
                type="button"
                aria-label={`Use ${os.name} wallpaper`}
                aria-pressed={isSelected}
                onClick={() => selectThemeWallpaper(os.id)}
                className={cn("group text-left focus-visible:outline-none", !isMobile && "w-[140px] shrink-0")}
              >
                <span
                  className={cn(
                    "relative block aspect-[8/5] overflow-hidden rounded-lg border bg-muted transition-shadow",
                    isSelected
                      ? "border-[#0A7CFF] ring-2 ring-[#0A7CFF] ring-offset-2 ring-offset-background"
                      : "border-border/70 can-hover:group-hover:ring-2 can-hover:group-hover:ring-foreground/15"
                  )}
                >
                  <Image
                    src={getThumbnailPath(os.id)}
                    alt=""
                    fill
                    sizes={isMobile ? "42vw" : "190px"}
                    className="object-cover"
                    unoptimized
                  />
                  {isSelected && (
                    <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0A7CFF] shadow-sm">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </span>
                <span className="mt-2 block truncate text-center text-sm font-medium">{os.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="your-photos-heading">
        <h2 id="your-photos-heading" className="mb-3 text-base font-semibold">
          Your Photos
        </h2>
        <div className="flex flex-wrap items-start gap-3">
          {isPhotoWallpaper && (
            <div className="w-[150px]">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg border border-[#0A7CFF] ring-2 ring-[#0A7CFF] ring-offset-2 ring-offset-background">
                <Image
                  src={activeWallpaperUrl}
                  alt="Selected photo wallpaper"
                  fill
                  sizes="150px"
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute bottom-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0A7CFF] shadow-sm">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
              </div>
              <span className="mt-2 block text-center text-sm font-medium">From Photos</span>
            </div>
          )}

          <button
            type="button"
            aria-expanded={isPhotoPickerOpen}
            aria-controls="wallpaper-photo-picker"
            onClick={() => setIsPhotoPickerOpen((open) => !open)}
            className="flex aspect-[4/3] w-[150px] flex-col items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/60 text-muted-foreground transition-colors can-hover:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7CFF]"
          >
            {isPhotoPickerOpen ? <X className="h-7 w-7" /> : <ImagePlus className="h-8 w-8" />}
            <span className="text-sm font-medium">{isPhotoPickerOpen ? "Close Photos" : "Add from Photos…"}</span>
          </button>
        </div>

        {isPhotoPickerOpen && (
          <div
            id="wallpaper-photo-picker"
            data-testid="photo-wallpaper-picker"
            className="mt-4 rounded-xl border border-border/70 bg-muted/30 p-3"
          >
            {loading && (
              <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading Photos…
              </div>
            )}
            {!loading && error && (
              <p role="alert" className="py-10 text-center text-sm text-muted-foreground">
                Photos couldn’t be loaded. Try again in a moment.
              </p>
            )}
            {!loading && !error && orderedPhotos.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">No photos available.</p>
            )}
            {!loading && !error && orderedPhotos.length > 0 && (
              <div className={cn("grid max-h-[360px] gap-1.5 overflow-y-auto", isMobile ? "grid-cols-3" : "grid-cols-5")}>
                {orderedPhotos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    aria-label={`Use ${photo.filename} as wallpaper`}
                    onClick={() => {
                      setWallpaperUrl(photo.url);
                      setIsPhotoPickerOpen(false);
                    }}
                    className="relative aspect-square overflow-hidden rounded-md bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7CFF]"
                  >
                    <Image
                      src={photo.url}
                      alt=""
                      fill
                      sizes={isMobile ? "28vw" : "110px"}
                      className="object-cover transition-transform can-hover:hover:scale-105"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
