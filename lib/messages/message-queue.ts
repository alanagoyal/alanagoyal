import { Conversation, Message } from "@/types/messages";
import { soundEffects } from "./sound-effects";

// Simplified conversation state - no task queue, just track current processing
type ConversationState = {
  status: "idle" | "processing";
  version: number;
  currentAbortController: AbortController | null;
  debounceTimeout: NodeJS.Timeout | null;
  pendingConversation: Conversation | null;
  lastActivity: number;
};

type MessageQueueState = {
  conversations: Map<string, ConversationState>;
};

type MessageQueueCallbacks = {
  onMessageGenerated: (conversationId: string, message: Message) => void;
  onTypingStatusChange: (
    conversationId: string | null,
    recipient: string | null
  ) => void;
  onError: (error: Error) => void;
  onMessageUpdated?: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  shouldMuteIncomingSound?: (hideAlerts: boolean | undefined) => boolean;
};

// Maximum consecutive AI messages before wrapping up (showing "notifications silenced")
const MAX_CONSECUTIVE_AI_MESSAGES = 5;

// Debounce time for user messages (wait for user to finish typing multiple messages)
const USER_MESSAGE_DEBOUNCE_MS = 500;

// Typing indicator duration range (2-3 seconds with randomness)
const TYPING_DELAY_MIN_MS = 2000;
const TYPING_DELAY_MAX_MS = 3000;

// Delay to show reaction before continuing with message
const REACTION_DISPLAY_MS = 1000;

// Delay between consecutive AI messages in group chats
const AI_MESSAGE_DELAY_MS = 2000;

export class MessageQueue {
  private state: MessageQueueState = {
    conversations: new Map(),
  };
  private callbacks: MessageQueueCallbacks;
  private activeConversation: string | null = null;
  private cleanupInterval: NodeJS.Timeout;
  private static CLEANUP_INTERVAL = 1000 * 60 * 30; // 30 minutes
  private static CONVERSATION_TTL = 1000 * 60 * 60 * 24; // 24 hours

  constructor(callbacks: MessageQueueCallbacks) {
    this.callbacks = callbacks;
    this.cleanupInterval = setInterval(
      () => this.cleanupOldConversations(),
      MessageQueue.CLEANUP_INTERVAL
    );
  }

  private cleanupOldConversations() {
    const now = Date.now();
    for (const [conversationId, state] of this.state.conversations.entries()) {
      if (now - state.lastActivity > MessageQueue.CONVERSATION_TTL) {
        this.cleanupConversation(conversationId);
      }
    }
  }

  private cleanupConversation(conversationId: string) {
    const state = this.state.conversations.get(conversationId);
    if (state) {
      if (state.debounceTimeout) {
        clearTimeout(state.debounceTimeout);
      }
      if (state.currentAbortController) {
        state.currentAbortController.abort();
      }
      this.state.conversations.delete(conversationId);
      if (this.activeConversation === conversationId) {
        this.callbacks.onTypingStatusChange(null, null);
        this.activeConversation = null;
      }
    }
  }

  private getOrCreateState(conversationId: string): ConversationState {
    let state = this.state.conversations.get(conversationId);
    if (!state) {
      state = {
        status: "idle",
        version: 0,
        currentAbortController: null,
        debounceTimeout: null,
        pendingConversation: null,
        lastActivity: Date.now(),
      };
      this.state.conversations.set(conversationId, state);
    } else {
      state.lastActivity = Date.now();
    }
    return state;
  }

  // Count consecutive AI messages from the end of the conversation
  private countConsecutiveAiMessages(messages: Message[]): number {
    let count = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender !== "me" && messages[i].sender !== "system") {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  // Cancel any in-progress work for a conversation
  private cancelProcessing(conversationId: string) {
    const state = this.state.conversations.get(conversationId);
    if (!state) return;

    // Abort any in-flight request
    if (state.currentAbortController) {
      state.currentAbortController.abort();
      state.currentAbortController = null;
    }

    // Clear typing indicator immediately
    this.callbacks.onTypingStatusChange(null, null);

    // Increment version to invalidate any pending work
    state.version++;
    state.status = "idle";
  }

  // Main entry point for user messages
  // Debounces rapid messages and cancels pending AI work
  public enqueueUserMessage(conversation: Conversation) {
    const state = this.getOrCreateState(conversation.id);

    // Cancel any in-progress AI work
    this.cancelProcessing(conversation.id);

    // Clear existing debounce timer
    if (state.debounceTimeout) {
      clearTimeout(state.debounceTimeout);
    }

    // Store latest conversation state
    state.pendingConversation = conversation;

    // Start debounce timer
    state.debounceTimeout = setTimeout(() => {
      const currentState = this.state.conversations.get(conversation.id);
      if (currentState?.pendingConversation) {
        currentState.version++;
        const conv = currentState.pendingConversation;
        currentState.pendingConversation = null;
        currentState.debounceTimeout = null;
        this.processMessage(conversation.id, conv);
      }
    }, USER_MESSAGE_DEBOUNCE_MS);
  }

  // Schedule an AI message (used for group chat continuation)
  private scheduleAIMessage(conversation: Conversation) {
    const state = this.getOrCreateState(conversation.id);
    const currentVersion = state.version;

    // Don't schedule if we've reached the limit
    const consecutiveAi = this.countConsecutiveAiMessages(conversation.messages);
    if (consecutiveAi >= MAX_CONSECUTIVE_AI_MESSAGES) {
      return;
    }

    // Wait before sending next AI message
    setTimeout(() => {
      const currentState = this.state.conversations.get(conversation.id);
      // Only proceed if version hasn't changed (no user interruption)
      if (currentState && currentState.version === currentVersion) {
        this.processMessage(conversation.id, conversation);
      }
    }, AI_MESSAGE_DELAY_MS);
  }

  // Core message processing logic
  private async processMessage(conversationId: string, conversation: Conversation) {
    const state = this.getOrCreateState(conversationId);

    if (state.status === "processing") return;

    state.status = "processing";
    state.currentAbortController = new AbortController();
    const currentVersion = state.version;

    try {
      const isGroupChat = conversation.recipients.length > 1;
      const consecutiveAi = this.countConsecutiveAiMessages(conversation.messages);
      const shouldWrapUp = consecutiveAi >= MAX_CONSECUTIVE_AI_MESSAGES - 1;

      // Make API call
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: conversation.recipients,
          messages: conversation.messages,
          shouldWrapUp,
          isOneOnOne: !isGroupChat,
        }),
        signal: state.currentAbortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      // SINGLE version check after API call
      if (currentVersion !== state.version) {
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";
        return;
      }

      const data = await response.json();

      // Show typing indicator after API response
      this.callbacks.onTypingStatusChange(conversationId, data.sender);
      let typingStartTime = Date.now();

      // Handle reaction if present
      if (data.reaction && conversation.messages.length > 0) {
        const lastMessage = conversation.messages[conversation.messages.length - 1];
        if (!lastMessage.reactions) {
          lastMessage.reactions = [];
        }
        lastMessage.reactions.push({
          type: data.reaction,
          sender: data.sender,
          timestamp: new Date().toISOString(),
        });

        // Play reaction sound (unless muted)
        const shouldMute = this.callbacks.shouldMuteIncomingSound?.(conversation.hideAlerts) ?? false;
        if (!shouldMute) {
          soundEffects.playReactionSound();
        }

        // Update UI with reaction
        if (this.callbacks.onMessageUpdated) {
          this.callbacks.onMessageUpdated(conversationId, lastMessage.id, {
            reactions: lastMessage.reactions,
          });
        }

        // Brief delay to show reaction before continuing
        await this.delay(REACTION_DISPLAY_MS);

        // Check version again after delay
        if (currentVersion !== state.version) {
          this.callbacks.onTypingStatusChange(null, null);
          state.status = "idle";
          return;
        }

        // Reset typing timer - after reacting, still need time to type
        typingStartTime = Date.now();
      }

      // Calculate remaining typing delay (ensure minimum time has passed since typing started)
      const typingDelay = TYPING_DELAY_MIN_MS + Math.random() * (TYPING_DELAY_MAX_MS - TYPING_DELAY_MIN_MS);
      const elapsedTime = typingStartTime ? Date.now() - typingStartTime : 0;
      const remainingDelay = Math.max(0, typingDelay - elapsedTime);

      if (remainingDelay > 0) {
        await this.delay(remainingDelay);
      }

      // Final version check before delivering message
      if (currentVersion !== state.version) {
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";
        return;
      }

      // Create and deliver message
      const newMessage: Message = {
        id: crypto.randomUUID(),
        content: data.content,
        sender: data.sender,
        timestamp: new Date().toISOString(),
      };

      this.callbacks.onMessageGenerated(conversationId, newMessage);
      this.callbacks.onTypingStatusChange(null, null);

      // Continue conversation ONLY for group chats that haven't wrapped up
      if (isGroupChat && !shouldWrapUp) {
        this.scheduleAIMessage({
          ...conversation,
          messages: [...conversation.messages, newMessage],
        });
      } else if (shouldWrapUp) {
        // Show "notifications silenced" for the wrap-up
        await this.delay(AI_MESSAGE_DELAY_MS);

        if (currentVersion === state.version) {
          const silencedMessage: Message = {
            id: crypto.randomUUID(),
            content: `${data.sender} has notifications silenced`,
            sender: "system",
            type: "silenced",
            timestamp: new Date().toISOString(),
          };
          this.callbacks.onMessageGenerated(conversationId, silencedMessage);
        }
      }
      // For 1-on-1: Do nothing - wait for next user message
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Error processing message:", error);
        this.callbacks.onError(error);
      }
    } finally {
      state.status = "idle";
      state.currentAbortController = null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public setActiveConversation(conversationId: string | null) {
    if (this.activeConversation && this.activeConversation !== conversationId) {
      const prevState = this.state.conversations.get(this.activeConversation);
      if (prevState && prevState.status === "processing") {
        this.callbacks.onTypingStatusChange(null, null);
      }
    }
    this.activeConversation = conversationId;
  }

  public getActiveConversation(): string | null {
    return this.activeConversation;
  }

  public dispose() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    for (const [conversationId] of this.state.conversations) {
      this.cleanupConversation(conversationId);
    }
  }
}
