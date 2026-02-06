/** Extract plain text from HTML content (e.g. Tiptap editor output) */
export function extractMessageContent(htmlContent: string): string {
  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;
  return temp.textContent || "";
}
