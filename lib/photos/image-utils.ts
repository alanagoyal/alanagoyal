/**
 * Transform a Supabase storage URL to use image transformations.
 * Changes /object/ to /render/image/ and adds size parameters.
 *
 * @param url - Original Supabase public URL
 * @param width - Desired width in pixels
 * @param quality - Image quality (1-100), defaults to 80
 * @returns Transformed URL that serves an optimized image
 */
export function getOptimizedImageUrl(
  url: string,
  width: number,
  quality: number = 80
): string {
  // Transform Supabase storage URL to use image transformation API
  // From: /storage/v1/object/public/...
  // To:   /storage/v1/render/image/public/...
  const transformedUrl = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  // Add transformation parameters
  const separator = transformedUrl.includes("?") ? "&" : "?";
  return `${transformedUrl}${separator}width=${width}&resize=contain&quality=${quality}`;
}

/**
 * Get thumbnail URL for grid display
 */
export function getThumbnailUrl(url: string): string {
  return getOptimizedImageUrl(url, 400, 75);
}

/**
 * Get viewer URL for full photo display
 */
export function getViewerUrl(url: string): string {
  return getOptimizedImageUrl(url, 1600, 85);
}
