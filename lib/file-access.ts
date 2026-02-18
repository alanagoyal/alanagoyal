import { getPreviewMetadataFromPath } from "@/lib/preview-utils";

export type PreviewFileTarget = {
  appId: "preview";
  filePath: string;
  previewMeta: { fileUrl: string; fileType: "image" | "pdf" };
};

export type TextEditFileTarget = {
  appId: "textedit";
  filePath: string;
};

export type FileLaunchTarget = PreviewFileTarget | TextEditFileTarget;

function normalizeFilePath(filePath?: string | null): string | null {
  if (!filePath) return null;
  return filePath;
}

export function resolvePreviewFileTarget(filePath?: string | null): PreviewFileTarget | null {
  const normalized = normalizeFilePath(filePath);
  if (!normalized) return null;

  const previewMeta = getPreviewMetadataFromPath(normalized);
  if (!previewMeta) return null;

  return {
    appId: "preview",
    filePath: normalized,
    previewMeta,
  };
}

export function resolveFileLaunchTarget(filePath?: string | null): FileLaunchTarget | null {
  const previewTarget = resolvePreviewFileTarget(filePath);
  if (previewTarget) return previewTarget;

  const normalized = normalizeFilePath(filePath);
  if (!normalized) return null;

  return {
    appId: "textedit",
    filePath: normalized,
  };
}
