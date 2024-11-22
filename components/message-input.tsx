interface MessageInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSend: () => void;
}

export function MessageInput({ message, setMessage, handleSend }: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="p-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyPress}
          className="flex-1 bg-transparent border rounded-full px-3 py-2 text-base sm:text-sm focus:outline-none"
        />
      </div>
    </div>
  );
}
