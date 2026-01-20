import { Conversation, Message, ReactionType } from "@/types/messages";
import { soundEffects } from "./sound-effects";

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

// Safety limit - model should wrap_up before this, but this is a fallback
const MAX_CONSECUTIVE_AI_MESSAGES = 10;

// Debounce time for user messages
const USER_MESSAGE_DEBOUNCE_MS = 500;

// Typing indicator duration range
const TYPING_DELAY_MIN_MS = 2000;
const TYPING_DELAY_MAX_MS = 3000;

// Delay to show reaction before continuing
const REACTION_DISPLAY_MS = 1000;

// Delay between consecutive AI messages
const AI_MESSAGE_DELAY_MS = 2000;

export class MessageQueue {
  private state: MessageQueueState = {
    conversations: new Map(),
  };
  private callbacks: MessageQueueCallbacks;
  private activeConversation: string | null = null;
  private cleanupInterval: NodeJS.Timeout;
  private static CLEANUP_INTERVAL = 1000 * 60 * 30;
  private static CONVERSATION_TTL = 1000 * 60 * 60 * 24;

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

  private cancelProcessing(conversationId: string) {
    const state = this.state.conversations.get(conversationId);
    if (!state) return;

    if (state.currentAbortController) {
      state.currentAbortController.abort();
      state.currentAbortController = null;
    }

    this.callbacks.onTypingStatusChange(null, null);
    state.version++;
    state.status = "idle";
  }

  public enqueueUserMessage(conversation: Conversation) {
    const state = this.getOrCreateState(conversation.id);

    this.cancelProcessing(conversation.id);

    if (state.debounceTimeout) {
      clearTimeout(state.debounceTimeout);
    }

    state.pendingConversation = conversation;

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

  private scheduleAIMessage(conversation: Conversation) {
    const state = this.getOrCreateState(conversation.id);
    const currentVersion = state.version;

    // Safety limit - don't schedule if we've hit the max
    const consecutiveAi = this.countConsecutiveAiMessages(conversation.messages);
    if (consecutiveAi >= MAX_CONSECUTIVE_AI_MESSAGES) {
      // Force a wrap-up via silenced message
      this.showSilencedMessage(conversation.id, conversation, currentVersion);
      return;
    }

    setTimeout(() => {
      const currentState = this.state.conversations.get(conversation.id);
      if (currentState && currentState.version === currentVersion) {
        this.processMessage(conversation.id, conversation);
      }
    }, AI_MESSAGE_DELAY_MS);
  }

  private async showSilencedMessage(
    conversationId: string,
    conversation: Conversation,
    currentVersion: number
  ) {
    const state = this.state.conversations.get(conversationId);
    if (!state || state.version !== currentVersion) return;

    await this.delay(AI_MESSAGE_DELAY_MS);

    if (state.version !== currentVersion) return;

    // Find the last AI participant who spoke
    const lastAiMessage = [...conversation.messages]
      .reverse()
      .find((m) => m.sender !== "me" && m.sender !== "system");

    if (lastAiMessage) {
      const silencedMessage: Message = {
        id: crypto.randomUUID(),
        content: `${lastAiMessage.sender} has notifications silenced`,
        sender: "system",
        type: "silenced",
        timestamp: new Date().toISOString(),
      };
      this.callbacks.onMessageGenerated(conversationId, silencedMessage);
    }
  }

  private async processMessage(conversationId: string, conversation: Conversation) {
    const state = this.getOrCreateState(conversationId);

    if (state.status === "processing") return;

    state.status = "processing";
    state.currentAbortController = new AbortController();
    const currentVersion = state.version;

    try {
      const isGroupChat = conversation.recipients.length > 1;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: conversation.recipients,
          messages: conversation.messages,
          isOneOnOne: !isGroupChat,
        }),
        signal: state.currentAbortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      if (currentVersion !== state.version) {
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";
        return;
      }

      const data = await response.json();
      const actions: Array<{ action: string; participant?: string; message?: string; reaction?: string }> =
        data.actions || [{ action: data.action, ...data }]; // Backwards compat

      // Process actions - reactions first, then messages
      const reactionActions = actions.filter(a => a.action === "react");
      const messageAction = actions.find(a => a.action === "respond" || a.action === "wrap_up");
      const waitAction = actions.find(a => a.action === "wait");

      // Handle reactions first
      for (const reactionAction of reactionActions) {
        const reactor = reactionAction.participant;
        const reactionType = reactionAction.reaction as ReactionType;

        if (reactor && reactionType && conversation.messages.length > 0) {
          const lastMessage = conversation.messages[conversation.messages.length - 1];
          if (!lastMessage.reactions) {
            lastMessage.reactions = [];
          }
          lastMessage.reactions.push({
            type: reactionType,
            sender: reactor,
            timestamp: new Date().toISOString(),
          });

          const shouldMute =
            this.callbacks.shouldMuteIncomingSound?.(conversation.hideAlerts) ?? false;
          if (!shouldMute) {
            soundEffects.playReactionSound();
          }

          if (this.callbacks.onMessageUpdated) {
            this.callbacks.onMessageUpdated(conversationId, lastMessage.id, {
              reactions: lastMessage.reactions,
            });
          }

          // Brief pause between reactions if multiple
          if (reactionActions.length > 1) {
            await this.delay(REACTION_DISPLAY_MS);
          }
        }
      }

      // If only reactions (no message action), continue the conversation
      if (reactionActions.length > 0 && !messageAction && !waitAction) {
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";

        if (currentVersion === state.version && isGroupChat) {
          this.scheduleAIMessage(conversation);
        }
        return;
      }

      // Handle "wait" action - stop and let user respond
      if (waitAction && !messageAction) {
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";
        return;
      }

      // For "respond" and "wrap_up", we have a message to deliver
      if (!messageAction) {
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";
        return;
      }

      const sender = messageAction.participant;
      const content = messageAction.message;

      if (!sender || !content) {
        console.warn("Malformed response - missing participant or message:", messageAction);
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";
        return;
      }

      // Show typing indicator
      this.callbacks.onTypingStatusChange(conversationId, sender);

      // Typing delay
      const typingDelay =
        TYPING_DELAY_MIN_MS + Math.random() * (TYPING_DELAY_MAX_MS - TYPING_DELAY_MIN_MS);
      await this.delay(typingDelay);

      if (currentVersion !== state.version) {
        this.callbacks.onTypingStatusChange(null, null);
        state.status = "idle";
        return;
      }

      // Deliver the message
      const newMessage: Message = {
        id: crypto.randomUUID(),
        content: content,
        sender: sender,
        timestamp: new Date().toISOString(),
      };

      this.callbacks.onMessageGenerated(conversationId, newMessage);
      this.callbacks.onTypingStatusChange(null, null);

      // Handle next steps based on action
      if (messageAction.action === "wrap_up") {
        // Show "notifications silenced" after wrap_up
        await this.delay(AI_MESSAGE_DELAY_MS);

        if (currentVersion === state.version) {
          const silencedMessage: Message = {
            id: crypto.randomUUID(),
            content: `${sender} has notifications silenced`,
            sender: "system",
            type: "silenced",
            timestamp: new Date().toISOString(),
          };
          this.callbacks.onMessageGenerated(conversationId, silencedMessage);
        }
      } else if (messageAction.action === "respond" && isGroupChat) {
        // Continue the conversation
        this.scheduleAIMessage({
          ...conversation,
          messages: [...conversation.messages, newMessage],
        });
      }
      // For 1-on-1 with "respond", just wait for next user message
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
