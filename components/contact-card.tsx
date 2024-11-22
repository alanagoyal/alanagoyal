import { Contact } from "../types";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface ContactCardProps {
  contact: Contact;
  onClick?: () => void;
}

export function ContactCard({ contact, onClick }: ContactCardProps) {
  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
    >
      <Avatar>
        <AvatarImage src={contact.avatar} />
        <AvatarFallback>{contact.initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start">
          <p className="font-medium truncate">{contact.name}</p>
          <span className="text-xs text-muted-foreground">{contact.timestamp}</span>
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {contact.lastMessage}
        </p>
      </div>
    </div>
  );
}
