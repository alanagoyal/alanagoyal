import { createClient } from "@/utils/supabase/client";

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
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

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: "File too large. Maximum size is 5MB.",
      };
    }

    const supabase = createClient();

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `${noteId}/${timestamp}-${randomString}.${fileExt}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("note-images")
      .upload(fileName, file, {
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
