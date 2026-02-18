/**
 * Update the browser URL bar without triggering Next.js App Router re-renders.
 *
 * Next.js 16 patches pushState/replaceState — unless the state includes
 * `__NA: true`, every call dispatches ACTION_RESTORE which invalidates the
 * router cache and causes a full re-render cascade (visible as a white flash).
 */
export const APP_SHELL_URL_CHANGE_EVENT = "app-shell-url-change";
const HISTORY_PATCH_FLAG = "__appShellHistoryPatched";

function dispatchUrlChangeEvent() {
  window.dispatchEvent(new Event(APP_SHELL_URL_CHANGE_EVENT));
}

export function installHistorySyncEvents() {
  if (typeof window === "undefined") return;

  const patchedWindow = window as Window & {
    [HISTORY_PATCH_FLAG]?: boolean;
  };
  if (patchedWindow[HISTORY_PATCH_FLAG]) return;

  const originalPushState = window.history.pushState.bind(window.history);
  const originalReplaceState = window.history.replaceState.bind(window.history);

  window.history.pushState = function pushState(
    data: unknown,
    unused: string,
    url?: string | URL | null
  ): void {
    originalPushState(data, unused, url);
    dispatchUrlChangeEvent();
  };

  window.history.replaceState = function replaceState(
    data: unknown,
    unused: string,
    url?: string | URL | null
  ): void {
    originalReplaceState(data, unused, url);
    dispatchUrlChangeEvent();
  };

  patchedWindow[HISTORY_PATCH_FLAG] = true;
}

export function setUrl(url: string) {
  installHistorySyncEvents();
  window.history.replaceState({ __NA: true }, "", url);
}

export function pushUrl(url: string) {
  installHistorySyncEvents();
  window.history.pushState({ __NA: true }, "", url);
}
