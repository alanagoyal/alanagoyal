import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  PHOTOS_HEADER_HEIGHT_CLASS_NAME,
  PHOTOS_HEADER_HEIGHT_PX,
  PhotosHeader,
} from "../components/apps/photos/header";

test("Photos headers reserve one fixed-height frame", () => {
  const markup = renderToStaticMarkup(
    createElement(PhotosHeader, { isMobileView: false }, "Library"),
  );

  assert.equal(PHOTOS_HEADER_HEIGHT_PX, 69);
  assert.equal(PHOTOS_HEADER_HEIGHT_CLASS_NAME, "h-[69px] min-h-[69px] shrink-0");
  assert.match(markup, /data-photos-header="true"/);
  assert.match(markup, /h-\[69px\]/);
  assert.match(markup, /min-h-\[69px\]/);
  assert.match(markup, /shrink-0/);
});
