// =============================================================================
// File Storage - Persistence for TextEdit content and file metadata
// =============================================================================

const TEXTEDIT_CONTENTS_KEY = "textedit-file-contents";
const FILE_MODIFIED_DATES_KEY = "file-modified-dates";
const TEXTEDIT_DOCUMENTS_KEY = "textedit-user-documents";
const TEXTEDIT_HIDDEN_PATHS_KEY = "textedit-hidden-paths";

export const TEXTEDIT_DOCUMENTS_CHANGED_EVENT = "textedit-documents-changed";

interface StoredTextEditDocument {
  path: string;
  createdAt: number;
}

function dispatchTextEditDocumentsChanged(): void {
  window.dispatchEvent(new Event(TEXTEDIT_DOCUMENTS_CHANGED_EVENT));
}

function loadStoredTextEditDocuments(): StoredTextEditDocument[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(TEXTEDIT_DOCUMENTS_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (document): document is StoredTextEditDocument =>
        typeof document === "object" &&
        document !== null &&
        typeof (document as StoredTextEditDocument).path === "string" &&
        typeof (document as StoredTextEditDocument).createdAt === "number"
    );
  } catch {
    return [];
  }
}

function loadHiddenTextEditPaths(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(TEXTEDIT_HIDDEN_PATHS_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed)
      ? parsed.filter((path): path is string => typeof path === "string")
      : [];
  } catch {
    return [];
  }
}

export function getStoredTextEditDocumentPaths(): string[] {
  return loadStoredTextEditDocuments().map((document) => document.path);
}

export function isTextEditPathHidden(filePath: string): boolean {
  return loadHiddenTextEditPaths().includes(filePath);
}

export function createTextEditDocument(filePath: string, content: string): void {
  if (typeof window === "undefined") return;
  const documents = loadStoredTextEditDocuments();
  if (!documents.some((document) => document.path === filePath)) {
    documents.push({ path: filePath, createdAt: Date.now() });
    localStorage.setItem(TEXTEDIT_DOCUMENTS_KEY, JSON.stringify(documents));
  }
  const hiddenPaths = loadHiddenTextEditPaths().filter((path) => path !== filePath);
  localStorage.setItem(TEXTEDIT_HIDDEN_PATHS_KEY, JSON.stringify(hiddenPaths));
  saveTextEditContent(filePath, content);
  dispatchTextEditDocumentsChanged();
}

export function renameTextEditDocument(
  previousPath: string,
  nextPath: string,
  content: string
): void {
  if (typeof window === "undefined" || previousPath === nextPath) return;

  const documents = loadStoredTextEditDocuments();
  const existingDocument = documents.find((document) => document.path === previousPath);
  const nextDocuments = documents.filter(
    (document) => document.path !== previousPath && document.path !== nextPath
  );
  nextDocuments.push({
    path: nextPath,
    createdAt: existingDocument?.createdAt ?? Date.now(),
  });
  localStorage.setItem(TEXTEDIT_DOCUMENTS_KEY, JSON.stringify(nextDocuments));

  const contents = loadTextEditContents();
  delete contents[previousPath];
  contents[nextPath] = content;
  localStorage.setItem(TEXTEDIT_CONTENTS_KEY, JSON.stringify(contents));

  const dates = loadFileModifiedDates();
  delete dates[previousPath];
  dates[nextPath] = Date.now();
  localStorage.setItem(FILE_MODIFIED_DATES_KEY, JSON.stringify(dates));

  const hiddenPaths = new Set(loadHiddenTextEditPaths());
  hiddenPaths.delete(nextPath);
  if (!existingDocument) {
    hiddenPaths.add(previousPath);
  }
  localStorage.setItem(TEXTEDIT_HIDDEN_PATHS_KEY, JSON.stringify([...hiddenPaths]));

  dispatchTextEditDocumentsChanged();
}

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

function persistContent(filePath: string, content: string): void {
  const contents = loadTextEditContents();
  contents[filePath] = content;
  localStorage.setItem(TEXTEDIT_CONTENTS_KEY, JSON.stringify(contents));
}

export function saveTextEditContent(filePath: string, content: string): void {
  if (typeof window === "undefined") return;
  try {
    persistContent(filePath, content);
    const dates = loadFileModifiedDates();
    dates[filePath] = Date.now();
    localStorage.setItem(FILE_MODIFIED_DATES_KEY, JSON.stringify(dates));
  } catch {}
}

export function cacheTextEditContent(filePath: string, content: string): void {
  if (typeof window === "undefined") return;
  try {
    persistContent(filePath, content);
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
