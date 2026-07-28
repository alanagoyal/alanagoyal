export const NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS = 1_200;

export function getBoundedMarkdownPreview(
  content: string,
  maxCharacters = NOTE_MARKDOWN_PREVIEW_MAX_CHARACTERS,
): string {
  const characterLimit = Math.max(0, Math.floor(maxCharacters));
  if (content.length <= characterLimit) return content;
  if (characterLimit === 0) return "";

  let endIndex = characterLimit;
  const lastIncludedCodeUnit = content.charCodeAt(endIndex - 1);
  const firstExcludedCodeUnit = content.charCodeAt(endIndex);

  // Avoid splitting an emoji or other supplementary Unicode character.
  if (
    lastIncludedCodeUnit >= 0xd800 &&
    lastIncludedCodeUnit <= 0xdbff &&
    firstExcludedCodeUnit >= 0xdc00 &&
    firstExcludedCodeUnit <= 0xdfff
  ) {
    endIndex -= 1;
  }

  const boundedContent = content.slice(0, endIndex);
  const lastLineBreak = boundedContent.lastIndexOf("\n");
  const minimumUsefulBoundary = Math.floor(endIndex * 0.7);

  if (lastLineBreak >= minimumUsefulBoundary) {
    return boundedContent.slice(0, lastLineBreak).trimEnd();
  }

  return boundedContent.trimEnd();
}
