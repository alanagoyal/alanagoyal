/**
 * Creates a circular cropped preview of a wallpaper image.
 * The circle has its radius equal to half the image height (center to top edge).
 * @param wallpaperUrl - The URL of the wallpaper image
 * @returns A promise that resolves to a data URL of the circular cropped image
 */
export async function createCircularWallpaperPreview(wallpaperUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      // The radius is from center to top edge, so radius = height / 2
      // The diameter (canvas size) equals the height
      const diameter = img.height;
      const radius = diameter / 2;

      const canvas = document.createElement("canvas");
      canvas.width = diameter;
      canvas.height = diameter;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Create circular clip path
      ctx.beginPath();
      ctx.arc(radius, radius, radius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Calculate the x offset to center the image horizontally
      // The circle will be centered on the image's center point
      const xOffset = (img.width - diameter) / 2;

      // Draw the image, centered horizontally within the circular clip
      ctx.drawImage(img, -xOffset, 0);

      // Convert to data URL
      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = () => {
      reject(new Error(`Failed to load image: ${wallpaperUrl}`));
    };

    img.src = wallpaperUrl;
  });
}
