let selectedSlugInMemory: string | null = null;

export function getNotesSelectedSlugMemory(): string | null {
  return selectedSlugInMemory;
}

export function setNotesSelectedSlugMemory(slug: string | null): void {
  selectedSlugInMemory = slug;
}

export function clearNotesSelectedSlugMemory(): void {
  selectedSlugInMemory = null;
}
