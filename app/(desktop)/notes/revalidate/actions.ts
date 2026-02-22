"use server";

import { revalidatePath } from "next/cache";

const NOTE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/i;

export async function revalidateNotePath(slug: string): Promise<void> {
  const normalizedSlug = typeof slug === "string" ? slug.trim() : "";

  // Ignore invalid slugs to avoid malformed path invalidations.
  if (!normalizedSlug || !NOTE_SLUG_PATTERN.test(normalizedSlug)) {
    return;
  }

  revalidatePath(`/notes/${normalizedSlug}`);
}
