import React from 'react';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Contact } from '../types';

const contacts: Contact[] = [
  {
    id: "1",
    name: "Mother ",
    initials: "M",
    lastMessage: "Take care!",
    timestamp: "9:19 AM",
  },
  {
    id: "2",
    name: "Abdul Al Tair",
    initials: "AA",
    lastMessage: "how are things post launch?",
    timestamp: "9:13 AM",
  },
  // Add more contacts as needed
]

export function Sidebar() {
  return (
    <div className="h-full w-full bg-background">
    <div className="p-4">
      <div className="relative">
        <input
          type="search"
          placeholder="Search"
          className="w-full px-3 py-2 bg-muted/50 rounded-lg text-sm focus:outline-none"
        />
      </div>
    </div>
    <ScrollArea className="h-[calc(100vh-73px)]">
      <div className="space-y-2 p-2">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
          >
            <Avatar>
              <AvatarImage src={contact.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {contact.initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{contact.name}</span>
                <span className="text-xs text-muted-foreground">
                  {contact.timestamp}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {contact.lastMessage}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  </div>
  );
}
