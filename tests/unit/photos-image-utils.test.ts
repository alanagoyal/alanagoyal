import assert from "node:assert/strict";
import test from "node:test";
import {
  getOptimizedImageUrl,
  getThumbnailUrl,
  getViewerUrl,
} from "../../lib/photos/image-utils";

const baseUrl =
  "https://xyz.supabase.co/storage/v1/object/public/photos/2025/01/cat.jpg";

test("getOptimizedImageUrl converts object endpoint to render endpoint", () => {
  const optimized = getOptimizedImageUrl(baseUrl, 600, 90);
  assert.equal(
    optimized,
    "https://xyz.supabase.co/storage/v1/render/image/public/photos/2025/01/cat.jpg?width=600&resize=contain&quality=90"
  );
});

test("getOptimizedImageUrl appends with ampersand when query params exist", () => {
  const withQuery = `${baseUrl}?download=1`;
  const optimized = getOptimizedImageUrl(withQuery, 400);
  assert.equal(
    optimized,
    "https://xyz.supabase.co/storage/v1/render/image/public/photos/2025/01/cat.jpg?download=1&width=400&resize=contain&quality=80"
  );
});

test("thumbnail and viewer helpers use expected presets", () => {
  assert.equal(
    getThumbnailUrl(baseUrl),
    "https://xyz.supabase.co/storage/v1/render/image/public/photos/2025/01/cat.jpg?width=400&resize=contain&quality=75"
  );
  assert.equal(
    getViewerUrl(baseUrl),
    "https://xyz.supabase.co/storage/v1/render/image/public/photos/2025/01/cat.jpg?width=1600&resize=contain&quality=85"
  );
});
