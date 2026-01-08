"use client";

import { useEffect, RefObject } from "react";

/**
 * Hook to detect clicks outside a referenced element
 * Uses capture phase to catch events before they can be stopped
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  isOpen: boolean
) {
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (ref.current && !ref.current.contains(target)) {
        onClose();
      }
    };

    // Small delay to prevent the opening click from immediately closing
    const timeoutId = setTimeout(() => {
      // Use capture phase to catch events before they can be stopped
      document.addEventListener("mousedown", handleClickOutside, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [isOpen, onClose, ref]);
}
