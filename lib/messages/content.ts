import { MessageMention } from "@/types/messages";

export interface ExtractedMessageData {
  text: string;
  mentions: MessageMention[];
}

function walkMessageNode(
  node: Node,
  fragments: string[],
  mentions: MessageMention[]
) {
  if (node.nodeType === Node.TEXT_NODE) {
    fragments.push(node.textContent ?? "");
    return;
  }

  if (!(node instanceof HTMLElement)) {
    node.childNodes.forEach((child) => walkMessageNode(child, fragments, mentions));
    return;
  }

  if (node.dataset.type === "mention" && node.dataset.id) {
    const text = node.textContent ?? node.dataset.label ?? "";
    const start = fragments.join("").length;
    fragments.push(text);
    mentions.push({
      id: node.dataset.id,
      name: node.dataset.name ?? node.dataset.label ?? text,
      start,
      end: start + text.length,
    });
    return;
  }

  node.childNodes.forEach((child) => walkMessageNode(child, fragments, mentions));
}

export function extractMessageData(htmlContent: string): ExtractedMessageData {
  const temp = document.createElement("div");
  temp.innerHTML = htmlContent;

  const fragments: string[] = [];
  const mentions: MessageMention[] = [];

  temp.childNodes.forEach((child) => walkMessageNode(child, fragments, mentions));

  return {
    text: fragments.join(""),
    mentions,
  };
}

/** Extract plain text from HTML content (e.g. Tiptap editor output) */
export function extractMessageContent(htmlContent: string): string {
  return extractMessageData(htmlContent).text;
}
