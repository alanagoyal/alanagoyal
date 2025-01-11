import { TechPersonality } from "@/data/tech-personalities";

const CONTACTS_KEY = "user_contacts";

export function getUserContacts(): TechPersonality[] {
  if (typeof window === "undefined") return [];
  const contacts = localStorage.getItem(CONTACTS_KEY);
  return contacts ? JSON.parse(contacts) : [];
}

export function addUserContact(name: string): TechPersonality[] {
  const contacts = getUserContacts();
  const newContact: TechPersonality = {
    name,
    title: "Custom Contact"
  };
  
  // Check if contact already exists
  if (!contacts.some(contact => contact.name.toLowerCase() === name.toLowerCase())) {
    contacts.push(newContact);
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  }
  
  return contacts;
}
