// =============================================================================
// File Storage - Persistence for TextEdit content and file metadata
// =============================================================================

const TEXTEDIT_CONTENTS_KEY = "textedit-file-contents";
const FILE_MODIFIED_DATES_KEY = "file-modified-dates";

// =============================================================================
// TextEdit Content
// =============================================================================

function loadTextEditContents(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(TEXTEDIT_CONTENTS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getTextEditContent(filePath: string): string | undefined {
  const contents = loadTextEditContents();
  return contents[filePath];
}

export function saveTextEditContent(filePath: string, content: string): void {
  if (typeof window === "undefined") return;
  try {
    // Save content
    const contents = loadTextEditContents();
    contents[filePath] = content;
    localStorage.setItem(TEXTEDIT_CONTENTS_KEY, JSON.stringify(contents));

    // Update modified date
    const dates = loadFileModifiedDates();
    dates[filePath] = Date.now();
    localStorage.setItem(FILE_MODIFIED_DATES_KEY, JSON.stringify(dates));
  } catch {}
}

// =============================================================================
// File Modified Dates
// =============================================================================

function loadFileModifiedDates(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(FILE_MODIFIED_DATES_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

export function getFileModifiedDate(filePath: string): number | undefined {
  const dates = loadFileModifiedDates();
  return dates[filePath];
}
