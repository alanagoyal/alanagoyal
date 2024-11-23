import { Icons } from "./icons";
import { ThemeToggle } from "./theme-toggle";
import { Conversation } from "../types";

interface ChatHeaderProps {
  isNewChat: boolean;
  recipientInput: string;
  setRecipientInput: (value: string) => void;
  handleCreateChat: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  onBack?: () => void;
  isMobileView?: boolean;
  activeConversation?: Conversation;
}

export function ChatHeader({
  isNewChat,
  recipientInput,
  setRecipientInput,
  handleCreateChat,
  onBack,
  isMobileView,
  activeConversation,
}: ChatHeaderProps) {
  return (
    <div className="h-auto min-h-12 flex items-center justify-between p-2 sm:p-4 border-b dark:border-foreground/20 bg-muted">
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
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                onKeyDown={handleCreateChat}
                placeholder="Enter recipients (separate by comma)"
                className="flex-1 bg-transparent outline-none text-sm"
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {activeConversation?.recipients.map(r => r.name).join(', ')}
            </span>
          </div>
        )}
      </div>
      <ThemeToggle />
    </div>
  );
}
