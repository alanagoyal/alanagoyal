export interface PhotoMetadata {
  make?: string;
  model?: string;
  lensModel?: string;
  width?: number;
  height?: number;
  fileSize: number;
  mimeType: string;
  fNumber?: number;
  focalLength?: number;
  focalLength35mm?: number;
  iso?: number;
  exposureTime?: number;
  exposureCompensation?: number;
}

interface RawExif {
  Make?: unknown;
  Model?: unknown;
  LensModel?: unknown;
  ExifImageWidth?: unknown;
  ExifImageHeight?: unknown;
  FNumber?: unknown;
  FocalLength?: unknown;
  FocalLengthIn35mmFormat?: unknown;
  ISO?: unknown;
  ExposureTime?: unknown;
  ExposureCompensation?: unknown;
}

const metadataCache = new Map<string, Promise<PhotoMetadata>>();

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

async function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number } | undefined> {
  if (typeof createImageBitmap !== "function") return undefined;

  try {
    const bitmap = await createImageBitmap(blob);
    const dimensions = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return dimensions;
  } catch {
    return undefined;
  }
}

async function readPhotoMetadata(url: string): Promise<PhotoMetadata> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load photo metadata (${response.status})`);
  }

  const blob = await response.blob();
  let rawExif: RawExif = {};

  try {
    const { parse } = await import("exifr");
    rawExif =
      ((await parse(blob, {
        ifd0: { pick: ["Make", "Model"] },
        exif: {
          pick: [
            "LensModel",
            "ExifImageWidth",
            "ExifImageHeight",
            "FNumber",
            "FocalLength",
            "FocalLengthIn35mmFormat",
            "ISO",
            "ExposureTime",
            "ExposureCompensation",
          ],
        },
        gps: false,
        mergeOutput: true,
      })) as RawExif | undefined) ?? {};
  } catch {
    // File-level details can still be shown when a photo has no readable EXIF.
  }

  const exifWidth = numberValue(rawExif.ExifImageWidth);
  const exifHeight = numberValue(rawExif.ExifImageHeight);
  const dimensions =
    exifWidth && exifHeight
      ? { width: exifWidth, height: exifHeight }
      : await getImageDimensions(blob);

  return {
    make: stringValue(rawExif.Make),
    model: stringValue(rawExif.Model),
    lensModel: stringValue(rawExif.LensModel),
    width: dimensions?.width,
    height: dimensions?.height,
    fileSize: blob.size,
    mimeType: blob.type,
    fNumber: numberValue(rawExif.FNumber),
    focalLength: numberValue(rawExif.FocalLength),
    focalLength35mm: numberValue(rawExif.FocalLengthIn35mmFormat),
    iso: numberValue(rawExif.ISO),
    exposureTime: numberValue(rawExif.ExposureTime),
    exposureCompensation: numberValue(rawExif.ExposureCompensation),
  };
}

export function loadPhotoMetadata(url: string): Promise<PhotoMetadata> {
  const cached = metadataCache.get(url);
  if (cached) return cached;

  const request = readPhotoMetadata(url).catch((error) => {
    metadataCache.delete(url);
    throw error;
  });
  metadataCache.set(url, request);
  return request;
}

export function formatCameraName(metadata: PhotoMetadata): string | undefined {
  if (metadata.make && metadata.model) {
    if (metadata.model.toLowerCase().startsWith(metadata.make.toLowerCase())) {
      return metadata.model;
    }
    return `${metadata.make} ${metadata.model}`;
  }
  return metadata.model ?? metadata.make;
}

export function formatLensDescription(
  metadata: PhotoMetadata
): string | undefined {
  let lensName = metadata.lensModel;
  if (lensName && metadata.model) {
    lensName = lensName.replace(
      new RegExp(`^${escapeRegExp(metadata.model)}\\s*`, "i"),
      ""
    );
  }
  lensName = lensName
    ?.replace(/\s+\d+(?:\.\d+)?mm\s+f\/\d+(?:\.\d+)?$/i, "")
    .trim();
  if (lensName) {
    lensName = lensName.charAt(0).toUpperCase() + lensName.slice(1);
  }

  const details = [
    metadata.focalLength35mm
      ? `${Math.round(metadata.focalLength35mm)} mm`
      : undefined,
    metadata.fNumber ? `ƒ${formatDecimal(metadata.fNumber)}` : undefined,
  ].filter(Boolean);

  if (lensName && details.length > 0) {
    return `${lensName} — ${details.join(" ")}`;
  }
  return lensName ?? (details.length > 0 ? details.join(" ") : undefined);
}

export function formatDimensions(metadata: PhotoMetadata): string | undefined {
  if (!metadata.width || !metadata.height) return undefined;
  return `${metadata.width} × ${metadata.height}`;
}

export function formatMegapixels(metadata: PhotoMetadata): string | undefined {
  if (!metadata.width || !metadata.height) return undefined;
  const megapixels = (metadata.width * metadata.height) / 1_000_000;
  return `${formatDecimal(megapixels)} MP`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${formatDecimal(bytes / 1_000)} KB`;
  return `${formatDecimal(bytes / 1_000_000)} MB`;
}

export function formatPhotoType(mimeType: string, filename: string): string {
  const normalizedMimeType = mimeType.toLowerCase();
  if (normalizedMimeType === "image/jpeg") return "JPEG";
  if (normalizedMimeType === "image/png") return "PNG";
  if (normalizedMimeType === "image/webp") return "WEBP";
  if (normalizedMimeType === "image/heic") return "HEIC";

  const extension = filename.split(".").pop()?.toUpperCase();
  return extension || "IMAGE";
}

export function formatExposureTime(seconds: number): string {
  if (seconds >= 1) return `${formatDecimal(seconds)} s`;
  if (seconds <= 0) return "—";
  return `1/${Math.round(1 / seconds)} s`;
}

export function formatExposureCompensation(value: number): string {
  const normalized = Math.abs(value) < 0.05 ? 0 : value;
  return `${normalized > 0 ? "+" : ""}${formatDecimal(normalized)} ev`;
}

function formatDecimal(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 1,
  }).format(value);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
