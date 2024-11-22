import React from "react";
import { Conversation } from "../types";
import { SearchBar } from "./search-bar";

interface SidebarProps {
  children: React.ReactNode;
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
}

export function Sidebar({ 
  children, 
  conversations, 
  activeConversation,
  onSelectConversation 
}: SidebarProps) {
  return (
    <div className="w-80 flex flex-col border-r bg-muted">
      {children}
      <SearchBar value="" onChange={() => {}} />
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 text-left hover:bg-muted-foreground/10 ${
              activeConversation === conversation.id ? 'bg-muted-foreground/20' : ''
            }`}
          >
            <div className="flex flex-col gap-1">
              <span className="font-medium">{conversation.recipient}</span>
              {conversation.messages.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {conversation.messages[conversation.messages.length - 1].content}
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
