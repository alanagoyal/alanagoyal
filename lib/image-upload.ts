import { createClient } from "@/utils/supabase/client";

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Compress an image file using Canvas API
 * @param file - The image file to compress
 * @param maxSize - Maximum file size in bytes
 * @returns Compressed file or original if already small enough
 */
async function compressImage(file: File, maxSize: number): Promise<File> {
  // If already under limit, return as-is
  if (file.size <= maxSize) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    img.onload = async () => {
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      // Start with original dimensions
      let width = img.width;
      let height = img.height;

      // Scale down large images to reduce file size
      const maxDimension = 2048;
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels to get under the size limit
      const qualities = [0.8, 0.6, 0.4, 0.3, 0.2];

      for (const quality of qualities) {
        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/jpeg", quality)
        );

        if (blob && blob.size <= maxSize) {
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
          return;
        }
      }

      // If still too large after compression, scale down further
      const scaleFactors = [0.75, 0.5, 0.25];
      for (const scale of scaleFactors) {
        const scaledWidth = Math.round(width * scale);
        const scaledHeight = Math.round(height * scale);
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;
        ctx.drawImage(img, 0, 0, scaledWidth, scaledHeight);

        const blob = await new Promise<Blob | null>((res) =>
          canvas.toBlob(res, "image/jpeg", 0.7)
        );

        if (blob && blob.size <= maxSize) {
          const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressedFile);
          return;
        }
      }

      // Last resort: return smallest attempt
      const finalBlob = await new Promise<Blob | null>((res) =>
        canvas.toBlob(res, "image/jpeg", 0.5)
      );

      if (finalBlob) {
        const compressedFile = new File([finalBlob], file.name.replace(/\.[^.]+$/, ".jpg"), {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        resolve(compressedFile);
      } else {
        reject(new Error("Failed to compress image"));
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Upload an image file to Supabase Storage
 * @param file - The image file to upload
 * @param noteId - The ID of the note this image belongs to
 * @returns Result object with success status and URL or error
 */
export async function uploadNoteImage(
  file: File,
  noteId: string
): Promise<ImageUploadResult> {
  try {
    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are supported.",
      };
    }

    // Compress image if over size limit
    let fileToUpload = file;
    if (file.size > MAX_FILE_SIZE) {
      try {
        fileToUpload = await compressImage(file, MAX_FILE_SIZE);
      } catch {
        return {
          success: false,
          error: "Failed to compress image. Please try a smaller file.",
        };
      }
    }

    const supabase = createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = fileToUpload.name.split(".").pop() || "png";
    const fileName = `${noteId}/${timestamp}-${randomString}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("note-images")
      .upload(fileName, fileToUpload, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return {
        success: false,
        error: `Upload failed: ${error.message}`,
      };
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("note-images").getPublicUrl(data.path);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error("Unexpected error during upload:", error);
    return {
      success: false,
      error: "An unexpected error occurred during upload.",
    };
  }
}

/**
 * Extract image from clipboard paste event
 * @param event - The clipboard event
 * @returns Image file if found, null otherwise
 */
export function getImageFromClipboard(
  event: ClipboardEvent
): File | null {
  const items = event.clipboardData?.items;
  if (!items) return null;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf("image") !== -1) {
      return item.getAsFile();
    }
  }

  return null;
}

/**
 * Insert markdown image syntax at cursor position
 * @param textarea - The textarea element
 * @param imageUrl - The URL of the uploaded image
 * @param altText - Alt text for the image (optional)
 */
export function insertImageMarkdown(
  textarea: HTMLTextAreaElement,
  imageUrl: string,
  altText: string = "image"
): void {
  const cursorPos = textarea.selectionStart;
  const textBefore = textarea.value.substring(0, cursorPos);
  const textAfter = textarea.value.substring(cursorPos);

  // Add newlines if not at start of line
  const needsNewlineBefore = textBefore.length > 0 && !textBefore.endsWith("\n");
  const needsNewlineAfter = textAfter.length > 0 && !textAfter.startsWith("\n");

  const imageMarkdown = `${needsNewlineBefore ? "\n" : ""}![${altText}](${imageUrl})${needsNewlineAfter ? "\n" : ""}`;

  const newValue = textBefore + imageMarkdown + textAfter;
  textarea.value = newValue;

  // Trigger input event to update React state
  const inputEvent = new Event("input", { bubbles: true });
  textarea.dispatchEvent(inputEvent);

  // Move cursor to end of inserted markdown
  const newCursorPos = cursorPos + imageMarkdown.length;
  textarea.setSelectionRange(newCursorPos, newCursorPos);
  textarea.focus();
}
