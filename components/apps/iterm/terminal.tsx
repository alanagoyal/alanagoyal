"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";

const USERNAME = "alanagoyal";
const HOSTNAME = "Alanas-MacBook-Air";
const HOME_DIR = "/Users/alanagoyal";

// Simulated file system
const FILE_SYSTEM: Record<string, { type: "dir" | "file"; contents?: string[] }> = {
  "/": { type: "dir", contents: ["Users", "Applications", "System", "Library"] },
  "/Users": { type: "dir", contents: ["alanagoyal", "Shared"] },
  "/Users/alanagoyal": { type: "dir", contents: ["Desktop", "Documents", "Downloads", "Projects"] },
  "/Users/alanagoyal/Desktop": { type: "dir", contents: ["notes.txt", "todo.md"] },
  "/Users/alanagoyal/Documents": { type: "dir", contents: ["resume.pdf", "cover-letter.docx"] },
  "/Users/alanagoyal/Downloads": { type: "dir", contents: [] },
  "/Users/alanagoyal/Projects": { type: "dir", contents: ["alanagoyal", "basecase", "docsum"] },
  "/Users/alanagoyal/Projects/alanagoyal": { type: "dir", contents: ["package.json", "README.md", "src", "public"] },
  "/Applications": { type: "dir", contents: ["iTerm.app", "Safari.app", "Notes.app", "Messages.app"] },
  "/System": { type: "dir", contents: ["Library"] },
  "/Library": { type: "dir", contents: ["Fonts", "Preferences"] },
};

interface HistoryEntry {
  type: "input" | "output";
  content: string;
  prompt?: string;
}

interface TerminalProps {
  isMobile?: boolean;
}

export function Terminal({ isMobile = false }: TerminalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: "output", content: "Welcome to iTerm2 - Type 'help' for available commands" },
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentDir, setCurrentDir] = useState(HOME_DIR);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const getPrompt = useCallback(() => {
    const displayDir = currentDir === HOME_DIR ? "~" : currentDir.replace(HOME_DIR, "~");
    return `${USERNAME}@${HOSTNAME} ${displayDir} % `;
  }, [currentDir]);

  // Auto-scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Focus input on click
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const resolvePath = useCallback((path: string): string => {
    if (path.startsWith("~")) {
      path = HOME_DIR + path.slice(1);
    }
    if (!path.startsWith("/")) {
      path = currentDir + "/" + path;
    }
    // Normalize path (handle .. and .)
    const parts = path.split("/").filter(Boolean);
    const resolved: string[] = [];
    for (const part of parts) {
      if (part === "..") {
        resolved.pop();
      } else if (part !== ".") {
        resolved.push(part);
      }
    }
    return "/" + resolved.join("/") || "/";
  }, [currentDir]);

  const executeCommand = useCallback((input: string) => {
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    let output = "";

    switch (cmd) {
      case "":
        break;

      case "help":
        output = `Available commands:
  help          - Show this help message
  clear         - Clear the terminal
  pwd           - Print working directory
  cd <dir>      - Change directory
  ls [dir]      - List directory contents
  cat <file>    - Display file contents (simulated)
  echo <text>   - Print text to terminal
  whoami        - Display current user
  hostname      - Display hostname
  date          - Display current date/time
  uptime        - Display system uptime
  history       - Show command history
  mkdir <dir>   - Create directory (simulated)
  touch <file>  - Create file (simulated)
  rm <file>     - Remove file (simulated)
  neofetch      - Display system info`;
        break;

      case "clear":
        setHistory([]);
        return;

      case "pwd":
        output = currentDir;
        break;

      case "cd": {
        const target = args[0] || HOME_DIR;
        const newPath = resolvePath(target);
        if (FILE_SYSTEM[newPath]?.type === "dir") {
          setCurrentDir(newPath);
        } else if (FILE_SYSTEM[newPath]) {
          output = `cd: not a directory: ${args[0]}`;
        } else {
          output = `cd: no such file or directory: ${args[0]}`;
        }
        break;
      }

      case "ls": {
        const target = args[0] ? resolvePath(args[0]) : currentDir;
        const dir = FILE_SYSTEM[target];
        if (dir?.type === "dir") {
          output = dir.contents?.join("  ") || "";
        } else if (dir) {
          output = args[0] || target.split("/").pop() || "";
        } else {
          output = `ls: ${args[0] || target}: No such file or directory`;
        }
        break;
      }

      case "cat": {
        if (!args[0]) {
          output = "cat: missing operand";
        } else {
          const path = resolvePath(args[0]);
          const file = FILE_SYSTEM[path];
          if (file?.type === "file") {
            output = `[Contents of ${args[0]}]`;
          } else if (file?.type === "dir") {
            output = `cat: ${args[0]}: Is a directory`;
          } else {
            output = `cat: ${args[0]}: No such file or directory`;
          }
        }
        break;
      }

      case "echo":
        output = args.join(" ");
        break;

      case "whoami":
        output = USERNAME;
        break;

      case "hostname":
        output = HOSTNAME;
        break;

      case "date":
        output = new Date().toString();
        break;

      case "uptime": {
        const hours = Math.floor(Math.random() * 100) + 1;
        const mins = Math.floor(Math.random() * 60);
        output = ` ${new Date().toLocaleTimeString()}  up ${hours} days, ${mins} mins, 1 user, load averages: 1.52 1.48 1.45`;
        break;
      }

      case "history":
        output = commandHistory.map((cmd, i) => `  ${i + 1}  ${cmd}`).join("\n");
        break;

      case "mkdir":
        if (!args[0]) {
          output = "mkdir: missing operand";
        } else {
          output = `mkdir: created directory '${args[0]}'`;
        }
        break;

      case "touch":
        if (!args[0]) {
          output = "touch: missing operand";
        } else {
          output = `touch: created file '${args[0]}'`;
        }
        break;

      case "rm":
        if (!args[0]) {
          output = "rm: missing operand";
        } else {
          output = `rm: removed '${args[0]}'`;
        }
        break;

      case "neofetch":
        output = `
                    'c.          ${USERNAME}@${HOSTNAME}
                 ,xNMM.          -----------------------
               .OMMMMo           OS: macOS Sonoma 14.0
               OMMM0,            Host: MacBook Air (M2, 2022)
     .;loddo:' loolloddol;.      Kernel: Darwin 23.0.0
   cKMMMMMMMMMMNWMMMMMMMMMM0:    Uptime: ${Math.floor(Math.random() * 100) + 1} days
 .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Shell: zsh 5.9
 XMMMMMMMMMMMMMMMMMMMMMMMX.      Terminal: iTerm2
;MMMMMMMMMMMMMMMMMMMMMMMM:       CPU: Apple M2
:MMMMMMMMMMMMMMMMMMMMMMMM:       Memory: 8GB
.MMMMMMMMMMMMMMMMMMMMMMMMX.
 kMMMMMMMMMMMMMMMMMMMMMMMMWd.
 .XMMMMMMMMMMMMMMMMMMMMMMMMMMk
  .XMMMMMMMMMMMMMMMMMMMMMMMMK.
    kMMMMMMMMMMMMMMMMMMMMMMd
     ;KMMMMMMMWXXWMMMMMMMk.
       .coeli:.teleoc.           `;
        break;

      default:
        output = `zsh: command not found: ${cmd}`;
    }

    setHistory((prev) => [
      ...prev,
      { type: "input", content: input, prompt: getPrompt() },
      ...(output ? [{ type: "output" as const, content: output }] : []),
    ]);

    if (trimmed) {
      setCommandHistory((prev) => [...prev, trimmed]);
    }
    setHistoryIndex(-1);
  }, [currentDir, commandHistory, getPrompt, resolvePath]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      executeCommand(currentInput);
      setCurrentInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1
          ? commandHistory.length - 1
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput("");
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Simple tab completion for directories
      const parts = currentInput.split(/\s+/);
      const lastPart = parts[parts.length - 1];
      if (lastPart) {
        const dir = currentDir;
        const dirContents = FILE_SYSTEM[dir]?.contents || [];
        const matches = dirContents.filter((item) =>
          item.toLowerCase().startsWith(lastPart.toLowerCase())
        );
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          setCurrentInput(parts.join(" "));
        }
      }
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      setHistory((prev) => [
        ...prev,
        { type: "input", content: currentInput + "^C", prompt: getPrompt() },
      ]);
      setCurrentInput("");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setHistory([]);
    }
  }, [currentInput, executeCommand, commandHistory, historyIndex, currentDir, getPrompt]);

  return (
    <div
      ref={terminalRef}
      className="h-full w-full max-w-full bg-white dark:bg-zinc-900 font-mono text-sm overflow-y-auto overflow-x-hidden p-2 cursor-text"
      onClick={handleTerminalClick}
    >
      {history.map((entry, i) => (
        <div key={i} className="whitespace-pre-wrap break-words overflow-hidden">
          {entry.type === "input" ? (
            <span>
              <span className="text-zinc-900 dark:text-white">{entry.prompt}</span>
              <span className="text-zinc-900 dark:text-white">{entry.content}</span>
            </span>
          ) : (
            <span className="text-zinc-700 dark:text-white">{entry.content}</span>
          )}
        </div>
      ))}
      <div className="flex items-center max-w-full">
        <span className="text-zinc-900 dark:text-white whitespace-pre-wrap break-all">{getPrompt()}</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent text-zinc-900 dark:text-white outline-none border-none"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
    </div>
  );
}
