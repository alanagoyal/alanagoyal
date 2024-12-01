import { Recipient } from "@/types";
import { useState, useRef, useEffect } from 'react';
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { Smile } from 'lucide-react'
import { useTheme } from 'next-themes'

interface MessageInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSend: () => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  recipients: Recipient[];
  isMobileView?: boolean;
}

export function MessageInput({ 
  message, 
  setMessage, 
  handleSend,
  disabled = false,
  inputRef,
  recipients,
  isMobileView = false
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        buttonRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showEmojiPicker) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEmojiPicker]);

  // Helper function to get input styles
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
    <div className="px-4 py-2 bg-background">
      <div className="flex gap-2 items-center relative">
        <input
          ref={inputRef}
          type="text"
          value={message}
          enterKeyHint="send"
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (isMobileView) {
                (document.activeElement as HTMLElement)?.blur();
              }
              handleSend();
            } else if (e.key === 'Escape') {
              e.currentTarget.blur();
            }
          }}
          placeholder="Type a message..."
          className="w-full bg-transparent border border-foreground/20 rounded-full py-1 px-4 text-base sm:text-sm focus:outline-none disabled:opacity-50"
          style={getInputStyles()}
          disabled={disabled}
        />
        <button
          ref={buttonRef}
          type="button"
          onClick={() => !isMobileView && setShowEmojiPicker(!showEmojiPicker)}
          className={`text-muted-foreground transition-colors ${
            isMobileView ? 'hidden' : 'hover:text-foreground'
          }`}
        >
          <Smile className="h-6 w-6" />
        </button>
        {showEmojiPicker && !isMobileView && (
          <div ref={pickerRef} className="absolute bottom-full right-0 mb-2">
            <Picker
              data={data}
              onEmojiSelect={(emoji: { native: string }) => {
                setMessage(message + emoji.native);
                setShowEmojiPicker(false);
              }}
              theme={theme === 'dark' ? 'dark' : 'light'}
              previewPosition="none"
            />
          </div>
        )}
      </div>
    </div>
  );
}
