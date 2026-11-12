import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createElement, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { JSDOM } from "jsdom";
import { DOMSerializer } from "@tiptap/pm/model";
import { mergeAttributes, type Editor } from "@tiptap/core";
import { MessageInput } from "../components/apps/messages/message-input";

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost",
  pretendToBeVisual: true,
});
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();

before(() => {
  // jsdom has no layout; ProseMirror reads range bounds when restoring selection.
  dom.window.Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  dom.window.Range.prototype.getBoundingClientRect = () => new dom.window.DOMRect();
  const globals = {
    window: dom.window,
    document: dom.window.document,
    navigator: dom.window.navigator,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    Node: dom.window.Node,
    MutationObserver: dom.window.MutationObserver,
    getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
    requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
    cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
    IS_REACT_ACT_ENVIRONMENT: true,
  };
  for (const [key, value] of Object.entries(globals)) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
});

after(() => {
  for (const [key, descriptor] of originalGlobals) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  dom.window.close();
});

async function flush() {
  await act(async () => { await new Promise((resolve) => setTimeout(resolve, 30)); });
}

async function mountComposer(isMobileView = false) {
  const container = document.createElement("div");
  document.body.append(container);
  const root: Root = createRoot(container);
  let replaceMessage!: (message: string) => void;
  let changes = 0;
  let sends = 0;
  function Composer() {
    const [message, setMessage] = useState("");
    replaceMessage = setMessage;
    return createElement(MessageInput, {
      message,
      setMessage: (next) => { changes++; setMessage(next); },
      handleSend: () => { sends++; setMessage(""); return false; },
      disabled: false,
      isMobileView,
      isNewChat: true,
      recipients: [{ id: "ada", name: "Ada Lovelace" }],
    });
  }
  await act(async () => { root.render(createElement(Composer)); });
  await flush();
  const element = container.querySelector<HTMLElement & { editor: Editor }>(".tiptap");
  assert.ok(element?.editor);
  return {
    container, element, editor: element.editor,
    changes: () => changes,
    sends: () => sends,
    replaceMessage: async (message: string) => {
      await act(async () => { replaceMessage(message); });
      await flush();
    },
    dispose: async () => {
      await act(async () => { root.unmount(); });
      await flush();
      container.remove();
    },
  };
}

test("composer reflects typing on mobile and sends without feeding resets back into onUpdate", async () => {
  const c = await mountComposer(true);
  try {
    assert.equal(c.container.querySelector('[aria-label="Send message"]'), null);
    await act(async () => { c.editor.commands.insertContent("Hello 😀"); });
    await flush();
    const send = c.container.querySelector<HTMLButtonElement>('[aria-label="Send message"]');
    assert.ok(send);
    assert.equal(send.disabled, false);
    assert.equal(c.editor.getText(), "Hello 😀");
    const changesBeforeReset = c.changes();
    await act(async () => { send.click(); });
    await flush();
    assert.equal(c.sends(), 1);
    assert.equal(c.editor.getText(), "");
    assert.equal(c.changes(), changesBeforeReset);
    assert.equal(c.container.querySelector('[aria-label="Send message"]'), null);
    await c.replaceMessage("<p>Restored draft</p>");
    assert.equal(c.editor.getText(), "Restored draft");
    assert.equal(c.changes(), changesBeforeReset);
  } finally { await c.dispose(); }
});

test("composer preserves mentions, animation completion, emoji, undo and redo", async () => {
  const c = await mountComposer();
  try {
    await act(async () => { c.editor.commands.insertContent("@Ad"); });
    await flush();
    await act(async () => { c.editor.commands.insertContent("a"); });
    await flush();
    const mention = c.element.querySelector<HTMLElement>('[data-type="mention"]');
    assert.ok(mention);
    assert.equal(mention.dataset.id, "ada");
    assert.equal(mention.textContent, "Ada");
    assert.equal(mention.hasAttribute("onanimationend"), false);
    const animation = new dom.window.Event("animationend", { bubbles: true });
    Object.defineProperty(animation, "animationName", { value: "shimmer" });
    mention.dispatchEvent(animation);
    assert.equal(mention.classList.contains("shimmer-done"), true);
    await act(async () => { c.editor.commands.insertContent(" 😀"); });
    await flush();
    assert.match(c.editor.getText(), /😀/);
    const composed = c.editor.getHTML();
    await act(async () => { c.editor.commands.undo(); });
    await flush();
    await act(async () => { c.editor.commands.redo(); });
    await flush();
    assert.equal(c.editor.getHTML(), composed);
  } finally { await c.dispose(); }
});

test("composer preserves Shift+Enter line breaks, Enter send, and the v2 formatting schema", async () => {
  const c = await mountComposer();
  try {
    await act(async () => { c.editor.commands.insertContent("One"); });
    await flush();
    await act(async () => {
      c.element.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", shiftKey: true, bubbles: true, cancelable: true }));
    });
    await flush();
    assert.match(c.editor.getHTML(), /<br>/);
    assert.equal(c.sends(), 0);
    await act(async () => {
      c.element.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    });
    await flush();
    assert.equal(c.sends(), 1);
    assert.equal(c.editor.getText(), "");
    assert.equal(c.editor.schema.marks.link, undefined);
    assert.equal(c.editor.schema.marks.underline, undefined);
  } finally { await c.dispose(); }
});

test("composer pastes supported formatting without enabling v3 link or underline marks", async () => {
  const c = await mountComposer();
  try {
    await act(async () => {
      c.editor.view.pasteHTML(
        '<p><strong>Bold</strong> <a href="https://example.com">link</a> <u>underlined</u></p>',
        new dom.window.Event("paste", { bubbles: true }) as ClipboardEvent,
      );
    });
    await flush();
    assert.equal(c.editor.getText(), "Bold link underlined");
    assert.match(c.editor.getHTML(), /<strong>Bold<\/strong>/);
    assert.doesNotMatch(c.editor.getHTML(), /<a |<u>/);
    await act(async () => { c.editor.commands.focus(); });
    await flush();
    assert.equal(document.activeElement, c.element);
    await act(async () => {
      c.element.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    await flush();
    assert.notEqual(document.activeElement, c.element);
  } finally { await c.dispose(); }
});

test("patched mergeAttributes does not serialize executable inherited attributes", () => {
  const input = JSON.parse('{"__proto__":{"src":"invalid:","onerror":"globalThis.compromised=true"},"class":"mention-node"}');
  const attributes = mergeAttributes(input);
  const rendered = DOMSerializer.renderSpec(document, ["span", attributes, "Ada"]).dom as HTMLElement;
  assert.equal(rendered.getAttribute("class"), "mention-node");
  assert.equal(rendered.hasAttribute("onerror"), false);
  assert.equal(rendered.hasAttribute("src"), false);
});
