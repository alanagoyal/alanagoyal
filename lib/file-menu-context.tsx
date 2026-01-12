"use client";

import { createContext, useContext, useRef, useCallback, ReactNode } from "react";

interface FileMenuActions {
  // Notes actions
  onNewNote?: () => void;
  onPinNote?: () => void;
  onDeleteNote?: () => void;
  noteIsPinned?: boolean;
  // Messages actions
  onNewChat?: () => void;
  onPinChat?: () => void;
  onHideAlerts?: () => void;
  onDeleteChat?: () => void;
  chatIsPinned?: boolean;
  hideAlertsActive?: boolean;
}

interface FileMenuContextValue {
  getActions: () => FileMenuActions;
  registerNotesActions: (actions: {
    onNewNote: () => void;
    onPinNote: () => void;
    onDeleteNote: () => void;
  }) => void;
  unregisterNotesActions: () => void;
  updateNotesState: (state: { noteIsPinned: boolean }) => void;
  registerMessagesActions: (actions: {
    onNewChat: () => void;
    onPinChat: () => void;
    onHideAlerts: () => void;
    onDeleteChat: () => void;
  }) => void;
  unregisterMessagesActions: () => void;
  updateMessagesState: (state: { chatIsPinned: boolean; hideAlertsActive: boolean }) => void;
}

const FileMenuContext = createContext<FileMenuContextValue | null>(null);

export function FileMenuProvider({ children }: { children: ReactNode }) {
  const actionsRef = useRef<FileMenuActions>({});

  const getActions = useCallback(() => actionsRef.current, []);

  const registerNotesActions = useCallback((notesActions: {
    onNewNote: () => void;
    onPinNote: () => void;
    onDeleteNote: () => void;
  }) => {
    actionsRef.current = {
      ...actionsRef.current,
      onNewNote: notesActions.onNewNote,
      onPinNote: notesActions.onPinNote,
      onDeleteNote: notesActions.onDeleteNote,
    };
  }, []);

  const unregisterNotesActions = useCallback(() => {
    actionsRef.current = {
      ...actionsRef.current,
      onNewNote: undefined,
      onPinNote: undefined,
      onDeleteNote: undefined,
    };
  }, []);

  const updateNotesState = useCallback((state: { noteIsPinned: boolean }) => {
    actionsRef.current = {
      ...actionsRef.current,
      noteIsPinned: state.noteIsPinned,
    };
  }, []);

  const registerMessagesActions = useCallback((messagesActions: {
    onNewChat: () => void;
    onPinChat: () => void;
    onHideAlerts: () => void;
    onDeleteChat: () => void;
  }) => {
    actionsRef.current = {
      ...actionsRef.current,
      onNewChat: messagesActions.onNewChat,
      onPinChat: messagesActions.onPinChat,
      onHideAlerts: messagesActions.onHideAlerts,
      onDeleteChat: messagesActions.onDeleteChat,
    };
  }, []);

  const unregisterMessagesActions = useCallback(() => {
    actionsRef.current = {
      ...actionsRef.current,
      onNewChat: undefined,
      onPinChat: undefined,
      onHideAlerts: undefined,
      onDeleteChat: undefined,
      chatIsPinned: undefined,
      hideAlertsActive: undefined,
    };
  }, []);

  const updateMessagesState = useCallback((state: { chatIsPinned: boolean; hideAlertsActive: boolean }) => {
    actionsRef.current = {
      ...actionsRef.current,
      chatIsPinned: state.chatIsPinned,
      hideAlertsActive: state.hideAlertsActive,
    };
  }, []);

  return (
    <FileMenuContext.Provider
      value={{
        getActions,
        registerNotesActions,
        unregisterNotesActions,
        updateNotesState,
        registerMessagesActions,
        unregisterMessagesActions,
        updateMessagesState,
      }}
    >
      {children}
    </FileMenuContext.Provider>
  );
}

export function useFileMenu() {
  const context = useContext(FileMenuContext);
  return context;
}

export function useFileMenuActions() {
  const context = useContext(FileMenuContext);
  return context?.getActions() || {};
}
