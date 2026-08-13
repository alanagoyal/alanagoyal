const PRIVATE_MATCH_FIELDS = new Set(["white_secret_hash", "black_secret_hash"]);

export function redactPrivateMatchFields(match: Record<string, unknown> | null) {
  if (!match) return null;
  return Object.fromEntries(Object.entries(match).filter(([key]) => !PRIVATE_MATCH_FIELDS.has(key)));
}
