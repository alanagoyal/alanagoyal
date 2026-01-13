export interface OSVersion {
  id: string;
  name: string;
  version: string;
  darwinVersion: string;
  wallpaperFile: string;
  releaseYear: number;
}

// OS versions sorted by version number (oldest to newest)
export const OS_VERSIONS: OSVersion[] = [
  {
    id: "leopard",
    name: "Leopard",
    version: "10.5",
    darwinVersion: "9.0.0",
    wallpaperFile: "leopard-server-wallpaper.jpg",
    releaseYear: 2007,
  },
  {
    id: "snow-leopard",
    name: "Snow Leopard",
    version: "10.6",
    darwinVersion: "10.0.0",
    wallpaperFile: "snow-leopard-wallpaper.jpg",
    releaseYear: 2009,
  },
  {
    id: "lion",
    name: "Lion",
    version: "10.7",
    darwinVersion: "11.0.0",
    wallpaperFile: "lion-wallpaper.jpg",
    releaseYear: 2011,
  },
  {
    id: "mountain-lion",
    name: "Mountain Lion",
    version: "10.8",
    darwinVersion: "12.0.0",
    wallpaperFile: "mountain-lion-wallpaper.jpg",
    releaseYear: 2012,
  },
  {
    id: "yosemite",
    name: "Yosemite",
    version: "10.10",
    darwinVersion: "14.0.0",
    wallpaperFile: "yosemite-wallpaper.jpg",
    releaseYear: 2014,
  },
  {
    id: "el-capitan",
    name: "El Capitan",
    version: "10.11",
    darwinVersion: "15.0.0",
    wallpaperFile: "elcapitan-wallpaper.jpg",
    releaseYear: 2015,
  },
  {
    id: "sierra",
    name: "Sierra",
    version: "10.12",
    darwinVersion: "16.0.0",
    wallpaperFile: "sierra-wallpaper.png",
    releaseYear: 2016,
  },
  {
    id: "mojave",
    name: "Mojave",
    version: "10.14",
    darwinVersion: "18.0.0",
    wallpaperFile: "mojave-wallpaper.jpg",
    releaseYear: 2018,
  },
  {
    id: "sonoma",
    name: "Sonoma",
    version: "14.0",
    darwinVersion: "23.0.0",
    wallpaperFile: "sonoma-wallpaper.png",
    releaseYear: 2023,
  },
  {
    id: "sequoia",
    name: "Sequoia",
    version: "15.0",
    darwinVersion: "24.0.0",
    wallpaperFile: "sequoia-wallpaper.png",
    releaseYear: 2024,
  },
  {
    id: "tahoe",
    name: "Tahoe",
    version: "26.0",
    darwinVersion: "25.0.0",
    wallpaperFile: "tahoe-wallpaper.png",
    releaseYear: 2025,
  },
];

export const DEFAULT_OS_VERSION_ID = "sierra";

export function getOSVersion(id: string): OSVersion {
  return OS_VERSIONS.find((os) => os.id === id) ?? OS_VERSIONS.find((os) => os.id === DEFAULT_OS_VERSION_ID)!;
}

export function getWallpaperPath(id: string): string {
  const os = getOSVersion(id);
  return `/desktop/versions/${os.wallpaperFile}`;
}

export function getThumbnailPath(id: string): string {
  const os = getOSVersion(id);
  // Thumbnail filename: original name with -thumb before extension
  const parts = os.wallpaperFile.split(".");
  const ext = parts.pop();
  const name = parts.join(".");
  return `/desktop/versions/thumbnails/${name}-thumb.${ext}`;
}
