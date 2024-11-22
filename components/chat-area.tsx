import { Icons } from "./icons";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "@/lib/utils";
import { Message } from "../types";

const messages: Message[] = [
  {
    id: "1",
    content: "good",
    sender: "me",
    timestamp: "9:30 AM",
    isMe: true,
  },
  {
    id: "2",
    content: "have you taken off yet?",
    sender: "other",
    timestamp: "9:31 AM",
    isMe: false,
  },
  // Add more messages as needed
];

export default function ChatArea() {
  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center justify-between p-4 h-12 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold">Ankur 💙</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-full">
            <Icons.phone />
          </button>
          <button className="p-2 hover:bg-muted rounded-full">
            <Icons.video />
          </button>
          <button className="p-2 hover:bg-muted rounded-full">
            <Icons.smile />
          </button>
        </div>
      </div>
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.isMe ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-lg px-4 py-2 max-w-[80%]",
                  message.isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="iMessage"
            className="flex-1 bg-transparent focus:outline-none text-sm"
          />
          <button className="p-2 hover:bg-muted rounded-full">
            <Icons.smile />
          </button>
        </div>
      </div>
    </div>
  );
}
