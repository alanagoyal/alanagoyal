export interface Message {
  id: string;
  content: string;
  htmlContent?: string;  
  sender: "me" | "system" | string;
  timestamp: string;
  type?: "silenced";
  mentions?: { id: string; name: string; }[];
  reactions?: Reaction[];
}

export interface Conversation {
  id: string;
  name?: string;
  recipients: Recipient[];
  messages: Message[];
  lastMessageTime: string;
  unreadCount: number;
  pinned?: boolean;
  isTyping?: boolean;
  hideAlerts?: boolean;
}

export interface Recipient {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  title?: string;
}

export type ReactionType = 'heart' | 'like' | 'dislike' | 'laugh' | 'emphasize' | 'question';

export interface Reaction {
  type: ReactionType;
  sender: string;
  timestamp: string;
}