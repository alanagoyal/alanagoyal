"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  ({ value, max = 100, step = 1, onValueChange, className, disabled }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const sliderRef = React.useRef<HTMLDivElement>(null);

    const currentValue = value[0] ?? 0;
    const percentage = (currentValue / max) * 100;

    const updateValue = React.useCallback(
      (clientX: number) => {
        if (!sliderRef.current || disabled) return;

        const rect = sliderRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        const rawPercentage = (x / rect.width) * 100;
        const clampedPercentage = Math.max(0, Math.min(100, rawPercentage));
        const newValue = Math.round((clampedPercentage / 100) * max / step) * step;

        onValueChange?.([newValue]);
      },
      [max, step, onValueChange, disabled]
    );

    const handleMouseDown = (e: React.MouseEvent) => {
      if (disabled) return;
      setIsDragging(true);
      updateValue(e.clientX);
    };

    React.useEffect(() => {
      if (!isDragging) return;

      const handleMouseMove = (e: MouseEvent) => {
        updateValue(e.clientX);
      };

      const handleMouseUp = () => {
        setIsDragging(false);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [isDragging, updateValue]);

    return (
      <div
        ref={(node) => {
          (sliderRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        onMouseDown={handleMouseDown}
        className={cn(
          "relative flex h-5 w-full touch-none select-none items-center cursor-pointer",
          disabled && "cursor-not-allowed opacity-50",
          className
        )}
      >
        <div className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
          <div
            className="absolute h-full bg-foreground rounded-full"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className={cn(
            "absolute block h-3.5 w-3.5 rounded-full bg-foreground shadow-sm transition-transform",
            isDragging && "scale-110"
          )}
          style={{ left: `calc(${percentage}% - 7px)` }}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";

export { Slider };
