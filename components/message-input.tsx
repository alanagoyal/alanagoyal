interface MessageInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSend: () => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export function MessageInput({ 
  message, 
  setMessage, 
  handleSend,
  disabled = false,
  inputRef 
}: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4 border-t">

    <div className="flex gap-2 items-center">
      <input
        ref={inputRef}
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyPress}
        disabled={disabled}
        placeholder="Type a message..."
        className="flex-1 bg-transparent border rounded-full px-4 py-2 text-sm focus:outline-none disabled:opacity-50"
      />
      </div>
    </div>
  );
}
