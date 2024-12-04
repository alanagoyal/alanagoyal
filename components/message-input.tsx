import { Recipient } from "@/types";
import { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Smile } from "lucide-react";
import { useTheme } from "next-themes";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'

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
  isMobileView = false,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention-node',
          style: 'color: #0A7CFF !important; font-weight: 500 !important;'
        },
        renderLabel: ({ node }) => {
          return node.attrs.label ?? node.attrs.id
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            if (!query) return []
            
            const searchText = query.toLowerCase().replace(/^@/, '');
            return recipients
              .filter(recipient => {
                const [firstName] = recipient.name.split(' ');
                return firstName.toLowerCase().startsWith(searchText);
              })
              .slice(0, 5)
              .map(match => ({
                id: match.id,
                label: match.name.split(' ')[0]
              }));
          },
          render: () => {
            let component: {
              element: HTMLElement;
              update: (props: { items: any[]; query: string; command: Function }) => void;
            };

            return {
              onStart: () => {
                component = {
                  element: document.createElement('div'),
                  update: (props) => {
                    if (!props.query) return;
                  
                    const match = props.items.find(item => 
                      item.label.toLowerCase() === props.query.toLowerCase().replace(/^@/, '')
                    );
                  
                    if (match) {
                      props.command({ id: match.id, label: match.label });
                    }
                  }
                };
                return component;
              },
              onUpdate: (props) => {
                component?.update(props);
              },
              onExit: () => {
                component?.element.remove();
              },
            }
          },
          char: '@',
          allowSpaces: false,
          decorationClass: 'suggestion',
        },
      }),
    ],
    content: message,
    onUpdate: ({ editor }) => {
      setMessage(editor.getText())
    },
    editorProps: {
      attributes: {
        class: 'w-full bg-transparent border border-foreground/20 rounded-full py-1 px-4 text-base sm:text-sm focus:outline-none disabled:opacity-50 prose-sm prose-neutral dark:prose-invert prose',
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSend();
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  })

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
      if (event.key === "Escape") {
        if (showEmojiPicker) {
          setShowEmojiPicker(false);
        } else if (editor) {
          editor.commands.blur()
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showEmojiPicker, editor]);

  useEffect(() => {
    if (editor && message !== editor.getText()) {
      editor.commands.setContent(message)
    }
  }, [message, editor])

  return (
    <div className="p-4 bg-background">
      <div className="flex gap-2 items-center relative">
        <EditorContent 
          editor={editor}
          className="w-full"
        />
        {!isMobileView && (
          <button
            ref={buttonRef}
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={disabled}
          >
            <Smile className="h-5 w-5" />
          </button>
        )}
        {showEmojiPicker && !isMobileView && (
          <div
            ref={pickerRef}
            className="absolute bottom-12 right-0 z-50"
            style={{ width: "352px" }}
          >
            <Picker
              data={data}
              onEmojiSelect={(emoji: any) => {
                if (editor) {
                  editor.commands.insertContent(emoji.native)
                }
                setShowEmojiPicker(false);
              }}
              theme={theme === "dark" ? "dark" : "light"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
