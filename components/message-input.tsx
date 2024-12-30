import { Recipient } from "@/types";
import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Smile, ArrowUp } from "lucide-react";
import { useTheme } from "next-themes";
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import { SuggestionProps } from '@tiptap/suggestion'
import Placeholder from '@tiptap/extension-placeholder'

interface MessageInputProps {
  message: string;
  setMessage: (value: string) => void;
  handleSend: () => void;
  disabled?: boolean;
  recipients: Recipient[];
  isMobileView?: boolean;
  conversationId?: string;
  isNewChat?: boolean;
}

// Export type for message input's focus method
export type MessageInputHandle = {
  focus: () => void;
};

// Forward ref component to expose focus method to parent
export const MessageInput = forwardRef<MessageInputHandle, Omit<MessageInputProps, 'ref'>>(function MessageInput({
  message,
  setMessage,
  handleSend,
  disabled = false,
  recipients,
  isMobileView = false,
  conversationId,
  isNewChat = false,
}, ref) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { theme } = useTheme();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type a message...',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention-node',
          style: 'color: #0A7CFF !important; font-weight: 500 !important;',
          onanimationend: 'this.classList.add("shimmer-done")'
        },
        renderText: ({ node }) => {
          // Try to find the recipient by ID to get their name
          const recipient = recipients.find(r => r.id === node.attrs.id);
          return recipient?.name.split(' ')[0] ?? node.attrs.label ?? node.attrs.id;
        },
        renderHTML: ({ node }) => {
          // Try to find the recipient by ID to get their name
          const recipient = recipients.find(r => r.id === node.attrs.id);
          const label = recipient?.name.split(' ')[0] ?? node.attrs.label ?? node.attrs.id;
          return [
            'span',
            { 
              'data-type': 'mention',
              'data-id': node.attrs.id,
              'data-label': label,
              class: 'mention-node',
              style: 'color: #0A7CFF !important; font-weight: 500 !important;'
            },
            label
          ]
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
              update: (props: { 
                items: Array<{ id: string; label: string }>;
                query: string;
                command: (attrs: { id: string; label: string }) => void;
              }) => void;
            };

            return {
              onStart: (props: SuggestionProps) => {
                const { editor } = props;
                component = {
                  element: document.createElement('div'),
                  update: (props) => {
                    if (!props.query) return;
                  
                    const match = props.items.find(item => 
                      item.label.toLowerCase() === props.query.toLowerCase().replace(/^@/, '')
                    );
                  
                    if (match) {
                      const { tr } = editor.state;
                      const start = tr.selection.from - props.query.length - 1;
                      const end = tr.selection.from;
                      
                      editor
                        .chain()
                        .focus()
                        .deleteRange({ from: start, to: end })
                        .insertContent([
                          {
                            type: 'mention',
                            attrs: { id: match.id, label: match.label }
                          }
                        ])
                        .run();
                    }
                  }
                };
                return component;
              },
              onUpdate: (props: SuggestionProps) => {
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
    autofocus: !isMobileView && !isNewChat ? 'end' : false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      if (content !== message) {
        setMessage(content);
      }
    },
    onCreate: ({ editor }) => {
      if (!isMobileView && !isNewChat) {
        editor.commands.focus('end')
      }
    },
    editorProps: {
      attributes: {
        class: 'w-full bg-background/80 border border-foreground/20 rounded-full py-1 px-4 text-base sm:text-sm focus:outline-none disabled:opacity-50 prose-sm prose-neutral dark:prose-invert prose whitespace-nowrap overflow-x-auto flex items-center',
        enterKeyHint: 'send',
        style: 'height: 32px; overflow-y: hidden; line-height: 32px;'
      },
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          handleSend();
          if (isMobileView) {
            view.dom.blur();
          }
          return true;
        }
        return false;
      },
    },
    immediatelyRender: false,
  })

  // Expose focus method to parent through ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      // Focus editor at end of content
      if (editor) {
        editor.commands.focus('end');
      }
    }
  }), [editor]);

  useEffect(() => {
    if (editor && message !== editor.getHTML()) {
      editor.commands.setContent(message)
    }
  }, [message, editor, isMobileView, disabled, conversationId]);

  useEffect(() => {
    const isNewChat = conversationId === undefined;
    const shouldDestroyEditor = editor && !isNewChat;
    
    if (shouldDestroyEditor) {
      editor.destroy();
    }
  }, [conversationId])

  useEffect(() => {
    if (editor && conversationId && !isMobileView && !isNewChat) {
      editor.commands.focus('end');
    }
  }, [editor, conversationId, isMobileView, isNewChat]);

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

  return (
    <div className="h-16 sticky bottom-0 z-10 w-full bg-background/50 backdrop-blur-md p-4">
      <div className="flex gap-2 items-center relative">
        <div className="relative w-full">
          <EditorContent 
            editor={editor}
            className="w-full"
          />
          {isMobileView && editor?.getText().trim() && (
            <button
              onClick={handleSend}
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 rounded-full p-1 text-white transition-colors"
              disabled={disabled}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
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
              onEmojiSelect={(emoji: { native: string }) => {
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
});
