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
  recipients: Recipient[];
  isMobileView?: boolean;
  conversationId?: string;
}

export function MessageInput({
  message,
  setMessage,
  handleSend,
  disabled = false,
  recipients,
  isMobileView = false,
  conversationId,
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
    autofocus: !isMobileView ? 'end' : false,
    onUpdate: ({ editor }) => {
      const content = editor.getHTML();
      if (content !== message) {
        setMessage(content);
      }
    },
    onCreate: ({ editor }) => {
      if (!isMobileView) {
        editor.commands.focus('end')
      }
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
    if (editor && conversationId && !isMobileView) {
      editor.commands.focus('end');
    }
  }, [editor, conversationId, isMobileView]);

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
          console.log('Attempting to blur editor')
          editor.commands.blur()
          console.log('Editor focused after blur:', editor.isFocused)
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
    if (editor && message !== editor.getHTML()) {
      editor.commands.setContent(message)
    }
  }, [message, editor])

  useEffect(() => {
    if (editor) {
      console.log('Editor mounted:', editor.isFocused)
    }
  }, [editor])

  useEffect(() => {
    if (editor) {
      editor.destroy();
    }
  }, [conversationId])

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
}
