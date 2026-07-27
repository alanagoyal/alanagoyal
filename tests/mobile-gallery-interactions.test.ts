import assert from "node:assert/strict";
import test from "node:test";
import {
  canStartMobileNoteLongPress,
  didMobileNoteLongPressMove,
  isContextMenuKeyboardShortcut,
} from "../lib/notes/mobile-gallery-interactions";

test("starts note long presses only for touch-style pointers", () => {
  assert.equal(canStartMobileNoteLongPress("touch"), true);
  assert.equal(canStartMobileNoteLongPress("pen"), true);
  assert.equal(canStartMobileNoteLongPress("mouse"), false);
});

test("cancels a note long press after meaningful movement", () => {
  const origin = { x: 100, y: 100 };

  assert.equal(didMobileNoteLongPressMove(origin, { x: 110, y: 90 }), false);
  assert.equal(didMobileNoteLongPressMove(origin, { x: 111, y: 100 }), true);
  assert.equal(didMobileNoteLongPressMove(origin, { x: 100, y: 111 }), true);
});

test("recognizes keyboard context-menu shortcuts", () => {
  assert.equal(isContextMenuKeyboardShortcut("ContextMenu", false), true);
  assert.equal(isContextMenuKeyboardShortcut("F10", true), true);
  assert.equal(isContextMenuKeyboardShortcut("F10", false), false);
  assert.equal(isContextMenuKeyboardShortcut("Enter", false), false);
});
