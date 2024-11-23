import { Icons } from "./icons";

interface ChatHeaderProps {
  isNewChat: boolean;
  recipient: string;
  setRecipient: (value: string) => void;
  handleCreateChat: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBack?: () => void;
  isMobileView?: boolean;
}

export function ChatHeader({
  isNewChat,
  recipient,
  setRecipient,
  handleCreateChat,
  onBack,
  isMobileView,
}: ChatHeaderProps) {
  return (
    <div className="h-12 flex items-center justify-between p-2 sm:p-4 border-b bg-muted">
      <div className="flex items-center gap-2 flex-1">
        {isMobileView && (
          <button
            onClick={onBack}
            className="hover:bg-background rounded-sm"
            aria-label="Back to conversations"
          >
            <Icons.back />
          </button>
        )}
        {isNewChat ? (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">
                To:
              </span>
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
            <span className="text-sm font-medium text-muted-foreground">
              To:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm">{recipient}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
