const DEFAULT_DOCUMENT_DIRECTORY = "/Users/alanagoyal/Documents";

function splitFileName(fileName: string): { stem: string; extension: string } {
  const extensionIndex = fileName.lastIndexOf(".");
  if (extensionIndex <= 0) return { stem: fileName, extension: "" };
  return {
    stem: fileName.slice(0, extensionIndex),
    extension: fileName.slice(extensionIndex),
  };
}

function uniquePath(
  directory: string,
  stem: string,
  extension: string,
  existingPaths: Iterable<string>,
  suffixForIndex: (index: number) => string
): string {
  const existing = new Set(existingPaths);
  let index = 1;

  while (true) {
    const suffix = suffixForIndex(index);
    const candidate = `${directory}/${stem}${suffix}${extension}`;
    if (!existing.has(candidate)) return candidate;
    index += 1;
  }
}

export function getUntitledTextEditPath(
  existingPaths: Iterable<string>,
  directory = DEFAULT_DOCUMENT_DIRECTORY
): string {
  return uniquePath(directory, "Untitled", ".txt", existingPaths, (index) =>
    index === 1 ? "" : ` ${index}`
  );
}

export function getDuplicateTextEditPath(
  sourcePath: string,
  existingPaths: Iterable<string>,
  directory = DEFAULT_DOCUMENT_DIRECTORY
): string {
  const fileName = sourcePath.split("/").pop() || "Untitled.txt";
  const { stem, extension } = splitFileName(fileName);
  return uniquePath(directory, stem, extension, existingPaths, (index) =>
    index === 1 ? " copy" : ` copy ${index}`
  );
}

export type TextEditRenameResult =
  | { ok: true; path: string; fileName: string }
  | { ok: false; error: string };

export function getRenamedTextEditPath(
  currentPath: string,
  requestedName: string,
  existingPaths: Iterable<string>
): TextEditRenameResult {
  const trimmedName = requestedName.trim();
  if (!trimmedName) return { ok: false, error: "Enter a file name." };
  if (trimmedName === "." || trimmedName === ".." || /[/\\]/.test(trimmedName)) {
    return { ok: false, error: "File names can’t contain slashes." };
  }

  const currentName = currentPath.split("/").pop() || "Untitled.txt";
  const currentExtension = splitFileName(currentName).extension;
  const requestedExtension = splitFileName(trimmedName).extension;
  const fileName = !requestedExtension && currentExtension
    ? `${trimmedName}${currentExtension}`
    : trimmedName;
  const directory = currentPath.split("/").slice(0, -1).join("/");
  const path = `${directory}/${fileName}`;

  if (path !== currentPath && new Set(existingPaths).has(path)) {
    return { ok: false, error: "A file with that name already exists." };
  }

  return { ok: true, path, fileName };
}
