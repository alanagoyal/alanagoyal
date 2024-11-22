export interface Message {
  id: string;
  content: string;
  sender: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  recipient: Recipient;
  messages: Message[];
  lastMessageTime: string;
}

export interface Recipient {
  id: string;
  name: string;
  avatar?: string;
}