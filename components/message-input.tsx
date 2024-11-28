import { Recipient } from "@/types";

interface MessageInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSend: () => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  recipients: Recipient[];
}

export function MessageInput({ 
  message, 
  setMessage, 
  handleSend,
  disabled = false,
  inputRef,
  recipients
}: MessageInputProps) {
  const getInputStyles = () => {
    const currentMention = message.match(/@(\w+)$/);
    if (currentMention) {
      const mention = currentMention[1];
      const isValidRecipient = recipients.some(
        recipient => recipient.name.toLowerCase().startsWith(mention.toLowerCase())
      );
      return {
        color: isValidRecipient ? '#0A7CFF' : '#6b7280',
        fontWeight: isValidRecipient ? '500' : 'normal'
      };
    }
    return {
      color: 'currentColor',
      fontWeight: 'normal'
    };
  };

  return (
    <div className="p-4 bg-background">
      <div className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={disabled}
          placeholder="Type a message..."
          className="w-full bg-transparent border border-foreground/20 rounded-full px-4 py-2 text-base sm:text-sm focus:outline-none disabled:opacity-50"
          style={getInputStyles()}
        />
      </div>
    </div>
  );
}
