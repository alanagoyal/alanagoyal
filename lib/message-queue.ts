import { Conversation, Message } from "../types";

// Represents a task in the message queue
// Each task corresponds to a message that needs to be processed
type MessageTask = {
  id: string;
  conversation: Conversation;
  isFirstMessage: boolean;
  priority: number;
  timestamp: number;
  abortController: AbortController;
  consecutiveAiMessages: number;
  conversationVersion: number; // Add version tracking
};

// Represents the current state of a conversation queue
type ConversationQueueState = {
  status: "idle" | "processing";
  currentTask: MessageTask | null;
  tasks: MessageTask[];
  version: number;
};

// Represents the current state of the message queue
type MessageQueueState = {
  conversationQueues: Map<string, ConversationQueueState>;
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
    conversationQueues: new Map(),
  };
  private callbacks: MessageQueueCallbacks;
  private activeConversationId: string | null = null;

  constructor(callbacks: MessageQueueCallbacks) {
    this.callbacks = callbacks;
  }

  private getOrCreateConversationQueue(
    conversationId: string
  ): ConversationQueueState {
    if (!this.state.conversationQueues.has(conversationId)) {
      this.state.conversationQueues.set(conversationId, {
        status: "idle",
        currentTask: null,
        tasks: [],
        version: 0,
      });
    }
    return this.state.conversationQueues.get(conversationId)!;
  }

  // Adds a user message to the queue with highest priority
  public enqueueUserMessage(conversation: Conversation) {
    const conversationQueue = this.getOrCreateConversationQueue(
      conversation.id
    );

    // Increment version to cancel outdated tasks
    conversationQueue.version++;

    // Cancel any pending tasks for this conversation
    conversationQueue.tasks = [];
    if (conversationQueue.currentTask) {
      conversationQueue.currentTask.abortController.abort();
      conversationQueue.currentTask = null;
      conversationQueue.status = "idle";
    }

    const task: MessageTask = {
      id: Math.random().toString(),
      conversation,
      isFirstMessage: false,
      priority: 1,
      timestamp: Date.now(),
      abortController: new AbortController(),
      consecutiveAiMessages: 0,
      conversationVersion: conversationQueue.version,
    };

    this.addTask(task);
  }

  // Adds an AI message to the queue with normal priority
  public enqueueAIMessage(
    conversation: Conversation,
    isFirstMessage: boolean = false
  ) {
    const conversationQueue = this.getOrCreateConversationQueue(
      conversation.id
    );

    // Check if we've reached the maximum consecutive AI messages
    const currentConsecutiveMessages =
      conversationQueue.currentTask?.consecutiveAiMessages ?? 0;
    if (currentConsecutiveMessages >= MAX_CONSECUTIVE_AI_MESSAGES) {
      return;
    }

    const task: MessageTask = {
      id: Math.random().toString(),
      conversation,
      isFirstMessage,
      priority: 0,
      timestamp: Date.now(),
      abortController: new AbortController(),
      consecutiveAiMessages: currentConsecutiveMessages + 1,
      conversationVersion: conversationQueue.version,
    };

    this.addTask(task);
  }

  // Adds a new task to the queue and sorts tasks by priority and timestamp
  private addTask(task: MessageTask) {
    const conversationQueue = this.getOrCreateConversationQueue(
      task.conversation.id
    );
    conversationQueue.tasks.push(task);
    conversationQueue.tasks.sort(
      (a, b) => b.priority - a.priority || a.timestamp - b.timestamp
    );

    this.processNextTask(task.conversation.id);
  }

  // Processes the next task in the queue for a specific conversation
  private async processNextTask(conversationId: string) {
    const conversationQueue = this.getOrCreateConversationQueue(conversationId);

    if (
      conversationQueue.status === "processing" ||
      conversationQueue.tasks.length === 0
    ) {
      return;
    }

    conversationQueue.status = "processing";
    const task = conversationQueue.tasks.shift()!;
    conversationQueue.currentTask = task;

    try {
      // Check if this task belongs to an outdated conversation version
      if (task.conversationVersion < conversationQueue.version) {
        // Skip processing outdated tasks
        conversationQueue.status = "idle";
        this.processNextTask(conversationId);
        return;
      }

      // Decide if this should be the last message
      const isGroupChat = task.conversation.recipients.length > 1;
      const shouldWrapUp =
        task.consecutiveAiMessages === MAX_CONSECUTIVE_AI_MESSAGES - 1;

      // Make API request without showing typing indicator yet
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipients: task.conversation.recipients,
          messages: task.conversation.messages,
          shouldWrapUp,
          isFirstMessage: task.isFirstMessage,
          isOneOnOne: task.conversation.recipients.length === 1,
          shouldReact: Math.random() < 0.5,
        }),
        signal: task.abortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch");
      }

      const data = await response.json();

      // Handle reactions first if any
      if (data.reaction && task.conversation.messages.length > 0) {
        const lastMessage =
          task.conversation.messages[task.conversation.messages.length - 1];
        if (!lastMessage.reactions) {
          lastMessage.reactions = [];
        }
        lastMessage.reactions.push({
          type: data.reaction,
          sender: data.sender,
          timestamp: new Date().toISOString(),
        });
        if (this.callbacks.onMessageUpdated) {
          this.callbacks.onMessageUpdated(
            task.conversation.id,
            lastMessage.id,
            {
              reactions: lastMessage.reactions,
            }
          );
        }

        // Delay to show reaction before typing animation
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }

      // Now that we have the sender from the API response, start the typing animation
      const typingDelay = task.priority === 1 ? 4000 : 7000; // Faster for user responses
      this.callbacks.onTypingStatusChange(conversationId, data.sender);
      await new Promise((resolve) =>
        setTimeout(resolve, typingDelay + Math.random() * 2000)
      );

      // Create and send the message
      const newMessage: Message = {
        id: Math.random().toString(),
        content: data.content,
        sender: data.sender,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Notify of new message
      this.callbacks.onMessageGenerated(conversationId, newMessage);

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
          task.conversationVersion === conversationQueue.version &&
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
      conversationQueue.status = "idle";
      conversationQueue.currentTask = null;
      this.processNextTask(conversationId); // Process next task if available
    }
  }

  // Cancels all tasks in the queue and resets the queue state
  public cancelAllTasks(conversationId: string) {
    // Cancel current task if exists
    const conversationQueue = this.getOrCreateConversationQueue(conversationId);
    if (conversationQueue.currentTask) {
      conversationQueue.currentTask.abortController.abort();
    }

    // Cancel all pending tasks
    for (const task of conversationQueue.tasks) {
      task.abortController.abort();
    }

    // Clear the queue
    conversationQueue.tasks = [];
    conversationQueue.status = "idle";
    conversationQueue.currentTask = null;

    // Clear typing status
    this.callbacks.onTypingStatusChange(null, null);
  }

  setActiveConversation(conversationId: string | null) {
    this.activeConversationId = conversationId;
  }

  getActiveConversation(): string | null {
    return this.activeConversationId;
  }
}
