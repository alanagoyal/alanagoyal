export const HOME_DIR = "/Users/alanagoyal";
export const PROJECTS_DIR = `${HOME_DIR}/Projects`;

export type DocumentAppId = "textedit" | "preview";
export type LocalSampleFileKind = "text" | "preview";

export interface LocalFinderItem {
  name: string;
  type: "file" | "dir";
  path: string;
}

interface LocalSampleFile {
  assetUrl?: string;
  content?: string;
  directoryPath: string;
  kind: LocalSampleFileKind;
  path: string;
}

interface DocumentAppConfig {
  finderTargetPath: string;
  localFileKind: LocalSampleFileKind;
}

export const DOCUMENT_APP_CONFIGS: Record<DocumentAppId, DocumentAppConfig> = {
  textedit: {
    finderTargetPath: `${HOME_DIR}/Documents`,
    localFileKind: "text",
  },
  preview: {
    finderTargetPath: `${HOME_DIR}/Desktop`,
    localFileKind: "preview",
  },
};

const LOCAL_SAMPLE_FILES: LocalSampleFile[] = [
  {
    content: "hello world!",
    directoryPath: `${HOME_DIR}/Documents`,
    kind: "text",
    path: `${HOME_DIR}/Documents/hello.md`,
  },
  {
    assetUrl: "/documents/Base%20Case%20Capital%20I%20-%20Form%20D.pdf",
    directoryPath: `${HOME_DIR}/Desktop`,
    kind: "preview",
    path: `${HOME_DIR}/Desktop/Base Case Capital I - Form D.pdf`,
  },
  {
    assetUrl: "/documents/Base%20Case%20Capital%20II%20-%20Form%20D.pdf",
    directoryPath: `${HOME_DIR}/Desktop`,
    kind: "preview",
    path: `${HOME_DIR}/Desktop/Base Case Capital II - Form D.pdf`,
  },
  {
    assetUrl: "/documents/Base%20Case%20Capital%20III%20-%20Form%20D.pdf",
    directoryPath: `${HOME_DIR}/Desktop`,
    kind: "preview",
    path: `${HOME_DIR}/Desktop/Base Case Capital III - Form D.pdf`,
  },
];

const LOCAL_SAMPLE_FILE_MAP = Object.fromEntries(
  LOCAL_SAMPLE_FILES.map((file) => [file.path, file])
) as Record<string, LocalSampleFile>;

export const LOCAL_FINDER_FILES: Record<string, LocalFinderItem[]> = {
  [HOME_DIR]: [
    { name: "Desktop", type: "dir", path: `${HOME_DIR}/Desktop` },
    { name: "Documents", type: "dir", path: `${HOME_DIR}/Documents` },
    { name: "Downloads", type: "dir", path: `${HOME_DIR}/Downloads` },
    { name: "Projects", type: "dir", path: `${HOME_DIR}/Projects` },
  ],
  [`${HOME_DIR}/Desktop`]: LOCAL_SAMPLE_FILES.filter((file) => file.directoryPath === `${HOME_DIR}/Desktop`).map((file) => ({
    name: file.path.split("/").pop() ?? file.path,
    type: "file" as const,
    path: file.path,
  })),
  [`${HOME_DIR}/Documents`]: LOCAL_SAMPLE_FILES.filter((file) => file.directoryPath === `${HOME_DIR}/Documents`).map((file) => ({
    name: file.path.split("/").pop() ?? file.path,
    type: "file" as const,
    path: file.path,
  })),
  [`${HOME_DIR}/Downloads`]: [],
};

export function getDocumentAppFinderTarget(appId: DocumentAppId): string {
  return DOCUMENT_APP_CONFIGS[appId].finderTargetPath;
}

export function getLocalTextFileContent(filePath: string): string | null {
  const file = LOCAL_SAMPLE_FILE_MAP[filePath];
  return file?.kind === "text" ? (file.content ?? null) : null;
}

export function getLocalPreviewAssetUrl(filePath: string): string | null {
  const file = LOCAL_SAMPLE_FILE_MAP[filePath];
  return file?.kind === "preview" ? (file.assetUrl ?? null) : null;
}

export function isSupportedDocumentAppPath(appId: DocumentAppId, filePath: string): boolean {
  if (!filePath) return false;
  if (appId === "textedit" && filePath.startsWith(`${PROJECTS_DIR}/`)) return true;

  const file = LOCAL_SAMPLE_FILE_MAP[filePath];
  return file?.kind === DOCUMENT_APP_CONFIGS[appId].localFileKind;
}

export function isSupportedTextEditPath(filePath: string): boolean {
  return isSupportedDocumentAppPath("textedit", filePath);
}
