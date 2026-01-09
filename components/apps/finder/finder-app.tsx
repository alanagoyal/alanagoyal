"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { useWindowFocus } from "@/lib/window-focus-context";
import { cn } from "@/lib/utils";
import { APPS } from "@/lib/app-config";

const USERNAME = "alanagoyal";
const HOME_DIR = `/Users/${USERNAME}`;
const PROJECTS_DIR = `${HOME_DIR}/Projects`;

interface FileItem {
  name: string;
  type: "file" | "dir" | "app";
  path: string;
  icon?: string;
}

// Static file system structure
const STATIC_FILES: Record<string, FileItem[]> = {
  [HOME_DIR]: [
    { name: "Desktop", type: "dir", path: `${HOME_DIR}/Desktop` },
    { name: "Documents", type: "dir", path: `${HOME_DIR}/Documents` },
    { name: "Downloads", type: "dir", path: `${HOME_DIR}/Downloads` },
    { name: "Projects", type: "dir", path: `${HOME_DIR}/Projects` },
  ],
  [`${HOME_DIR}/Desktop`]: [
    { name: "hello.md", type: "file", path: `${HOME_DIR}/Desktop/hello.md` },
  ],
  [`${HOME_DIR}/Documents`]: [],
  [`${HOME_DIR}/Downloads`]: [],
};

// Sidebar items
type SidebarItem = "recents" | "applications" | "desktop" | "documents" | "downloads" | "projects";

const SIDEBAR_ITEMS: { id: SidebarItem; label: string; icon: string }[] = [
  { id: "recents", label: "Recents", icon: "clock" },
  { id: "applications", label: "Applications", icon: "grid" },
  { id: "desktop", label: "Desktop", icon: "desktop" },
  { id: "documents", label: "Documents", icon: "folder" },
  { id: "downloads", label: "Downloads", icon: "download" },
  { id: "projects", label: "Projects", icon: "code" },
];

interface FinderAppProps {
  isMobile?: boolean;
  inShell?: boolean;
  onOpenApp?: (appId: string) => void;
}

// GitHub cache
interface GitHubCache {
  repos: string[] | null;
  repoTrees: Record<string, { name: string; type: "file" | "dir"; path: string }[]>;
  lastFetch: number;
}

const githubCache: GitHubCache = {
  repos: null,
  repoTrees: {},
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
  try {
    const response = await fetch(
      `/api/github?type=file&repo=${encodeURIComponent(repo)}&path=${encodeURIComponent(path)}`
    );
    if (!response.ok) throw new Error("Failed to fetch file");
    const data = await response.json();
    return data.content;
  } catch {
    return "";
  }
}

// Icon component
function FileIcon({ type, name, icon, className }: { type: "file" | "dir" | "app"; name: string; icon?: string; className?: string }) {
  // File type icons based on extension
  const getFileIcon = () => {
    if (type === "dir") {
      return (
        <svg className={cn("text-blue-500", className)} viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
        </svg>
      );
    }
    if (type === "app") {
      // Use the passed icon prop if available, otherwise look up by name
      const appIcon = icon || APPS.find(a => {
        const cleanName = name.replace(/\.app$/i, '');
        return a.name === cleanName || a.id === cleanName.toLowerCase();
      })?.icon;
      if (appIcon) {
        return (
          <Image
            src={appIcon}
            alt={name}
            width={48}
            height={48}
            className={cn("rounded-lg", className)}
          />
        );
      }
    }
    // File icon
    const ext = name.split('.').pop()?.toLowerCase();
    let color = "text-zinc-400";
    if (ext === "md") color = "text-blue-400";
    else if (ext === "ts" || ext === "tsx") color = "text-blue-600";
    else if (ext === "js" || ext === "jsx") color = "text-yellow-500";
    else if (ext === "json") color = "text-green-500";
    else if (ext === "css") color = "text-pink-500";

    return (
      <svg className={cn(color, className)} viewBox="0 0 24 24" fill="currentColor">
        <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
      </svg>
    );
  };

  return getFileIcon();
}

// Sidebar icon component
function SidebarIcon({ icon, className }: { icon: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    clock: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
    grid: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z" />
      </svg>
    ),
    desktop: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7v2H8v2h8v-2h-2v-2h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H3V4h18v12z" />
      </svg>
    ),
    folder: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    ),
    download: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
      </svg>
    ),
    code: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
      </svg>
    ),
  };
  return icons[icon] || null;
}

export function FinderApp({ isMobile = false, inShell = false, onOpenApp }: FinderAppProps) {
  const windowFocus = useWindowFocus();
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedSidebar, setSelectedSidebar] = useState<SidebarItem>("projects");
  const [currentPath, setCurrentPath] = useState(PROJECTS_DIR);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true); // For mobile

  const inDesktopShell = inShell && windowFocus;

  // Get path for sidebar item
  const getPathForSidebar = useCallback((item: SidebarItem): string => {
    switch (item) {
      case "recents": return "recents";
      case "applications": return "applications";
      case "desktop": return `${HOME_DIR}/Desktop`;
      case "documents": return `${HOME_DIR}/Documents`;
      case "downloads": return `${HOME_DIR}/Downloads`;
      case "projects": return PROJECTS_DIR;
      default: return HOME_DIR;
    }
  }, []);

  // Load files for current path
  const loadFiles = useCallback(async (path: string) => {
    setLoading(true);
    setPreviewContent(null);

    try {
      // Special handling for Recents
      if (path === "recents") {
        setFiles([
          { name: "hello.md", type: "file", path: `${HOME_DIR}/Desktop/hello.md` },
        ]);
        setLoading(false);
        return;
      }

      // Special handling for Applications
      if (path === "applications") {
        const apps: FileItem[] = APPS
          .filter(app => app.id !== "finder") // Exclude Finder from Applications
          .map(app => ({
            name: app.name,
            type: "app" as const,
            path: `/${app.id}`, // Route path for navigation
            icon: app.icon,
          }));
        setFiles(apps);
        setLoading(false);
        return;
      }

      // Projects directory - fetch from GitHub
      if (path === PROJECTS_DIR) {
        const repos = await fetchGitHubRepos();
        setFiles(repos.map(repo => ({
          name: repo,
          type: "dir" as const,
          path: `${PROJECTS_DIR}/${repo}`,
        })));
        setLoading(false);
        return;
      }

      // Inside a GitHub repo
      if (path.startsWith(PROJECTS_DIR + "/")) {
        const relativePath = path.slice(PROJECTS_DIR.length + 1);
        const parts = relativePath.split("/");
        const repo = parts[0];
        const repoPath = parts.slice(1).join("/");

        const tree = await fetchRepoTree(repo);

        // Filter to show only items at current level
        const items = tree.filter(item => {
          if (!repoPath) {
            return !item.path.includes("/");
          }
          if (!item.path.startsWith(repoPath + "/")) {
            return false;
          }
          const remaining = item.path.slice(repoPath.length + 1);
          return remaining && !remaining.includes("/");
        });

        setFiles(items.map(item => ({
          name: item.name,
          type: item.type,
          path: `${PROJECTS_DIR}/${repo}/${item.path}`,
        })));
        setLoading(false);
        return;
      }

      // Static file system
      if (STATIC_FILES[path]) {
        setFiles(STATIC_FILES[path]);
      } else {
        setFiles([]);
      }
    } catch (error) {
      console.error("Error loading files:", error);
      setFiles([]);
    }

    setLoading(false);
  }, []);

  // Load files when path changes
  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, loadFiles]);

  // Handle sidebar selection
  const handleSidebarSelect = useCallback((item: SidebarItem) => {
    setSelectedSidebar(item);
    setCurrentPath(getPathForSidebar(item));
    setSelectedFile(null);
    if (isMobile) {
      setShowSidebar(false);
    }
  }, [getPathForSidebar, isMobile]);

  // Handle file/folder click
  const handleFileClick = useCallback((file: FileItem) => {
    setSelectedFile(file.path);
  }, []);

  // Handle file/folder double-click
  const handleFileDoubleClick = useCallback(async (file: FileItem) => {
    if (file.type === "dir") {
      setCurrentPath(file.path);
      setSelectedFile(null);
    } else if (file.type === "app") {
      const appId = file.path.replace("/", ""); // "/notes" -> "notes"
      if (onOpenApp) {
        // Use window manager callback (desktop shell)
        onOpenApp(appId);
      } else {
        // Fallback to navigation (mobile or standalone)
        window.location.href = file.path;
      }
    } else if (file.type === "file") {
      // Preview file content
      if (file.path.startsWith(PROJECTS_DIR + "/")) {
        const relativePath = file.path.slice(PROJECTS_DIR.length + 1);
        const parts = relativePath.split("/");
        const repo = parts[0];
        const filePath = parts.slice(1).join("/");
        const content = await fetchFileContent(repo, filePath);
        setPreviewContent(content);
      } else if (file.path === `${HOME_DIR}/Desktop/hello.md`) {
        setPreviewContent("hello world!");
      }
    }
  }, [onOpenApp]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (isMobile && !showSidebar) {
      // Check if we can go up a directory
      const parentPath = currentPath.split("/").slice(0, -1).join("/");
      const sidebarPath = getPathForSidebar(selectedSidebar);

      if (currentPath !== sidebarPath && parentPath.startsWith(HOME_DIR)) {
        setCurrentPath(parentPath);
      } else {
        setShowSidebar(true);
      }
      return;
    }

    // Desktop: go up a directory
    const parentPath = currentPath.split("/").slice(0, -1).join("/");
    if (parentPath.startsWith(HOME_DIR) || currentPath.startsWith(PROJECTS_DIR)) {
      setCurrentPath(parentPath || HOME_DIR);
    }
  }, [currentPath, isMobile, showSidebar, selectedSidebar, getPathForSidebar]);

  // Get breadcrumb parts
  const getBreadcrumbs = useCallback(() => {
    if (currentPath === "recents") return ["Recents"];
    if (currentPath === "applications") return ["Applications"];

    const parts = currentPath.replace(HOME_DIR, USERNAME).split("/").filter(Boolean);
    return parts;
  }, [currentPath]);

  // Check if can go back
  const canGoBack = useCallback(() => {
    if (currentPath === "recents" || currentPath === "applications") return false;
    return currentPath !== HOME_DIR && currentPath !== PROJECTS_DIR;
  }, [currentPath]);

  // Render mobile sidebar nav (traffic lights only, like Settings SidebarNav)
  const renderMobileSidebarNav = () => (
    <div className="px-4 py-2 flex items-center justify-between select-none bg-zinc-100/50 dark:bg-zinc-800/50">
      <div className="window-controls flex items-center gap-1.5 p-2">
        <div className="w-3 h-3 rounded-full bg-red-500" />
        <div className="w-3 h-3 rounded-full bg-yellow-500" />
        <div className="w-3 h-3 rounded-full bg-green-500" />
      </div>
      {/* Spacer to match Settings */}
      <div className="flex flex-col items-center justify-center">
        <div className="p-2">
          <div className="w-4 h-4" />
        </div>
      </div>
    </div>
  );

  // Render mobile content nav (back button + title, like Settings Nav)
  const renderMobileContentNav = (title: string, backTitle: string) => (
    <div className="flex items-center justify-between px-4 relative min-h-24 py-2 select-none bg-zinc-100/50 dark:bg-zinc-800/50">
      {/* Back button */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-blue-500 hover:text-blue-600 transition-colors"
        >
          <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          <span className="text-base">{backTitle}</span>
        </button>
      </div>
      {/* Centered title */}
      <span className="text-base font-semibold w-full text-center">
        {title}
      </span>
    </div>
  );

  // Get the back title for mobile navigation
  const getMobileBackTitle = () => {
    // If we're in a nested folder within a sidebar section, show parent folder name
    const sidebarPath = getPathForSidebar(selectedSidebar);
    if (currentPath !== sidebarPath && currentPath.startsWith(HOME_DIR)) {
      const parentPath = currentPath.split("/").slice(0, -1).join("/");
      if (parentPath === sidebarPath || parentPath === PROJECTS_DIR) {
        // Going back to the sidebar section
        return SIDEBAR_ITEMS.find(item => item.id === selectedSidebar)?.label || "Browse";
      }
      // Going back to parent folder
      return currentPath.split("/").slice(-2, -1)[0] || "Back";
    }
    return "Browse";
  };

  // Render sidebar
  const renderSidebar = () => {
    // Mobile sidebar - iOS Files style with cards
    if (isMobile) {
      return (
        <div className="flex-1 overflow-y-auto px-4 pt-6 pb-8 bg-zinc-100/50 dark:bg-zinc-800/50">
          {/* Favorites card */}
          <div className="rounded-xl bg-white dark:bg-zinc-800 overflow-hidden">
            {SIDEBAR_ITEMS.map((item, index) => (
              <button
                key={item.id}
                onClick={() => handleSidebarSelect(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 text-base transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700",
                  index < SIDEBAR_ITEMS.length - 1 && "border-b border-zinc-200 dark:border-zinc-700"
                )}
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500">
                  <SidebarIcon icon={item.icon} className="w-5 h-5 text-white" />
                </span>
                <span className="flex-1 text-left text-zinc-900 dark:text-white">{item.label}</span>
                <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Desktop sidebar
    return (
      <div className="flex flex-col w-48 border-r border-zinc-200 dark:border-zinc-700 bg-zinc-100/80 dark:bg-zinc-800/80 backdrop-blur-xl">
        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Favorites
          </div>
          {SIDEBAR_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => handleSidebarSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded-md",
                selectedSidebar === item.id
                  ? "bg-zinc-300 dark:bg-zinc-600 text-zinc-900 dark:text-white"
                  : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              )}
            >
              <SidebarIcon
                icon={item.icon}
                className="w-4 h-4 text-blue-500"
              />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Render file grid (desktop)
  const renderFileGrid = () => (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2 p-4">
      {files.map(file => (
        <button
          key={file.path}
          onClick={() => handleFileClick(file)}
          onDoubleClick={() => handleFileDoubleClick(file)}
          className={cn(
            "flex flex-col items-center gap-1 p-2 rounded-lg text-center",
            selectedFile === file.path
              ? "bg-blue-500/20 ring-1 ring-blue-500"
              : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
          )}
        >
          <FileIcon type={file.type} name={file.name} icon={file.icon} className="w-12 h-12" />
          <span className="text-xs text-zinc-700 dark:text-zinc-300 break-all line-clamp-2">
            {file.name}
          </span>
        </button>
      ))}
      {files.length === 0 && !loading && (
        <div className="col-span-full text-center text-sm text-zinc-400 dark:text-zinc-500 py-8">
          This folder is empty
        </div>
      )}
    </div>
  );

  // Render file list (mobile)
  const renderFileList = () => (
    <div className="px-4 pt-2 pb-8">
      <div className="rounded-xl bg-white dark:bg-zinc-800 overflow-hidden">
        {files.map((file, index) => (
          <button
            key={file.path}
            onClick={() => {
              handleFileClick(file);
              if (file.type === "dir" || file.type === "app") {
                handleFileDoubleClick(file);
              }
            }}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-700",
              index < files.length - 1 && "border-b border-zinc-200 dark:border-zinc-700"
            )}
          >
            <FileIcon type={file.type} name={file.name} icon={file.icon} className="w-10 h-10 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-base text-zinc-900 dark:text-white truncate">
                {file.name}
              </div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                {file.type === "dir" ? "Folder" : file.type === "app" ? "Application" : "File"}
              </div>
            </div>
            {(file.type === "dir" || file.type === "app") && (
              <svg className="w-5 h-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </button>
        ))}
      </div>
      {files.length === 0 && !loading && (
        <div className="text-center text-sm text-zinc-400 dark:text-zinc-500 py-8">
          This folder is empty
        </div>
      )}
    </div>
  );

  // Render nav bar
  const renderNav = () => (
    <div
      className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 select-none"
      onMouseDown={inDesktopShell ? windowFocus.onDragStart : undefined}
    >
      {/* Traffic lights (desktop) */}
      <div className="window-controls flex items-center gap-1.5">
        {inDesktopShell ? (
          <>
            <button
              onClick={windowFocus.closeWindow}
              className="cursor-pointer w-3 h-3 rounded-full bg-red-500 hover:bg-red-700"
            />
            <button
              onClick={windowFocus.minimizeWindow}
              className="cursor-pointer w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-700"
            />
            <button
              onClick={windowFocus.toggleMaximize}
              className="cursor-pointer w-3 h-3 rounded-full bg-green-500 hover:bg-green-700"
            />
          </>
        ) : !isMobile ? (
          <>
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </>
        ) : null}
      </div>

      {/* Navigation arrows (desktop) */}
      {!isMobile && (
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={handleBack}
            disabled={!canGoBack()}
            className={cn(
              "p-1 rounded",
              canGoBack()
                ? "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                : "text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
            )}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            disabled
            className="p-1 rounded text-zinc-300 dark:text-zinc-600 cursor-not-allowed"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Breadcrumb (desktop) / Title (mobile) */}
      <div className="flex-1 flex items-center justify-center">
        {isMobile ? (
          <span className="text-sm font-medium text-zinc-900 dark:text-white">
            {getBreadcrumbs().slice(-1)[0]}
          </span>
        ) : (
          <div className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
            {getBreadcrumbs().map((part, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-zinc-400">/</span>}
                <span className={i === getBreadcrumbs().length - 1 ? "text-zinc-900 dark:text-white font-medium" : ""}>
                  {part}
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="w-16" />
    </div>
  );

  // Mobile view
  if (isMobile) {
    return (
      <div
        ref={containerRef}
        className="flex flex-col h-dvh w-full bg-zinc-100/50 dark:bg-zinc-900"
        data-app="finder"
      >
        {showSidebar ? (
          <>
            {renderMobileSidebarNav()}
            {renderSidebar()}
          </>
        ) : (
          <>
            {renderMobileContentNav(getBreadcrumbs().slice(-1)[0], getMobileBackTitle())}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-zinc-500">Loading...</div>
                </div>
              ) : (
                renderFileList()
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // Desktop view
  return (
    <div
      ref={containerRef}
      className="flex flex-col h-full bg-white dark:bg-zinc-900"
      data-app="finder"
    >
      {renderNav()}
      <div className="flex flex-1 min-h-0">
        {renderSidebar()}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-zinc-500">Loading...</div>
            </div>
          ) : previewContent !== null ? (
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-white">
                  {selectedFile?.split("/").pop()}
                </h3>
                <button
                  onClick={() => setPreviewContent(null)}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Close Preview
                </button>
              </div>
              <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono bg-zinc-50 dark:bg-zinc-800 p-4 rounded-lg overflow-auto max-h-[60vh]">
                {previewContent}
              </pre>
            </div>
          ) : (
            renderFileGrid()
          )}
        </div>
      </div>
    </div>
  );
}
