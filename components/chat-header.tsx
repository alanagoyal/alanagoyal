import { Icons } from "./icons";

interface ChatHeaderProps {
  isNewChat: boolean;
  recipient: string;
  setRecipient: (value: string) => void;
  handleCreateChat: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  setIsNewChat: (value: boolean) => void;
}

export function ChatHeader({ 
  isNewChat, 
  recipient, 
  setRecipient, 
  handleCreateChat,
  setIsNewChat 
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4 h-16 border-b">
      {isNewChat ? (
        <div className="flex-1">
          <input
            type="text"
            placeholder="To:"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            onKeyDown={handleCreateChat}
            className="w-full bg-transparent focus:outline-none"
            autoFocus
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{recipient || "Ankur "}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button 
          className="p-2 hover:bg-muted rounded-lg"
          onClick={() => {
            setIsNewChat(true);
            setRecipient("");
          }}
        >
          <Icons.info />
        </button>
      </div>
    </div>
  );
}
