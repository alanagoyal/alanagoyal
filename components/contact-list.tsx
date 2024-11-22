import { Contact } from "../types";
import { ContactCard } from "./contact-card";
import { SearchBar } from "./search-bar";
import { useState } from "react";

interface ContactListProps {
  contacts: Contact[];
  onSelectContact?: (contact: Contact) => void;
}

export function ContactList({ contacts, onSelectContact }: ContactListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />
      <div className="space-y-2 p-2 overflow-y-auto">
        {filteredContacts.map((contact) => (
          <ContactCard
            key={contact.id}
            contact={contact}
            onClick={() => onSelectContact?.(contact)}
          />
        ))}
      </div>
    </div>
  );
}
