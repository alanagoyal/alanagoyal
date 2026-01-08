"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";

interface TerminalLine {
  id: number;
  type: "input" | "output" | "error";
  content: string;
  prompt?: string;
}

interface FileSystemNode {
  type: "file" | "directory";
  content?: string;
  children?: Record<string, FileSystemNode>;
}

// Simulated file system
const initialFileSystem: Record<string, FileSystemNode> = {
  "~": {
    type: "directory",
    children: {
      Desktop: {
        type: "directory",
        children: {
          "notes.txt": { type: "file", content: "My personal notes" },
        },
      },
      Documents: {
        type: "directory",
        children: {
          "resume.pdf": { type: "file", content: "[PDF content]" },
          projects: {
            type: "directory",
            children: {
              "readme.md": { type: "file", content: "# My Projects\n\nWelcome to my projects folder." },
            },
          },
        },
      },
      Downloads: { type: "directory", children: {} },
      Pictures: { type: "directory", children: {} },
      ".zshrc": { type: "file", content: "# Zsh configuration\nexport PATH=$PATH:/usr/local/bin" },
      ".gitconfig": { type: "file", content: "[user]\n  name = Alana Goyal\n  email = alana@example.com" },
    },
  },
};

interface TerminalProps {
  isMobile: boolean;
}

export function Terminal({ isMobile }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentPath, setCurrentPath] = useState("~");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fileSystem] = useState(initialFileSystem);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lineIdRef = useRef(0);

  const username = "alanagoyal@Alanas-MacBook-Air";
  const getPrompt = useCallback(() => {
    const shortPath = currentPath === "~" ? "~" : currentPath.split("/").pop() || currentPath;
    return `${username} ${shortPath} % `;
  }, [currentPath]);

  // Get node from path
  const getNode = useCallback((path: string): FileSystemNode | null => {
    const parts = path === "~" ? ["~"] : path.split("/").filter(Boolean);
    let current: FileSystemNode | null = fileSystem["~"];

    if (parts[0] === "~") {
      parts.shift();
    }

    for (const part of parts) {
      if (current?.type !== "directory" || !current.children?.[part]) {
        return null;
      }
      current = current.children[part];
    }

    return current;
  }, [fileSystem]);

  // Resolve path (handle ., .., and absolute/relative paths)
  const resolvePath = useCallback((path: string): string => {
    if (path === "~" || path === "") return "~";

    let basePath = path.startsWith("~") || path.startsWith("/") ? "~" : currentPath;
    const parts = path.startsWith("~") ? path.slice(2).split("/") :
                  path.startsWith("/") ? path.slice(1).split("/") :
                  [...basePath.split("/"), ...path.split("/")];

    const resolved: string[] = [];
    for (const part of parts) {
      if (part === "." || part === "") continue;
      if (part === "..") {
        if (resolved.length > 1) resolved.pop();
      } else {
        resolved.push(part);
      }
    }

    return resolved.length === 0 ? "~" : resolved.join("/");
  }, [currentPath]);

  // Add a line to the terminal
  const addLine = useCallback((type: TerminalLine["type"], content: string, prompt?: string) => {
    setLines((prev) => [...prev, { id: lineIdRef.current++, type, content, prompt }]);
  }, []);

  // Command implementations
  const commands: Record<string, (args: string[]) => void> = {
    help: () => {
      addLine("output", "Available commands:");
      addLine("output", "  help          - Show this help message");
      addLine("output", "  clear         - Clear the terminal");
      addLine("output", "  echo [text]   - Print text to the terminal");
      addLine("output", "  pwd           - Print working directory");
      addLine("output", "  ls [path]     - List directory contents");
      addLine("output", "  cd [path]     - Change directory");
      addLine("output", "  cat [file]    - Display file contents");
      addLine("output", "  mkdir [name]  - Create a directory");
      addLine("output", "  touch [name]  - Create an empty file");
      addLine("output", "  whoami        - Display current user");
      addLine("output", "  date          - Display current date and time");
      addLine("output", "  hostname      - Display hostname");
      addLine("output", "  uname [-a]    - Display system information");
      addLine("output", "  history       - Display command history");
    },

    clear: () => {
      setLines([]);
    },

    echo: (args) => {
      addLine("output", args.join(" "));
    },

    pwd: () => {
      const fullPath = currentPath === "~" ? "/Users/alanagoyal" : `/Users/alanagoyal/${currentPath.slice(2)}`;
      addLine("output", fullPath);
    },

    ls: (args) => {
      const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
      const showLong = args.includes("-l") || args.includes("-la") || args.includes("-al");
      const targetPath = args.filter(a => !a.startsWith("-"))[0] || currentPath;
      const resolved = resolvePath(targetPath);
      const node = getNode(resolved);

      if (!node) {
        addLine("error", `ls: ${targetPath}: No such file or directory`);
        return;
      }

      if (node.type === "file") {
        addLine("output", targetPath);
        return;
      }

      const entries = Object.keys(node.children || {});
      const allEntries = showAll ? [".", "..", ...entries] : entries.filter(e => !e.startsWith("."));

      if (showLong) {
        allEntries.forEach((entry) => {
          const isDir = entry === "." || entry === ".." || node.children?.[entry]?.type === "directory";
          const permissions = isDir ? "drwxr-xr-x" : "-rw-r--r--";
          const size = isDir ? 64 : 1024;
          const date = "Jan  8 10:00";
          const color = isDir ? "text-blue-400" : "";
          addLine("output", `${permissions}  1 alanagoyal  staff  ${String(size).padStart(5)}  ${date}  <span class="${color}">${entry}</span>`);
        });
      } else {
        const formatted = allEntries.map((entry) => {
          const isDir = entry === "." || entry === ".." || node.children?.[entry]?.type === "directory";
          return isDir ? `<span class="text-blue-400">${entry}</span>` : entry;
        });
        addLine("output", formatted.join("  "));
      }
    },

    cd: (args) => {
      const target = args[0] || "~";
      const resolved = resolvePath(target);
      const node = getNode(resolved);

      if (!node) {
        addLine("error", `cd: no such file or directory: ${target}`);
        return;
      }

      if (node.type !== "directory") {
        addLine("error", `cd: not a directory: ${target}`);
        return;
      }

      setCurrentPath(resolved);
    },

    cat: (args) => {
      if (args.length === 0) {
        addLine("error", "cat: missing file operand");
        return;
      }

      const resolved = resolvePath(args[0]);
      const node = getNode(resolved);

      if (!node) {
        addLine("error", `cat: ${args[0]}: No such file or directory`);
        return;
      }

      if (node.type === "directory") {
        addLine("error", `cat: ${args[0]}: Is a directory`);
        return;
      }

      const content = node.content || "";
      content.split("\n").forEach((line) => addLine("output", line));
    },

    mkdir: (args) => {
      if (args.length === 0) {
        addLine("error", "mkdir: missing operand");
        return;
      }
      addLine("output", `Created directory: ${args[0]}`);
    },

    touch: (args) => {
      if (args.length === 0) {
        addLine("error", "touch: missing file operand");
        return;
      }
      addLine("output", `Created file: ${args[0]}`);
    },

    whoami: () => {
      addLine("output", "alanagoyal");
    },

    date: () => {
      addLine("output", new Date().toString());
    },

    hostname: () => {
      addLine("output", "Alanas-MacBook-Air.local");
    },

    uname: (args) => {
      if (args.includes("-a")) {
        addLine("output", "Darwin Alanas-MacBook-Air.local 23.0.0 Darwin Kernel Version 23.0.0 arm64");
      } else {
        addLine("output", "Darwin");
      }
    },

    history: () => {
      commandHistory.forEach((cmd, i) => {
        addLine("output", `  ${i + 1}  ${cmd}`);
      });
    },

    neofetch: () => {
      const art = [
        "                    'c.          alanagoyal@Alanas-MacBook-Air",
        "                 ,xNMM.          -----------------------------",
        "               .OMMMMo           OS: macOS Sonoma 14.0 arm64",
        "               OMMM0,            Host: MacBook Air (M2, 2022)",
        "     .;loddo:' loolloddol;.      Kernel: Darwin 23.0.0",
        "   cKMMMMMMMMMMNWMMMMMMMMMM0:    Uptime: 2 days, 3 hours",
        " .KMMMMMMMMMMMMMMMMMMMMMMMWd.    Packages: 142 (brew)",
        " XMMMMMMMMMMMMMMMMMMMMMMMX.      Shell: zsh 5.9",
        ";MMMMMMMMMMMMMMMMMMMMMMMM:       Resolution: 2560x1664",
        ":MMMMMMMMMMMMMMMMMMMMMMMM:       DE: Aqua",
        ".MMMMMMMMMMMMMMMMMMMMMMMMX.      WM: Quartz Compositor",
        " kMMMMMMMMMMMMMMMMMMMMMMMMWd.    Terminal: iTerm2",
        " .XMMMMMMMMMMMMMMMMMMMMMMMMMMk   CPU: Apple M2",
        "  .XMMMMMMMMMMMMMMMMMMMMMMMMK.   GPU: Apple M2",
        "    kMMMMMMMMMMMMMMMMMMMMMMd     Memory: 8192MiB / 16384MiB",
        "     ;KMMMMMMMWXXWMMMMMMMk.",
        "       .coeli;,  .,;googl'",
      ];
      art.forEach((line) => addLine("output", line));
    },
  };

  // Process command
  const processCommand = useCallback((input: string) => {
    const trimmed = input.trim();
    addLine("input", trimmed, getPrompt());

    if (!trimmed) return;

    setCommandHistory((prev) => [...prev, trimmed]);
    setHistoryIndex(-1);

    const [cmd, ...args] = trimmed.split(/\s+/);

    if (commands[cmd]) {
      commands[cmd](args);
    } else {
      addLine("error", `zsh: command not found: ${cmd}`);
    }
  }, [addLine, getPrompt, commands, commandHistory]);

  // Handle key events
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      processCommand(currentInput);
      setCurrentInput("");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || "");
      } else {
        setHistoryIndex(-1);
        setCurrentInput("");
      }
    } else if (e.key === "c" && e.ctrlKey) {
      addLine("input", currentInput + "^C", getPrompt());
      setCurrentInput("");
    } else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    } else if (e.key === "Tab") {
      e.preventDefault();
      // Basic tab completion for commands
      const partial = currentInput.trim().split(/\s+/).pop() || "";
      const cmdNames = Object.keys(commands);
      const matches = cmdNames.filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        const parts = currentInput.trim().split(/\s+/);
        parts[parts.length - 1] = matches[0];
        setCurrentInput(parts.join(" "));
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus input when clicking terminal
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto p-4 font-mono text-sm bg-black text-gray-200 cursor-text"
      onClick={focusInput}
    >
      {/* Terminal output */}
      {lines.map((line) => (
        <div key={line.id} className="whitespace-pre-wrap break-words">
          {line.type === "input" ? (
            <span>
              <span className="text-green-400">{line.prompt}</span>
              <span>{line.content}</span>
            </span>
          ) : line.type === "error" ? (
            <span className="text-red-400">{line.content}</span>
          ) : (
            <span dangerouslySetInnerHTML={{ __html: line.content }} />
          )}
        </div>
      ))}

      {/* Current input line */}
      <div className="flex items-center whitespace-pre">
        <span className="text-green-400">{getPrompt()}</span>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 bg-transparent text-gray-200 outline-none caret-gray-200 w-full"
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            autoCorrect="off"
          />
          <span className="invisible">{currentInput || " "}</span>
        </div>
      </div>
    </div>
  );
}
