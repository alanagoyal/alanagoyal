// Registry connecting minimized windows to their Dock thumbnail containers.
// The Dock registers one container element per minimized window; the Window
// component portals its live tree into that container so the thumbnail is a
// scaled, live mirror of the real window, like macOS's minimized windows.

type ThumbnailListener = (container: HTMLElement | null) => void;

const containers = new Map<string, HTMLElement>();
const listeners = new Map<string, Set<ThumbnailListener>>();

export function registerDockThumbnail(
  windowId: string,
  container: HTMLElement
): void {
  containers.set(windowId, container);
  listeners.get(windowId)?.forEach((listener) => listener(container));
}

export function unregisterDockThumbnail(
  windowId: string,
  container: HTMLElement
): void {
  // Ignore stale detach notifications when a different container already
  // registered for the same window (remounts detach the old ref first).
  if (containers.get(windowId) !== container) return;
  containers.delete(windowId);
  listeners.get(windowId)?.forEach((listener) => listener(null));
}

export function getDockThumbnailContainer(
  windowId: string
): HTMLElement | null {
  return containers.get(windowId) ?? null;
}

export function subscribeDockThumbnail(
  windowId: string,
  listener: ThumbnailListener
): () => void {
  let windowListeners = listeners.get(windowId);
  if (!windowListeners) {
    windowListeners = new Set();
    listeners.set(windowId, windowListeners);
  }
  windowListeners.add(listener);
  const subscribed = windowListeners;
  return () => {
    subscribed.delete(listener);
    if (subscribed.size === 0) {
      listeners.delete(windowId);
    }
  };
}
