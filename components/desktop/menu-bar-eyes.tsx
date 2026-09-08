"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EYE_STYLE_STORAGE_KEY,
  getEyeStyle,
  nextEyeStyle,
  parseStoredEyeStyle,
  pupilOffset,
  type EyeStyleId,
} from "@/lib/menu-bar-eyes";

const VIEWBOX_WIDTH = 36;
const VIEWBOX_HEIGHT = 20;
const EYE_RADIUS = 7.6;
const EYE_CENTERS = [
  { x: 10, y: 11 },
  { x: 26, y: 11 },
];
const BLINK_MS = 130;
const IDLE_BLINK_MIN_MS = 4_000;
const IDLE_BLINK_MAX_MS = 8_000;

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Eyes in the menu bar that follow the pointer and blink when you click.
 *
 * One pointermove listener feeds a single animation frame, so a fast pointer
 * costs one paint per frame rather than one per event, and a still pointer
 * costs nothing. Pupil positions are written straight to the DOM because React
 * has no reason to re-render for two transforms.
 */
export function MenuBarEyes() {
  const [styleId, setStyleId] = useState<EyeStyleId>("googly");
  const [blinking, setBlinking] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pupilRefs = useRef<(SVGGElement | null)[]>([]);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);
  const blinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawRef = useRef<() => void>(() => {});

  const style = getEyeStyle(styleId);

  // Read after mount so the server render and the first client render agree.
  useEffect(() => {
    const stored = parseStoredEyeStyle(window.localStorage.getItem(EYE_STYLE_STORAGE_KEY));
    if (stored) setStyleId(stored);
  }, []);

  const blink = useCallback(() => {
    if (prefersReducedMotion()) return;
    setBlinking(true);
    if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    blinkTimeoutRef.current = setTimeout(() => setBlinking(false), BLINK_MS);
  }, []);

  const drawPupils = useCallback(() => {
    frameRef.current = null;
    const svg = svgRef.current;
    const pointer = pointerRef.current;
    if (!svg || !pointer) return;

    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    const scale = rect.width / VIEWBOX_WIDTH;
    const maxOffset = EYE_RADIUS - style.pupilRadius - 0.4;

    EYE_CENTERS.forEach((center, index) => {
      const pupil = pupilRefs.current[index];
      if (!pupil) return;
      const offset = pupilOffset(
        { x: rect.left + center.x * scale, y: rect.top + center.y * scale },
        pointer,
        maxOffset * scale
      );
      pupil.setAttribute(
        "transform",
        `translate(${(offset.x / scale).toFixed(2)} ${(offset.y / scale).toFixed(2)})`
      );
    });
  }, [style.pupilRadius]);

  // Kept in a ref so switching style does not tear down the listeners below.
  drawRef.current = drawPupils;

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const schedule = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(() => drawRef.current());
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
      schedule();
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", blink);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", blink);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [blink]);

  // A new style renders fresh pupils with no transform on them, so put them
  // back where the pointer left them instead of waiting for the next move.
  useEffect(() => {
    drawPupils();
  }, [drawPupils]);

  // An occasional blink with nobody clicking is what makes them read as alive
  // rather than as a widget.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let timeout: ReturnType<typeof setTimeout>;
    const schedule = () => {
      const delay = IDLE_BLINK_MIN_MS + Math.random() * (IDLE_BLINK_MAX_MS - IDLE_BLINK_MIN_MS);
      timeout = setTimeout(() => {
        if (!document.hidden) blink();
        schedule();
      }, delay);
    };
    schedule();
    return () => clearTimeout(timeout);
  }, [blink]);

  useEffect(() => {
    return () => {
      if (blinkTimeoutRef.current) clearTimeout(blinkTimeoutRef.current);
    };
  }, []);

  const cycleStyle = () => {
    const next = nextEyeStyle(styleId);
    setStyleId(next);
    window.localStorage.setItem(EYE_STYLE_STORAGE_KEY, next);
    blink();
  };

  return (
    <button
      onClick={cycleStyle}
      aria-label={`${style.label}, click to change`}
      title={style.label}
      className="flex items-center justify-center w-11 h-6 rounded transition-colors can-hover:hover:bg-white/10"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="w-10 h-[22px]"
        aria-hidden="true"
      >
        {EYE_CENTERS.map((center, index) => (
          <g
            key={center.x}
            style={{
              transform: blinking ? "scaleY(0.08)" : "scaleY(1)",
              transformOrigin: `${center.x}px ${center.y}px`,
              transition: `transform ${BLINK_MS}ms ease-in-out`,
            }}
          >
            <circle
              cx={center.x}
              cy={center.y}
              r={EYE_RADIUS}
              fill={style.sclera}
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={0.6}
            />
            <g
              ref={(node) => {
                pupilRefs.current[index] = node;
              }}
            >
              {style.iris && (
                <circle cx={center.x} cy={center.y} r={style.irisRadius} fill={style.iris} />
              )}
              {style.pupilShape === "round" ? (
                <circle cx={center.x} cy={center.y} r={style.pupilRadius} fill={style.pupil} />
              ) : (
                <ellipse
                  cx={center.x}
                  cy={center.y}
                  rx={style.pupilRadius * 0.34}
                  ry={style.pupilRadius}
                  fill={style.pupil}
                />
              )}
            </g>
            {style.brow && (
              <path
                d={`M ${center.x - EYE_RADIUS} ${center.y - EYE_RADIUS - 0.7} q ${EYE_RADIUS} -2.4 ${EYE_RADIUS * 2} 0`}
                stroke={style.brow}
                strokeWidth={1.1}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </g>
        ))}
      </svg>
    </button>
  );
}
