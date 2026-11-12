import type {
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

// The chat actions use function tools; newer SDKs also return custom tool types.
export function getFunctionToolCalls(
  toolCalls: ChatCompletionMessageToolCall[] | undefined
): ChatCompletionMessageFunctionToolCall[] {
  return (toolCalls ?? []).filter(
    (toolCall): toolCall is ChatCompletionMessageFunctionToolCall =>
      toolCall.type === "function"
  );
}
