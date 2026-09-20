export interface Photo {
  id: string;
  filename: string;
  url: string;
  timestamp: string;
  isFavorite: boolean;
  collections: string[];
  caption?: string;
  tags?: string[];
  ocrText?: string;
  analyzedAt?: string | null;
}

export interface Collection {
  id: string;
  name: string;
  coverPhotoId: string;
}

export type PhotosView = "library" | "favorites" | string;
export type TimeFilter = "years" | "months" | "all";
