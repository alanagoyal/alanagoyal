export interface Persona {
  id: string;
  name: string;
  avatar: string;
}

export interface Message {
  id: string
  content: string
  sender: string
  timestamp: string
  isMe: boolean
}

export interface Contact {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  timestamp: string
  initials: string
}