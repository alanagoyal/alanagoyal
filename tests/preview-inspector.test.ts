import assert from "node:assert/strict";
import test from "node:test";
import {
  formatPreviewDimensions,
  formatPreviewFileSize,
  getPreviewFileKind,
  getPreviewFileLocation,
} from "../lib/preview-inspector";

test("describes supported Preview document kinds", () => {
  assert.equal(getPreviewFileKind("portrait.jpg", "image"), "JPEG image");
  assert.equal(getPreviewFileKind("diagram.svg", "image"), "SVG image");
  assert.equal(getPreviewFileKind("statement.pdf", "pdf"), "PDF document");
});

test("formats file sizes with compact native-style units", () => {
  assert.equal(formatPreviewFileSize(829), "829 bytes");
  assert.equal(formatPreviewFileSize(8_290), "8.3 KB");
  assert.equal(formatPreviewFileSize(82_900), "83 KB");
  assert.equal(formatPreviewFileSize(2_420_000), "2.4 MB");
  assert.equal(formatPreviewFileSize(null), "Unavailable");
});

test("formats image dimensions and containing folders", () => {
  assert.equal(formatPreviewDimensions(2400, 1600), "2,400 × 1,600 pixels");
  assert.equal(
    getPreviewFileLocation("/Users/alanagoyal/Desktop/portrait.jpg"),
    "/Users/alanagoyal/Desktop"
  );
});
