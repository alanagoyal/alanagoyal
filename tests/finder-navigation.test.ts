import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement } from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { JSDOM } from "jsdom";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { FinderApp } from "../components/apps/finder/finder-app";
import { RecentsProvider } from "../lib/recents-context";
import { HOME_DIR } from "../lib/file-route-utils";

const dom = new JSDOM("<!doctype html><body></body>", { url: "http://localhost" });
const originals = new Map<string, PropertyDescriptor | undefined>();
before(() => {
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document,
    sessionStorage: dom.window.sessionStorage, localStorage: dom.window.localStorage,
    fetch: async () => new Response(JSON.stringify({ repos: [], files: [] })),
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
});
after(() => {
  for (const [key, descriptor] of originals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  dom.window.close();
});

test("Finder folder navigation and restored paths select the same sidebar section", async () => {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const router = { bfcacheId: "test", back() {}, forward() {}, refresh() {}, push() {}, replace() {}, prefetch: async () => {} };
  const render = async (initialPath?: string, key = "finder") => {
    await act(async () => {
      root.render(createElement(AppRouterContext.Provider, { value: router },
        // eslint-disable-next-line react/no-children-prop
        createElement(RecentsProvider, { children: createElement(FinderApp, { initialPath, key }) })));
    });
  };
  const buttons = () => [...container.querySelectorAll("button")];
  const assertSelected = (label: string) => {
    const selected = buttons().filter(button => button.className.includes("text-blue-500"));
    assert.deepEqual(selected.map(button => button.textContent), [label]);
  };
  try {
    await render(HOME_DIR);
    assertSelected("Recents"); // Preserve the existing fallback for Home.
    const documents = buttons().find(button => button.textContent?.startsWith("DocumentsFolder"));
    assert.ok(documents);
    await act(async () => { documents.dispatchEvent(new dom.window.MouseEvent("dblclick", { bubbles: true })); });
    assert.ok(container.textContent?.includes("hello.md"));
    assertSelected("Documents");

    // Remount without an explicit path: standalone Finder restores the last folder.
    await render(undefined, "restored");
    assertSelected("Documents");
    for (const [path, section] of [
      ["trash/unused-assets", "Trash"],
      [`${HOME_DIR}/Projects/example/nested`, "Projects"],
      [`${HOME_DIR}/Downloads`, "Downloads"],
    ]) {
      await render(path, path);
      assertSelected(section);
    }
  } finally {
    await act(async () => { root.unmount(); });
    container.remove();
  }
});
