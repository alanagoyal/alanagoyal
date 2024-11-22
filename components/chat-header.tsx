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
    <div className="flex items-center justify-between p-4 h-12 border-b bg-[#F7F7F7]">
      {isNewChat ? (
        <div className="flex-1 flex items-center">
          <span className="text-gray-500 mr-2 text-sm">To:</span>
          <input
            type="text"
            placeholder=""
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            onKeyDown={handleCreateChat}
            className="w-full bg-transparent focus:outline-none text-sm"
            autoFocus
          />
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-sm"><span className="text-muted-foreground">To:</span> {recipient || "Ankur"}</span>
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
