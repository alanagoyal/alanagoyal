import { Photo, Collection } from "@/types/photos";

export const initialPhotos: Photo[] = [
  {
    id: "photo-1",
    filename: "photo-1.jpg",
    timestamp: "2026-01-13T19:30:00.000Z",
    isFavorite: true,
    collections: ["flowers"],
  },
  {
    id: "photo-2",
    filename: "photo-2.jpg",
    timestamp: "2026-01-13T18:45:00.000Z",
    isFavorite: false,
    collections: ["flowers"],
  },
  {
    id: "photo-3",
    filename: "photo-3.jpg",
    timestamp: "2026-01-13T17:20:00.000Z",
    isFavorite: true,
    collections: ["flowers"],
  },
  {
    id: "photo-4",
    filename: "photo-4.jpg",
    timestamp: "2026-01-13T15:00:00.000Z",
    isFavorite: false,
    collections: ["flowers"],
  },
  {
    id: "photo-5",
    filename: "photo-5.jpg",
    timestamp: "2026-01-13T14:30:00.000Z",
    isFavorite: false,
    collections: [],
  },
  {
    id: "photo-6",
    filename: "photo-6.jpg",
    timestamp: "2026-01-12T20:15:00.000Z",
    isFavorite: true,
    collections: ["food"],
  },
  {
    id: "photo-7",
    filename: "photo-7.jpg",
    timestamp: "2026-01-12T19:00:00.000Z",
    isFavorite: false,
    collections: ["food"],
  },
  {
    id: "photo-8",
    filename: "photo-8.jpg",
    timestamp: "2026-01-12T16:30:00.000Z",
    isFavorite: false,
    collections: [],
  },
  {
    id: "photo-9",
    filename: "photo-9.jpg",
    timestamp: "2026-01-12T12:00:00.000Z",
    isFavorite: true,
    collections: ["flowers"],
  },
  {
    id: "photo-10",
    filename: "photo-10.jpg",
    timestamp: "2026-01-11T18:45:00.000Z",
    isFavorite: false,
    collections: [],
  },
  {
    id: "photo-11",
    filename: "photo-11.jpg",
    timestamp: "2026-01-11T14:20:00.000Z",
    isFavorite: false,
    collections: ["food"],
  },
  {
    id: "photo-12",
    filename: "photo-12.jpg",
    timestamp: "2026-01-10T11:30:00.000Z",
    isFavorite: true,
    collections: [],
  },
  {
    id: "photo-13",
    filename: "photo-13.jpg",
    timestamp: "2025-12-25T10:00:00.000Z",
    isFavorite: true,
    collections: [],
  },
  {
    id: "photo-14",
    filename: "photo-14.jpg",
    timestamp: "2025-12-24T15:30:00.000Z",
    isFavorite: false,
    collections: [],
  },
  {
    id: "photo-15",
    filename: "photo-15.jpg",
    timestamp: "2025-11-15T09:00:00.000Z",
    isFavorite: false,
    collections: ["flowers"],
  },
];

export const initialCollections: Collection[] = [
  {
    id: "flowers",
    name: "Flowers",
    coverPhotoId: "photo-1",
  },
  {
    id: "food",
    name: "Food",
    coverPhotoId: "photo-6",
  },
];
