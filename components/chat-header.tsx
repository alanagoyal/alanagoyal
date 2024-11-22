interface ChatHeaderProps {
  isNewChat: boolean;
  recipient: string;
  setRecipient: (value: string) => void;
  handleCreateChat: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function ChatHeader({ 
  isNewChat, 
  recipient, 
  setRecipient, 
  handleCreateChat,
}: ChatHeaderProps) {

  return (
    <div className="h-12 flex items-center justify-between p-4 border-b bg-muted">
      {isNewChat ? (
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">To:</span>
            <input
              type="text"
              value={recipient}
              onChange={(e) => {
                setRecipient(e.target.value);
              }}
              onKeyDown={handleCreateChat}
              className="flex-1 bg-transparent outline-none text-sm"
              autoFocus
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <span className="font-medium">{recipient}</span>
        </div>
      )}
    </div>
  );
}
