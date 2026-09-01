"use client";

import { RefObject, useEffect, useRef } from "react";

/**
 * Dismisses an open surface when a pointer interaction starts outside it.
 * Capture phase catches interactions before window dragging or menu controls
 * can stop propagation.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  isOpen: boolean
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDownOutside = (event: PointerEvent) => {
      const container = ref.current;
      if (container && !event.composedPath().includes(container)) {
        onCloseRef.current();
      }
    };

    document.addEventListener("pointerdown", handlePointerDownOutside, true);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDownOutside, true);
    };
  }, [isOpen, ref]);
}
