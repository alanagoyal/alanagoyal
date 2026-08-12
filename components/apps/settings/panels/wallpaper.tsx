"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Check, ImagePlus, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { getThumbnailPath, getWallpaperPath, OS_VERSIONS } from "@/lib/os-versions";
import { getOptimizedImageUrl } from "@/lib/photos/image-utils";
import { usePhotos } from "@/lib/photos/use-photos";
import { useSystemSettings } from "@/lib/system-settings-context";

const THEME_WALLPAPERS = [...OS_VERSIONS].reverse();

export function WallpaperPanel() {
  const { osVersionId, wallpaperUrl, setWallpaperUrl } = useSystemSettings();
  const [isPhotoPickerOpen, setIsPhotoPickerOpen] = useState(false);
  const [dialogContainer, setDialogContainer] = useState<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { photos, loading, error } = usePhotos({ enabled: isPhotoPickerOpen });

  useEffect(() => {
    setDialogContainer(panelRef.current?.closest<HTMLElement>("[data-app='settings']") ?? null);
  }, []);

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
      ref={panelRef}
      className="mx-auto w-full max-w-5xl space-y-8 p-6 pb-10"
      data-testid="settings-wallpaper-panel"
    >
      <section className="grid grid-cols-[minmax(220px,0.9fr)_minmax(250px,1.1fr)] items-center gap-5">
        <div className="relative aspect-[8/5] overflow-hidden rounded-xl border border-border/70 bg-muted shadow-sm">
          <Image
            src={activeWallpaperUrl}
            alt="Current wallpaper"
            fill
            priority
            sizes="420px"
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="rounded-2xl bg-muted/50 p-5">
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
        <div className="flex gap-4 overflow-x-auto pb-3">
          {THEME_WALLPAPERS.map((os) => {
            const isSelected = selectedThemeId === os.id;
            return (
              <button
                key={os.id}
                type="button"
                aria-label={`Use ${os.name} wallpaper`}
                aria-pressed={isSelected}
                onClick={() => selectThemeWallpaper(os.id)}
                className="group w-[140px] shrink-0 text-left focus-visible:outline-none"
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
                    sizes="190px"
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
            aria-haspopup="dialog"
            aria-controls="wallpaper-photo-picker"
            onClick={() => setIsPhotoPickerOpen(true)}
            className="flex aspect-[4/3] w-[150px] flex-col items-center justify-center gap-2 rounded-lg border border-border/70 bg-muted/60 text-muted-foreground transition-colors can-hover:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7CFF]"
          >
            <ImagePlus className="h-8 w-8" />
            <span className="text-sm font-medium">Add from Photos…</span>
          </button>
        </div>
      </section>

      <Dialog.Root open={isPhotoPickerOpen} onOpenChange={setIsPhotoPickerOpen}>
        <Dialog.Portal container={dialogContainer ?? undefined}>
          <Dialog.Overlay className="absolute inset-0 z-[95] bg-black/35 backdrop-blur-[2px]" />
          <Dialog.Content
            id="wallpaper-photo-picker"
            data-testid="photo-wallpaper-picker"
            className="absolute left-1/2 top-1/2 z-[96] flex h-[min(440px,calc(100%_-_48px))] w-[min(560px,calc(100%_-_64px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[24px] border border-black/10 bg-background/95 shadow-2xl backdrop-blur-2xl focus:outline-none dark:border-white/15"
          >
            <div className="border-b border-border/70 px-6 py-4 text-center">
              <Dialog.Title className="text-lg font-semibold">Choose a Photo</Dialog.Title>
              <Dialog.Description className="sr-only">
                Select a photo to use as the desktop and lock-screen wallpaper.
              </Dialog.Description>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              {loading && (
                <div className="flex h-full min-h-40 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Loading Photos…
                </div>
              )}
              {!loading && error && (
                <p role="alert" className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted-foreground">
                  Photos couldn’t be loaded. Try again in a moment.
                </p>
              )}
              {!loading && !error && orderedPhotos.length === 0 && (
                <p className="flex h-full min-h-40 items-center justify-center text-center text-sm text-muted-foreground">
                  No photos available.
                </p>
              )}
              {!loading && !error && orderedPhotos.length > 0 && (
                <div className="grid grid-cols-5 gap-2">
                  {orderedPhotos.map((photo) => (
                    <button
                      key={photo.id}
                      type="button"
                      aria-label={`Use ${photo.filename} as wallpaper`}
                      onClick={() => {
                        setWallpaperUrl(photo.url);
                        setIsPhotoPickerOpen(false);
                      }}
                      className="relative aspect-square overflow-hidden rounded-lg bg-muted transition-shadow can-hover:hover:ring-2 can-hover:hover:ring-foreground/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7CFF]"
                    >
                      <Image
                        src={getOptimizedImageUrl(photo.url, 240, 70)}
                        alt=""
                        fill
                        sizes="120px"
                        className="object-cover transition-transform can-hover:hover:scale-105"
                        decoding="async"
                        loading="eager"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-border/70 px-5 py-3.5">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="rounded-full border border-border bg-muted/70 px-5 py-2 text-sm font-semibold transition-colors can-hover:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A7CFF]"
                >
                  Cancel
                </button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
