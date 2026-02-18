/**
 * Update the browser URL bar without triggering Next.js App Router re-renders.
 *
 * Next.js 16 patches pushState/replaceState — unless the state includes
 * `__NA: true`, every call dispatches ACTION_RESTORE which invalidates the
 * router cache and causes a full re-render cascade (visible as a white flash).
 */
export function setUrl(url: string) {
  window.history.replaceState({ __NA: true }, "", url);
}

export function pushUrl(url: string) {
  window.history.pushState({ __NA: true }, "", url);
}
