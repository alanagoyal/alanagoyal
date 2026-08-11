"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import {
  Bell,
  BellOff,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import {
  type ReactElement,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  canStartMobileConversationLongPress,
  didMobileConversationLongPressMove,
  getConversationDisplayName,
  getConversationPreviewMessages,
  isConversationContextMenuKeyboardShortcut,
  MOBILE_CONVERSATION_LONG_PRESS_DELAY_MS,
} from "@/lib/messages/mobile-conversation-interactions";
import type { Conversation } from "@/types/messages";
import { getConversationReadStateLabel } from "@/lib/messages/read-state";

const MOBILE_CONVERSATION_EXPAND_DURATION_MS = 320;

interface TriggerBounds {
  top: number;
  left: number;
  width: number;
  height: number;
}

function ReadStateMessageIcon({
  className = "h-5 w-5 shrink-0",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
    >
      <path
        d="M15.7 4.45c-1.2-.36-2.52-.55-3.9-.55-4.86 0-8.4 2.87-8.4 6.67 0 1.62.67 3.1 1.86 4.22l-.82 2.79 3.1-1.17c1.22.49 2.65.76 4.26.76 4.82 0 8.33-2.79 8.33-6.6 0-.89-.19-1.72-.55-2.47"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19.15" cy="4.8" r="2.7" fill="currentColor" />
    </svg>
  );
}

interface ConversationContextActionsProps {
  conversation: Conversation;
  isMobileView: boolean;
  children: ReactElement;
  onPinToggle: () => void;
  onToggleReadState: () => void;
  onToggleAlerts: () => void;
  onDelete: () => void;
  onOpenConversation: () => void;
  onPreviewOpen?: () => void;
}

function MobileConversationPreview({
  conversation,
  open,
  sourceBounds,
  onOpenChange,
  onRestoreFocus,
  onOpenConversation,
  onPinToggle,
  onToggleReadState,
  onToggleAlerts,
  onDelete,
}: {
  conversation: Conversation;
  open: boolean;
  sourceBounds: TriggerBounds | null;
  onOpenChange: (open: boolean) => void;
  onRestoreFocus: () => void;
  onOpenConversation: () => void;
  onPinToggle: () => void;
  onToggleReadState: () => void;
  onToggleAlerts: () => void;
  onDelete: () => void;
}) {
  const previewRef = useRef<HTMLButtonElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const displayName = getConversationDisplayName(conversation);
  const previewMessages = getConversationPreviewMessages(conversation);
  const isGroupConversation = conversation.recipients.length > 1;
  const readStateLabel = getConversationReadStateLabel(conversation);

  useEffect(() => {
    if (open) window.getSelection()?.removeAllRanges();
  }, [open]);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const actions = actionsRef.current;
    if (!open || !sourceBounds || !preview || !actions) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const targetBounds = preview.getBoundingClientRect();
    const translateX =
      sourceBounds.left +
      sourceBounds.width / 2 -
      (targetBounds.left + targetBounds.width / 2);
    const translateY =
      sourceBounds.top +
      sourceBounds.height / 2 -
      (targetBounds.top + targetBounds.height / 2);
    const scaleX = sourceBounds.width / targetBounds.width;
    const scaleY = sourceBounds.height / targetBounds.height;
    const sourceRadius = sourceBounds.width <= 96 ? "16px" : "10px";

    const previewAnimation = preview.animate(
      [
        {
          transform: `translate3d(${translateX}px, ${translateY}px, 0) scale(${scaleX}, ${scaleY})`,
          borderRadius: sourceRadius,
        },
        {
          transform: "translate3d(0, 0, 0) scale(1, 1)",
          borderRadius: "28px",
        },
      ],
      {
        duration: MOBILE_CONVERSATION_EXPAND_DURATION_MS,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "both",
      },
    );
    const actionsAnimation = actions.animate(
      [
        { opacity: 0, transform: "translateY(-10px) scale(0.97)" },
        { opacity: 1, transform: "translateY(0) scale(1)" },
      ],
      {
        duration: 170,
        delay: MOBILE_CONVERSATION_EXPAND_DURATION_MS - 110,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
        fill: "both",
      },
    );

    return () => {
      previewAnimation.cancel();
      actionsAnimation.cancel();
    };
  }, [open, sourceBounds]);

  const runAction = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/25 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          onClick={(event) => {
            if (event.target === event.currentTarget) onOpenChange(false);
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            onRestoreFocus();
          }}
          className="fixed left-1/2 top-1/2 z-[91] max-h-[calc(100dvh-2rem)] w-full max-w-[560px] -translate-x-1/2 -translate-y-1/2 overflow-y-auto px-4 outline-none"
        >
          <DialogPrimitive.Title className="sr-only">
            Conversation actions for {displayName}
          </DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Preview or open the conversation, then change its read state, pin,
            change alerts, or delete it.
          </DialogPrimitive.Description>

          <button
            ref={previewRef}
            type="button"
            aria-label={`Open conversation with ${displayName}`}
            onClick={() => runAction(onOpenConversation)}
            className="flex h-[min(50dvh,30rem)] min-h-64 w-full flex-col overflow-hidden rounded-[28px] border border-muted-foreground/15 bg-background text-left shadow-2xl outline-none will-change-transform"
          >
            <header className="w-full shrink-0 px-5 pb-4 pt-4 text-center">
              <h2 className="truncate text-[18px] font-semibold leading-6">
                {displayName}
              </h2>
              <p className="text-[13px] leading-5 text-muted-foreground">
                iMessage
              </p>
            </header>

            <div className="min-h-0 flex-1 overflow-hidden px-4 pb-5">
              {previewMessages.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No messages yet
                </div>
              ) : (
                <div className="flex h-full flex-col justify-end gap-2">
                  {previewMessages.map((message) => {
                    const isMe = message.sender === "me";

                    return (
                      <div
                        key={message.id}
                        className={`flex flex-col ${
                          isMe ? "items-end" : "items-start"
                        }`}
                      >
                        {!isMe && isGroupConversation && (
                          <span className="mb-0.5 max-w-[78%] truncate px-3 text-[11px] text-muted-foreground">
                            {message.sender}
                          </span>
                        )}
                        <div
                          className={`max-w-[82%] whitespace-pre-wrap break-words rounded-[19px] px-3 py-2 text-[15px] leading-5 ${
                            isMe
                              ? "rounded-br-md bg-[#0A7CFF] text-white"
                              : "rounded-bl-md bg-muted text-foreground"
                          }`}
                        >
                          <span className="line-clamp-3">{message.content}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </button>

          <div
            ref={actionsRef}
            className="mx-auto mt-3 w-[calc(100%-3rem)] max-w-sm overflow-hidden rounded-[22px] border border-muted-foreground/15 bg-background/95 shadow-2xl backdrop-blur-xl will-change-transform"
          >
            <button
              type="button"
              onClick={() => runAction(onPinToggle)}
              className="flex h-14 w-full items-center gap-3 px-5 text-left text-[17px] outline-none active:bg-muted focus-visible:bg-muted"
            >
              {conversation.pinned ? (
                <PinOff className="h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <Pin className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span>{conversation.pinned ? "Unpin" : "Pin"}</span>
            </button>
            <div className="mx-5 border-t border-muted-foreground/20" />
            <button
              type="button"
              onClick={() => runAction(onToggleReadState)}
              className="flex h-14 w-full items-center gap-3 px-5 text-left text-[17px] outline-none active:bg-muted focus-visible:bg-muted"
            >
              <ReadStateMessageIcon />
              <span>{readStateLabel}</span>
            </button>
            <div className="mx-5 border-t border-muted-foreground/20" />
            <button
              type="button"
              onClick={() => runAction(onToggleAlerts)}
              className="flex h-14 w-full items-center gap-3 px-5 text-left text-[17px] outline-none active:bg-muted focus-visible:bg-muted"
            >
              {conversation.hideAlerts ? (
                <Bell className="h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <BellOff className="h-5 w-5 shrink-0" aria-hidden />
              )}
              <span>
                {conversation.hideAlerts ? "Show Alerts" : "Hide Alerts"}
              </span>
            </button>
            <div className="mx-5 border-t border-muted-foreground/20" />
            <button
              type="button"
              onClick={() => runAction(onDelete)}
              className="flex h-14 w-full items-center gap-3 px-5 text-left text-[17px] text-red-600 outline-none active:bg-muted focus-visible:bg-muted"
            >
              <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
              <span>Delete</span>
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ConversationContextActions({
  conversation,
  isMobileView,
  children,
  onPinToggle,
  onToggleReadState,
  onToggleAlerts,
  onDelete,
  onOpenConversation,
  onPreviewOpen,
}: ConversationContextActionsProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [sourceBounds, setSourceBounds] = useState<TriggerBounds | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const focusTargetRef = useRef<HTMLElement | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const longPressOriginRef = useRef<{ x: number; y: number } | null>(null);
  const suppressNextClickRef = useRef(false);
  const shouldRestoreFocusRef = useRef(false);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    longPressOriginRef.current = null;
  }, []);

  useEffect(() => clearLongPressTimer, [clearLongPressTimer]);

  const openMobilePreview = useCallback(
    ({
      restoreFocus = false,
      suppressClick = false,
      focusTarget = null,
    }: {
      restoreFocus?: boolean;
      suppressClick?: boolean;
      focusTarget?: HTMLElement | null;
    } = {}) => {
      const bounds = triggerRef.current?.getBoundingClientRect();
      if (bounds) {
        setSourceBounds({
          top: bounds.top,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
        });
      }
      window.getSelection()?.removeAllRanges();
      suppressNextClickRef.current = suppressClick;
      shouldRestoreFocusRef.current = restoreFocus;
      focusTargetRef.current = focusTarget;
      onPreviewOpen?.();
      setIsPreviewOpen(true);
      clearLongPressTimer();
    },
    [clearLongPressTimer, onPreviewOpen],
  );

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (
      !event.isPrimary ||
      !canStartMobileConversationLongPress(event.pointerType)
    ) {
      return;
    }

    clearLongPressTimer();
    suppressNextClickRef.current = false;
    longPressOriginRef.current = { x: event.clientX, y: event.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      openMobilePreview({ suppressClick: true });
    }, MOBILE_CONVERSATION_LONG_PRESS_DELAY_MS);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const origin = longPressOriginRef.current;
    if (
      origin &&
      didMobileConversationLongPressMove(origin, {
        x: event.clientX,
        y: event.clientY,
      })
    ) {
      clearLongPressTimer();
    }
  };

  const handlePointerEnd = () => {
    clearLongPressTimer();
  };

  const handleClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!suppressNextClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    suppressNextClickRef.current = false;
  };

  const handleContextMenu = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    openMobilePreview({ suppressClick: true });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      !isConversationContextMenuKeyboardShortcut(event.key, event.shiftKey)
    ) {
      return;
    }

    event.preventDefault();
    const focusTarget =
      event.target instanceof HTMLElement ? event.target : triggerRef.current;
    openMobilePreview({ restoreFocus: true, focusTarget });
  };

  const handlePreviewOpenChange = (open: boolean) => {
    setIsPreviewOpen(open);
    if (!open) suppressNextClickRef.current = false;
  };

  const restoreFocus = useCallback(() => {
    if (shouldRestoreFocusRef.current) {
      focusTargetRef.current?.focus();
      shouldRestoreFocusRef.current = false;
    }
  }, []);

  if (!isMobileView) {
    return (
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            className="focus:rounded-md focus:bg-[#0A7CFF] focus:text-white"
            onClick={onToggleReadState}
          >
            <ReadStateMessageIcon className="h-4 w-4 shrink-0" />
            <span>{getConversationReadStateLabel(conversation)}</span>
          </ContextMenuItem>
          <ContextMenuItem
            className="focus:rounded-md focus:bg-[#0A7CFF] focus:text-white"
            onClick={onPinToggle}
          >
            {conversation.pinned ? (
              <PinOff className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            ) : (
              <Pin className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            )}
            <span>{conversation.pinned ? "Unpin" : "Pin"}</span>
          </ContextMenuItem>
          <ContextMenuItem
            className="focus:rounded-md focus:bg-[#0A7CFF] focus:text-white"
            onClick={onToggleAlerts}
          >
            {conversation.hideAlerts ? (
              <Bell className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            ) : (
              <BellOff className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            )}
            <span>
              {conversation.hideAlerts ? "Show Alerts" : "Hide Alerts"}
            </span>
          </ContextMenuItem>
          <ContextMenuItem
            className="text-red-600 focus:rounded-md focus:bg-[#0A7CFF] focus:text-white"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4 shrink-0" strokeWidth={1.8} aria-hidden />
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  }

  return (
    <>
      <Slot
        ref={triggerRef}
        className="messages-context-menu-trigger select-none"
        onClickCapture={handleClickCapture}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        aria-haspopup="dialog"
        aria-expanded={isPreviewOpen}
      >
        {children}
      </Slot>
      <MobileConversationPreview
        conversation={conversation}
        open={isPreviewOpen}
        sourceBounds={sourceBounds}
        onOpenChange={handlePreviewOpenChange}
        onRestoreFocus={restoreFocus}
        onOpenConversation={onOpenConversation}
        onPinToggle={onPinToggle}
        onToggleReadState={onToggleReadState}
        onToggleAlerts={onToggleAlerts}
        onDelete={onDelete}
      />
    </>
  );
}
