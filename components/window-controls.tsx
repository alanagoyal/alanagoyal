import { cn } from "@/lib/utils";

interface WindowControlsProps {
  inShell: boolean;
  showWhenNotInShell?: boolean;
  onClose?: () => void;
  onMinimize?: () => void;
  onToggleMaximize?: () => void;
  isMaximized?: boolean;
  closeLabel?: string;
  minimizeLabel?: string;
  maximizeLabel?: string;
  restoreLabel?: string;
  className?: string;
  closeOnly?: boolean; // Show grey circles instead of yellow/green for minimize/maximize
}

interface WindowControlButtonProps {
  colorClass: string;
  icon: React.ReactNode;
  iconColorClass: string;
  onClick?: () => void;
  ariaLabel?: string;
  interactive?: boolean;
}

const iconWrapperClasses =
  "pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 sm:group-hover:opacity-100";

function WindowControlButton({
  colorClass,
  icon,
  iconColorClass,
  onClick,
  ariaLabel,
  interactive = false,
}: WindowControlButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        "relative w-3 h-3 rounded-full flex items-center justify-center",
        interactive ? "cursor-pointer" : "cursor-default",
        colorClass
      )}
    >
      <span className={cn(iconWrapperClasses, iconColorClass)}>{icon}</span>
    </button>
  );
}

function CloseIcon() {
  return (
    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
      <path d="M2.5 1.5L5 4L7.5 1.5L8.5 2.5L6 5L8.5 7.5L7.5 8.5L5 6L2.5 8.5L1.5 7.5L4 5L1.5 2.5Z" />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M2 5h6" />
    </svg>
  );
}

function ZoomIcon({ isMaximized }: { isMaximized: boolean }) {
  // macOS style: two small filled triangles oriented diagonally
  // Default (not maximized): triangles point outward (expand)
  // Maximized: triangles point inward (contract)
  return isMaximized ? (
    // Exit fullscreen: triangles pointing inward toward center
    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
      {/* Upper-left triangle pointing toward center */}
      <polygon points="4.5,0.5 0.5,4.5 4.5,4.5" />
      {/* Lower-right triangle pointing toward center */}
      <polygon points="5.5,5.5 9.5,5.5 5.5,9.5" />
    </svg>
  ) : (
    // Enter fullscreen: triangles pointing outward away from center
    <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor">
      {/* Top-left triangle pointing outward */}
      <polygon points="2,2 6,2 2,6" />
      {/* Bottom-right triangle pointing outward */}
      <polygon points="8,8 4,8 8,4" />
    </svg>
  );
}

export function WindowControls({
  inShell,
  showWhenNotInShell = true,
  onClose,
  onMinimize,
  onToggleMaximize,
  isMaximized = false,
  closeLabel = "Close window",
  minimizeLabel = "Minimize window",
  maximizeLabel = "Maximize window",
  restoreLabel = "Restore window",
  className,
  closeOnly = false,
}: WindowControlsProps) {
  if (!inShell && !showWhenNotInShell) {
    return null;
  }

  const isCloseInteractive = !!onClose || inShell;

  return (
    <div className={cn("window-controls group flex items-center gap-1.5", className)}>
      <WindowControlButton
        colorClass="bg-red-500"
        icon={<CloseIcon />}
        iconColorClass="text-black/50"
        onClick={isCloseInteractive ? onClose : undefined}
        ariaLabel={isCloseInteractive ? closeLabel : undefined}
        interactive={isCloseInteractive}
      />
      {closeOnly ? (
        <>
          <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
          <div className="w-3 h-3 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </>
      ) : (
        <>
          <WindowControlButton
            colorClass="bg-yellow-500"
            icon={<MinimizeIcon />}
            iconColorClass="text-black/50"
            onClick={inShell ? onMinimize : undefined}
            ariaLabel={inShell ? minimizeLabel : undefined}
            interactive={inShell}
          />
          <WindowControlButton
            colorClass="bg-green-500"
            icon={<ZoomIcon isMaximized={inShell ? isMaximized : false} />}
            iconColorClass="text-black/50"
            onClick={inShell ? onToggleMaximize : undefined}
            ariaLabel={inShell ? (isMaximized ? restoreLabel : maximizeLabel) : undefined}
            interactive={inShell}
          />
        </>
      )}
    </div>
  );
}
