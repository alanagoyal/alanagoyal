"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, FolderOpen, Pencil, Plus, Save, X } from "lucide-react";
import { useClickOutside } from "@/lib/hooks/use-click-outside";
import { cn } from "@/lib/utils";

interface TextEditFileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNew: () => void;
  onOpen: () => void;
  onCloseDocument: () => void;
  onSave: () => void;
  onDuplicate: () => void;
  onRename: () => void;
  renameDisabled?: boolean;
}

const COMMANDS = [
  { id: "new", label: "New", icon: Plus },
  { id: "open", label: "Open…", icon: FolderOpen },
  { id: "separator" },
  { id: "close", label: "Close", icon: X },
  { id: "save", label: "Save", icon: Save },
  { id: "duplicate", label: "Duplicate", icon: Copy },
  { id: "rename", label: "Rename…", icon: Pencil },
] as const;

export function TextEditFileMenu({
  isOpen,
  onClose,
  onNew,
  onOpen,
  onCloseDocument,
  onSave,
  onDuplicate,
  onRename,
  renameDisabled = false,
}: TextEditFileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  useClickOutside(menuRef, onClose, isOpen);

  if (!isOpen) return null;

  const handlers = {
    new: onNew,
    open: onOpen,
    close: onCloseDocument,
    save: onSave,
    duplicate: onDuplicate,
    rename: onRename,
  };

  return (
    <div
      ref={menuRef}
      data-testid="textedit-file-menu"
      className="absolute left-[120px] top-7 z-[70] w-60 overflow-hidden rounded-xl border border-black/10 bg-white/95 py-1.5 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-zinc-800/95"
    >
      {COMMANDS.map((command) => {
        if (command.id === "separator") {
          return <div key="separator" className="mx-3 my-1 border-t border-black/10 dark:border-white/10" />;
        }

        const disabled = command.id === "rename" && renameDisabled;
        const Icon = command.icon;
        return (
          <button
            key={command.id}
            type="button"
            disabled={disabled}
            title={disabled ? "GitHub project files can’t be renamed here" : undefined}
            onClick={() => {
              handlers[command.id]();
              onClose();
            }}
            className={cn(
              "flex w-full items-center gap-3 px-3 py-1.5 text-left text-sm transition-colors",
              "can-hover:hover:bg-blue-500 can-hover:hover:text-white",
              "disabled:pointer-events-none disabled:opacity-40"
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.8} />
            <span>{command.label}</span>
          </button>
        );
      })}
    </div>
  );
}

interface TextEditRenameDialogProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onRename: (fileName: string) => string | null;
}

export function TextEditRenameDialog({
  isOpen,
  initialName,
  onClose,
  onRename,
}: TextEditRenameDialogProps) {
  const [fileName, setFileName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setFileName(initialName);
    setError(null);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      const extensionIndex = initialName.lastIndexOf(".");
      inputRef.current?.setSelectionRange(0, extensionIndex > 0 ? extensionIndex : initialName.length);
    });
  }, [initialName, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/20 backdrop-blur-[1px]">
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="textedit-rename-title"
        className="w-[340px] rounded-2xl border border-black/10 bg-zinc-100 p-5 text-zinc-900 shadow-2xl dark:border-white/10 dark:bg-zinc-800 dark:text-zinc-100"
        onSubmit={(event) => {
          event.preventDefault();
          const nextError = onRename(fileName);
          if (nextError) {
            setError(nextError);
            return;
          }
          onClose();
        }}
      >
        <h2 id="textedit-rename-title" className="text-center text-sm font-semibold">Rename document</h2>
        <input
          ref={inputRef}
          aria-label="File name"
          value={fileName}
          onChange={(event) => {
            setFileName(event.target.value);
            setError(null);
          }}
          className="mt-4 h-8 w-full rounded-md border border-zinc-300 bg-white px-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-900"
        />
        <div aria-live="polite" className="mt-1 min-h-4 text-xs text-red-600 dark:text-red-400">
          {error}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-zinc-200 px-4 py-1.5 text-sm can-hover:hover:bg-zinc-300 dark:bg-zinc-700 dark:can-hover:hover:bg-zinc-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-blue-500 px-4 py-1.5 text-sm text-white can-hover:hover:bg-blue-600"
          >
            Rename
          </button>
        </div>
      </form>
    </div>
  );
}
