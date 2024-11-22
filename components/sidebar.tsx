import React from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { Contact } from "../types";
import { Icons } from "@/components/icons";

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
];

interface SidebarProps {
  children: React.ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <div className="w-80 flex flex-col border-r bg-muted">
      {children}
      <div className="flex">
        <div className="h-full w-full">
          <div className="px-4 pb-2">
            <div className="relative">
              <Icons.search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search"
                className="w-full pl-8 pr-3 py-1.5 bg-muted/50 rounded-lg text-base sm:text-sm focus:outline-none bg-transparent border"
              />
            </div>
          </div>
          <div className="space-y-2 p-2 overflow-y-auto">
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
        </div>
      </div>
    </div>
  );
}
