export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  recipients: Recipient[];
  messages: Message[];
  lastMessageTime: string;
  unreadCount: number;
}

export interface Recipient {
  id: string;
  name: string;
  avatar?: string;
}