export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
  isMe: boolean;
}

export interface Conversation {
  id: string;
  recipient: string;
  messages: Message[];
  lastMessageTime: string;
}

export interface Contact {
  id: string;
  name: string;
  initials: string;
  lastMessage: string;
  timestamp: string;
}
