import assert from "node:assert/strict";
import test from "node:test";
import { getPdfProxyUrl, getPreviewMetadataFromPath } from "../../lib/preview-utils";

test("getPdfProxyUrl wraps external URLs once", () => {
  const first = getPdfProxyUrl("https://example.com/report.pdf");
  assert.equal(
    first,
    "/api/preview/pdf?url=https%3A%2F%2Fexample.com%2Freport.pdf"
  );

  const alreadyWrapped = getPdfProxyUrl(first);
  assert.equal(alreadyWrapped, first);
});

test("getPreviewMetadataFromPath returns github raw URL for project images", () => {
  const data = getPreviewMetadataFromPath(
    "/Users/alanagoyal/Projects/demo-repo/assets/logo.png"
  );
  assert.deepEqual(data, {
    fileUrl:
      "https://raw.githubusercontent.com/alanagoyal/demo-repo/main/assets/logo.png",
    fileType: "image",
  });
});

test("getPreviewMetadataFromPath returns documents URL for local pdfs", () => {
  const data = getPreviewMetadataFromPath(
    "/Users/alanagoyal/Documents/Q4 Results.pdf"
  );
  assert.deepEqual(data, {
    fileUrl: "/documents/Q4%20Results.pdf",
    fileType: "pdf",
  });
});

test("getPreviewMetadataFromPath returns null for unsupported file types", () => {
  assert.equal(
    getPreviewMetadataFromPath("/Users/alanagoyal/Documents/notes.txt"),
    null
  );
});
