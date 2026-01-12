"use client";

import { useState, useRef, useEffect, useCallback, KeyboardEvent } from "react";

const USERNAME = "alanagoyal";
const HOSTNAME = "Alanas-MacBook-Air";
const HOME_DIR = "/Users/alanagoyal";
const PROJECTS_DIR = "/Users/alanagoyal/Projects";

// File system node types
interface FileNode {
  type: "dir" | "file";
  contents?: string[];
  content?: string;
  isGitHub?: boolean;
  repoName?: string;
  filePath?: string;
}

// Base file system (static content)
const BASE_FILE_SYSTEM: Record<string, FileNode> = {
  "/": { type: "dir", contents: ["Users", "Applications", "System", "Library"] },
  "/Users": { type: "dir", contents: ["alanagoyal", "Shared"] },
  "/Users/alanagoyal": { type: "dir", contents: ["Desktop", "Documents", "Downloads", "Projects"] },
  "/Users/alanagoyal/Desktop": { type: "dir", contents: ["hello.md"] },
  "/Users/alanagoyal/Desktop/hello.md": {
    type: "file",
    content: "hello world!",
  },
  "/Users/alanagoyal/Documents": { type: "dir", contents: [] },
  "/Users/alanagoyal/Downloads": { type: "dir", contents: [] },
  "/Users/alanagoyal/Projects": { type: "dir", contents: [] }, // Dynamic from GitHub
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

// GitHub data cache
interface GitHubCache {
  repos: string[] | null;
  repoTrees: Record<string, { name: string; type: "file" | "dir"; path: string }[]>;
  fileContents: Record<string, string>;
  lastFetch: number;
}

const githubCache: GitHubCache = {
  repos: null,
  repoTrees: {},
  fileContents: {},
  lastFetch: 0,
};

async function fetchGitHubRepos(): Promise<string[]> {
  if (githubCache.repos && Date.now() - githubCache.lastFetch < 5 * 60 * 1000) {
    return githubCache.repos;
  }

  try {
    const response = await fetch("/api/github?type=repos");
    if (!response.ok) throw new Error("Failed to fetch repos");
    const data = await response.json();
    githubCache.repos = data.repos;
    githubCache.lastFetch = Date.now();
    return data.repos;
  } catch {
    return githubCache.repos || [];
  }
}

async function fetchRepoTree(repo: string): Promise<{ name: string; type: "file" | "dir"; path: string }[]> {
  if (githubCache.repoTrees[repo]) {
    return githubCache.repoTrees[repo];
  }

  try {
    const response = await fetch(`/api/github?type=tree&repo=${encodeURIComponent(repo)}`);
    if (!response.ok) throw new Error("Failed to fetch tree");
    const data = await response.json();
    githubCache.repoTrees[repo] = data.tree;
    return data.tree;
  } catch {
    return [];
  }
}

async function fetchFileContent(repo: string, path: string): Promise<string> {
  const cacheKey = `${repo}/${path}`;
  if (githubCache.fileContents[cacheKey]) {
    return githubCache.fileContents[cacheKey];
  }

  try {
    const response = await fetch(
      `/api/github?type=file&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`
    );
    if (!response.ok) {
      if (response.status === 404) throw new Error("File not found");
      throw new Error("Failed to fetch file");
    }
    const data = await response.json();
    githubCache.fileContents[cacheKey] = data.content;
    return data.content;
  } catch (error) {
    throw error;
  }
}

export function Terminal({ isMobile = false }: TerminalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    { type: "output", content: "Type 'help' for available commands" },
  ]);
  const [currentInput, setCurrentInput] = useState("");
  const [currentDir, setCurrentDir] = useState(HOME_DIR);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [fileSystem, setFileSystem] = useState<Record<string, FileNode>>(BASE_FILE_SYSTEM);
  const [completionSuggestions, setCompletionSuggestions] = useState<string | null>(null);
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

  // Check if path is within Projects (GitHub)
  const isGitHubPath = useCallback((path: string): boolean => {
    return path.startsWith(PROJECTS_DIR + "/") || path === PROJECTS_DIR;
  }, []);

  // Parse GitHub path into repo and file path
  const parseGitHubPath = useCallback((path: string): { repo: string; filePath: string } | null => {
    if (!path.startsWith(PROJECTS_DIR + "/")) return null;
    const relativePath = path.slice(PROJECTS_DIR.length + 1);
    const parts = relativePath.split("/");
    const repo = parts[0];
    const filePath = parts.slice(1).join("/");
    return { repo, filePath };
  }, []);

  const executeCommand = useCallback(async (input: string) => {
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1);

    let output = "";

    // Capture prompt now (before any directory changes)
    const prompt = getPrompt();

    if (trimmed) {
      setCommandHistory((prev) => [...prev, trimmed]);
    }
    setHistoryIndex(-1);

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
  cat <file>    - Display file contents
  echo <text>   - Print text to terminal
  whoami        - Display current user
  hostname      - Display hostname
  date          - Display current date/time
  uptime        - Display system uptime
  history       - Show command history
  neofetch      - Display system info

Note: Projects folder contains my real GitHub repositories!`;
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

        // Check if it's a GitHub path
        if (isGitHubPath(newPath)) {
          const parsed = parseGitHubPath(newPath);
          if (newPath === PROJECTS_DIR) {
            setCurrentDir(newPath);
            break;
          }
          if (parsed) {
            // Verify repo exists
            const repos = await fetchGitHubRepos();
            if (!repos.includes(parsed.repo)) {
              output = `cd: no such file or directory: ${args[0]}`;
              break;
            }
            // If going into repo subdirectory, verify it exists
            if (parsed.filePath) {
              const tree = await fetchRepoTree(parsed.repo);
              const dirExists = tree.some(
                (item) => item.type === "dir" && item.path === parsed.filePath
              );
              if (!dirExists) {
                output = `cd: no such file or directory: ${args[0]}`;
                break;
              }
            }
            setCurrentDir(newPath);
          }
        } else if (fileSystem[newPath]?.type === "dir") {
          setCurrentDir(newPath);
        } else if (fileSystem[newPath]) {
          output = `cd: not a directory: ${args[0]}`;
        } else {
          output = `cd: no such file or directory: ${args[0]}`;
        }
        break;
      }

      case "ls": {
        const target = args[0] ? resolvePath(args[0]) : currentDir;

        // Handle Projects directory (GitHub repos)
        if (target === PROJECTS_DIR) {
          const repos = await fetchGitHubRepos();
          output = repos.join("  ") || "(empty)";
          // Update file system with repos
          setFileSystem((prev) => ({
            ...prev,
            [PROJECTS_DIR]: { type: "dir", contents: repos },
          }));
          break;
        }

        // Handle path inside a repo
        const parsed = parseGitHubPath(target);
        if (parsed) {
          const tree = await fetchRepoTree(parsed.repo);
          if (tree.length === 0) {
            output = `ls: ${args[0] || target}: No such file or directory`;
            break;
          }

          // Filter to show only items at the current level
          const currentLevel = parsed.filePath ? parsed.filePath.split("/").length : 0;
          const items = tree.filter((item) => {
            if (!parsed.filePath) {
              // Root of repo: show only top-level items
              return !item.path.includes("/");
            }
            // Inside a directory: show items that start with this path
            if (!item.path.startsWith(parsed.filePath + "/") && item.path !== parsed.filePath) {
              return false;
            }
            const relativePath = item.path.slice(parsed.filePath.length + 1);
            return relativePath && !relativePath.includes("/");
          });

          output = items.map((item) => item.name).join("  ") || "(empty)";
          break;
        }

        // Handle static file system
        const dir = fileSystem[target];
        if (dir?.type === "dir") {
          output = dir.contents?.join("  ") || "(empty)";
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
          break;
        }

        const path = resolvePath(args[0]);

        // Check static file system first
        const staticFile = fileSystem[path];
        if (staticFile?.type === "file" && staticFile.content) {
          output = staticFile.content;
          break;
        }
        if (staticFile?.type === "dir") {
          output = `cat: ${args[0]}: Is a directory`;
          break;
        }

        // Check GitHub
        const parsed = parseGitHubPath(path);
        if (parsed && parsed.filePath) {
          try {
            const content = await fetchFileContent(parsed.repo, parsed.filePath);
            output = content;
          } catch (error) {
            output = `cat: ${args[0]}: ${error instanceof Error ? error.message : "File not found"}`;
          }
          break;
        }

        output = `cat: ${args[0]}: No such file or directory`;
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
        output = commandHistory.map((c, i) => `  ${i + 1}  ${c}`).join("\n");
        break;

      case "neofetch":
        output = `
                    'c.          ${USERNAME}@${HOSTNAME}
                 ,xNMM.          -----------------------
               .OMMMMo           OS: macOS Sierra 10.12
               OMMM0,            Host: MacBook Air (M2, 2022)
     .;loddo:' loolloddol;.      Kernel: Darwin 16.0.0
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

    // Add input and output to history together (after all async work completes)
    setHistory((prev) => [
      ...prev,
      { type: "input", content: input, prompt },
      ...(output ? [{ type: "output" as const, content: output }] : []),
    ]);
  }, [currentDir, commandHistory, getPrompt, resolvePath, fileSystem, isGitHubPath, parseGitHubPath]);

  const handleKeyDown = useCallback(async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isExecuting) {
      setIsExecuting(true);
      setCompletionSuggestions(null); // Clear any completion suggestions
      await executeCommand(currentInput);
      setCurrentInput("");
      setIsExecuting(false);
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
      // Tab completion
      const inputParts = currentInput.split(/\s+/);
      const lastPart = inputParts[inputParts.length - 1];
      if (lastPart) {
        const targetDir = lastPart.includes("/")
          ? resolvePath(lastPart.substring(0, lastPart.lastIndexOf("/")))
          : currentDir;
        const prefix = lastPart.includes("/")
          ? lastPart.substring(lastPart.lastIndexOf("/") + 1)
          : lastPart;

        let candidates: string[] = [];

        // Get candidates from GitHub if in Projects
        if (isGitHubPath(targetDir) || targetDir === PROJECTS_DIR) {
          if (targetDir === PROJECTS_DIR) {
            const repos = await fetchGitHubRepos();
            candidates = repos;
          } else {
            const parsed = parseGitHubPath(targetDir);
            if (parsed) {
              const tree = await fetchRepoTree(parsed.repo);
              candidates = tree
                .filter((item) => {
                  if (!parsed.filePath) return !item.path.includes("/");
                  return item.path.startsWith(parsed.filePath + "/") &&
                    !item.path.slice(parsed.filePath.length + 1).includes("/");
                })
                .map((item) => item.name);
            }
          }
        } else {
          candidates = fileSystem[targetDir]?.contents || [];
        }

        const matches = candidates.filter((item) =>
          item.toLowerCase().startsWith(prefix.toLowerCase())
        );

        if (matches.length === 1) {
          // Single match - complete it
          const basePath = lastPart.includes("/")
            ? lastPart.substring(0, lastPart.lastIndexOf("/") + 1)
            : "";
          inputParts[inputParts.length - 1] = basePath + matches[0];
          setCurrentInput(inputParts.join(" "));
        } else if (matches.length > 1) {
          // Multiple matches - show them and complete to common prefix
          let commonPrefix = matches[0];
          for (let i = 1; i < matches.length; i++) {
            while (!matches[i].toLowerCase().startsWith(commonPrefix.toLowerCase())) {
              commonPrefix = commonPrefix.slice(0, -1);
            }
            commonPrefix = matches[0].slice(0, commonPrefix.length);
          }

          // Show matches below the input line
          const displayMatches = matches.map((m) => {
            const isDir = targetDir === PROJECTS_DIR || fileSystem[targetDir + "/" + m]?.type === "dir";
            return isDir ? m + "/" : m;
          }).join("  ");
          setCompletionSuggestions(displayMatches);

          // Update input with common prefix if longer
          if (commonPrefix.length > prefix.length) {
            const basePath = lastPart.includes("/")
              ? lastPart.substring(0, lastPart.lastIndexOf("/") + 1)
              : "";
            inputParts[inputParts.length - 1] = basePath + commonPrefix;
            setCurrentInput(inputParts.join(" "));
          }
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
  }, [currentInput, executeCommand, commandHistory, historyIndex, currentDir, getPrompt, isExecuting, fileSystem, resolvePath, isGitHubPath, parseGitHubPath]);

  return (
    <div
      ref={terminalRef}
      className={`h-full w-full max-w-full bg-white dark:bg-zinc-900 font-mono ${isMobile ? "text-base" : "text-xs"} overflow-y-auto overflow-x-hidden p-2 cursor-text text-zinc-900 dark:text-white`}
      onClick={handleTerminalClick}
    >
      {history.map((entry, i) => (
        <div key={i} className="whitespace-pre-wrap break-words overflow-hidden">
          {entry.type === "input" ? (
            <span>
              <span>{entry.prompt}</span>
              <span>{entry.content}</span>
            </span>
          ) : (
            <span>{entry.content}</span>
          )}
        </div>
      ))}
      <div className="flex items-center max-w-full">
        <span className="whitespace-pre-wrap break-all">{getPrompt()}</span>
        <input
          ref={inputRef}
          type="text"
          value={currentInput}
          onChange={(e) => {
            setCurrentInput(e.target.value);
            setCompletionSuggestions(null); // Clear suggestions when typing
          }}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-transparent outline-none border-none text-inherit"
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
        />
      </div>
      {completionSuggestions && (
        <div className="whitespace-pre-wrap break-words overflow-hidden">
          {completionSuggestions}
        </div>
      )}
    </div>
  );
}
