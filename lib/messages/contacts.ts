import { InitialContact } from "@/data/messages/initial-contacts";

const CONTACTS_KEY = "user_contacts";

export function getUserContacts(): InitialContact[] {
  if (typeof window === "undefined") return [];
  const contacts = localStorage.getItem(CONTACTS_KEY);
  if (!contacts) return [];
  
  try {
    const parsed = JSON.parse(contacts);
    if (!Array.isArray(parsed)) {
      console.error("Invalid contacts format in localStorage");
      return [];
    }
    return parsed;
  } catch (error) {
    console.error("Error parsing saved contacts:", error);
    return [];
  }
}

export function addUserContact(name: string): InitialContact[] {
  const contacts = getUserContacts();
  const newContact: InitialContact = {
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
