import React from "react";
import { Contact } from "../types";
import { ContactList } from "./contact-list";

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
      <ContactList contacts={contacts} />
    </div>
  );
}
