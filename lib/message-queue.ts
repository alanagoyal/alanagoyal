import { Conversation, Message } from "../types";
import { soundEffects } from "./sound-effects";

// Represents a task in the message queue
// Each task corresponds to a message that needs to be processed
type MessageTask = {
  id: string;
  conversation: Conversation;
  priority: number;
  timestamp: number;
  abortController: AbortController;
  consecutiveAiMessages: number;
  conversationVersion: number; // Add version tracking
};

// Represents the state of a specific conversation
type ConversationState = {
  consecutiveAiMessages: number;
  version: number;
  status: "idle" | "processing";
  currentTask: MessageTask | null;
  tasks: MessageTask[];
  userMessageDebounceTimeout: NodeJS.Timeout | null;
  pendingUserMessages: Conversation | null;
  lastActivity: number; // Track when this conversation was last active
};

// Represents the current state of the message queue
type MessageQueueState = {
  conversations: Map<string, ConversationState>;
};

// Callback functions for handling various queue events
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
};

// Maximum number of consecutive AI messages allowed to prevent infinite loops
const MAX_CONSECUTIVE_AI_MESSAGES = 5;

//  MessageQueue class manages the processing of chat messages with priority handling
//  It ensures messages are processed in order and handles both user and AI messages
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
    // Periodically clean up old conversations
    this.cleanupInterval = setInterval(() => this.cleanupOldConversations(), MessageQueue.CLEANUP_INTERVAL);
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
      // Clear any pending timeouts
      if (state.userMessageDebounceTimeout) {
        clearTimeout(state.userMessageDebounceTimeout);
      }
      
      // Cancel any ongoing tasks
      this.cancelConversationTasks(conversationId);
      
      // Remove the conversation state
      this.state.conversations.delete(conversationId);
      
      // Clear typing status if this was the last active conversation
      if (this.activeConversation === conversationId) {
        this.callbacks.onTypingStatusChange(null, null);
        this.activeConversation = null;
      }
    }
  }

  private getOrCreateConversationState(conversationId: string): ConversationState {
    let conversationState = this.state.conversations.get(conversationId);
    if (!conversationState) {
      conversationState = {
        consecutiveAiMessages: 0,
        version: 0,
        status: "idle",
        currentTask: null,
        tasks: [],
        userMessageDebounceTimeout: null,
        pendingUserMessages: null,
        lastActivity: Date.now(),
      };
      this.state.conversations.set(conversationId, conversationState);
    } else {
      // Update last activity timestamp
      conversationState.lastActivity = Date.now();
    }
    return conversationState;
  }

  // Adds a user message to the queue with highest priority
  // Cancels all pending AI messages when a user sends a message
  public enqueueUserMessage(conversation: Conversation) {
    const conversationState = this.getOrCreateConversationState(conversation.id);
    
    // Cancel all pending AI messages for this conversation
    this.cancelConversationTasks(conversation.id);

    // Clear any existing debounce timeout
    if (conversationState.userMessageDebounceTimeout) {
      clearTimeout(conversationState.userMessageDebounceTimeout);
      conversationState.userMessageDebounceTimeout = null;
    }

    // Store or update pending messages
    conversationState.pendingUserMessages = conversation;

    // Debounce user messages to wait for potential follow-up messages
    const timeoutId = setTimeout(() => {
      const currentState = this.state.conversations.get(conversation.id);
      if (currentState && currentState.pendingUserMessages) {
        currentState.version++;
        
        const task: MessageTask = {
          id: crypto.randomUUID(),
          conversation: currentState.pendingUserMessages,
          priority: 100,
          timestamp: Date.now(),
          abortController: new AbortController(),
          consecutiveAiMessages: 0,
          conversationVersion: currentState.version,
        };

        currentState.pendingUserMessages = null;
        currentState.userMessageDebounceTimeout = null;
        this.addTask(conversation.id, task);
      }
    }, 500);

    conversationState.userMessageDebounceTimeout = timeoutId;
  }

  // Adds an AI message to the queue with normal priority
  // Tracks and limits consecutive AI messages to prevent infinite loops
  public enqueueAIMessage(conversation: Conversation) {
    const conversationState = this.getOrCreateConversationState(conversation.id);
    
    // Count consecutive AI messages for this conversation
    let consecutiveAiMessages = 0;
    for (let i = conversation.messages.length - 1; i >= 0; i--) {
      if (conversation.messages[i].sender !== "me") {
        consecutiveAiMessages++;
      } else {
        break;
      }
    }

    // Don't add more AI messages if we've reached the limit
    if (consecutiveAiMessages >= MAX_CONSECUTIVE_AI_MESSAGES) {
      return;
    }

    const task: MessageTask = {
      id: crypto.randomUUID(),
      conversation,
      priority: 50,
      timestamp: Date.now(),
      abortController: new AbortController(),
      consecutiveAiMessages,
      conversationVersion: conversationState.version,
    };

    this.addTask(conversation.id, task);
  }

  // Adds a new task to the queue and sorts tasks by priority and timestamp
  // Triggers processing if the queue is idle
  private addTask(conversationId: string, task: MessageTask) {
    const conversationState = this.getOrCreateConversationState(conversationId);
    
    conversationState.tasks.push(task);
    conversationState.tasks.sort((a, b) => {
      // Sort by priority first, then by timestamp
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.timestamp - b.timestamp;
    });

    if (conversationState.status === "idle") {
      this.processNextTask(conversationId);
    }
  }

  // Processes the next task in the queue
  // Handles API calls, typing indicators, and message generation
  private async processNextTask(conversationId: string) {
    const conversationState = this.getOrCreateConversationState(conversationId);
    
    if (conversationState.status === "processing" || conversationState.tasks.length === 0) {
      return;
    }

    conversationState.status = "processing";
    const task = conversationState.tasks.shift()!;
    conversationState.currentTask = task;

    try {
      // Check if this task belongs to an outdated conversation version
      if (task.conversationVersion < conversationState.version) {
        // Clear typing status since we're aborting
        this.callbacks.onTypingStatusChange(null, null);
        conversationState.status = "idle";
        this.processNextTask(conversationId);
        return;
      }

      const isGroupChat = task.conversation.recipients.length > 1;
      const shouldWrapUp = task.consecutiveAiMessages === MAX_CONSECUTIVE_AI_MESSAGES - 1;
      
      // Make API request
      const response = await fetch("/messages/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: task.conversation.recipients,
          messages: task.conversation.messages,
          shouldWrapUp,
          isOneOnOne: task.conversation.recipients.length === 1,
          shouldReact: Math.random() < 0.25,
        }),
        signal: task.abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      // Check version again after API call to catch any interruptions during the request
      if (task.conversationVersion < conversationState.version || task.abortController.signal.aborted) {
        // Clear typing status since we're aborting
        this.callbacks.onTypingStatusChange(null, null);
        conversationState.status = "idle";
        this.processNextTask(conversationId);
        return;
      }

      const data = await response.json();

      // If there's a reaction in the response, add it to the last message
      if (data.reaction && task.conversation.messages.length > 0) {
        const lastMessage =
          task.conversation.messages[task.conversation.messages.length - 1];
        if (!lastMessage.reactions) {
          lastMessage.reactions = [];
        }
        lastMessage.reactions.push({
          type: data.reaction,
          sender: data.sender,
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        });

        // Play reaction sound effect when AI adds a reaction
        soundEffects.playReactionSound();

        // Use onMessageUpdated callback to update just the reactions
        if (this.callbacks.onMessageUpdated) {
          this.callbacks.onMessageUpdated(
            task.conversation.id,
            lastMessage.id,
            {
              reactions: lastMessage.reactions,
            }
          );
        }

        // Check version again after reaction delay
        if (task.conversationVersion < conversationState.version || task.abortController.signal.aborted) {
          // Clear typing status since we're aborting
          this.callbacks.onTypingStatusChange(null, null);
          conversationState.status = "idle";
          this.processNextTask(conversationId);
          return;
        }

        // Delay to show reaction before typing animation
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Start typing animation and delay for the content
      const typingDelay = task.priority === 100 ? 4000 : 7000; // Faster for user responses
      this.callbacks.onTypingStatusChange(task.conversation.id, data.sender);

      // Check version before starting typing delay
      if (task.conversationVersion < conversationState.version || task.abortController.signal.aborted) {
        // Clear typing status since we're aborting
        this.callbacks.onTypingStatusChange(null, null);
        conversationState.status = "idle";
        this.processNextTask(conversationId);
        return;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, typingDelay + Math.random() * 2000)
      );

      // Final version check before sending message
      if (task.conversationVersion < conversationState.version || task.abortController.signal.aborted) {
        // Clear typing status since we're aborting
        this.callbacks.onTypingStatusChange(null, null);
        conversationState.status = "idle";
        this.processNextTask(conversationId);
        return;
      }

      // Create new message
      const newMessage: Message = {
        id: crypto.randomUUID(),
        content: data.content,
        sender: data.sender,
        timestamp: new Date().toISOString(),
      };

      // Notify of new message
      this.callbacks.onMessageGenerated(task.conversation.id, newMessage);

      // Clear typing status
      this.callbacks.onTypingStatusChange(null, null);

      // Only continue if we didn't signal this as the last message
      if (!shouldWrapUp) {
        const updatedConversation = {
          ...task.conversation,
          messages: [...task.conversation.messages, newMessage],
        };

        // Add a small delay before the next AI message
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Only queue next AI message if we're still on the same conversation version
        if (
          !task.abortController.signal.aborted &&
          task.conversationVersion === conversationState.version &&
          isGroupChat
        ) {
          const lastAiSender = data.sender;
          const otherRecipients = task.conversation.recipients.filter(
            (r) => r !== lastAiSender
          );
          if (otherRecipients.length > 0) {
            const updatedConversationWithNextSender = {
              ...updatedConversation,
              recipients: otherRecipients,
            };
            this.enqueueAIMessage(updatedConversationWithNextSender);
          }
        }
      } else {
        // Send notifications silenced message
        await new Promise((resolve) => setTimeout(resolve, 2000));
        
        const silencedMessage: Message = {
          id: crypto.randomUUID(),
          content: `${data.sender} has notifications silenced`,
          sender: "system",
          type: "silenced",
          timestamp: new Date().toISOString(),
        };
        
        this.callbacks.onMessageGenerated(task.conversation.id, silencedMessage);
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name !== "AbortError") {
          console.error("Error processing task:", {
            taskId: task.id,
            error: error.message,
          });
          this.callbacks.onError(error);
        }
      }
    } finally {
      conversationState.status = "idle";
      conversationState.currentTask = null;
      this.processNextTask(conversationId); // Process next task if available
    }
  }

  // Cancels all tasks in the queue and resets the queue state
  public cancelConversationTasks(conversationId: string) {
    const conversationState = this.getOrCreateConversationState(conversationId);
    
    if (conversationState.currentTask) {
      conversationState.currentTask.abortController.abort();
    }

    for (const task of conversationState.tasks) {
      task.abortController.abort();
    }

    conversationState.tasks = [];
    conversationState.status = "idle";
    conversationState.currentTask = null;

    // Clear typing status
    this.callbacks.onTypingStatusChange(null, null);
  }

  public cancelAllTasks() {
    for (const [conversationId] of this.state.conversations) {
      this.cancelConversationTasks(conversationId);
    }
  }

  public setActiveConversation(conversationId: string | null) {
    // Clear typing status of previous conversation if it exists
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
    // Clean up the cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    // Cancel all tasks and clean up all conversations
    this.cancelAllTasks();
    for (const [conversationId] of this.state.conversations) {
      this.cleanupConversation(conversationId);
    }
  }
}