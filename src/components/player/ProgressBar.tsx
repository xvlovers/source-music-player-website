"use client";

import { useState, type CSSProperties } from "react";

import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/format-time";
import { usePlayerProgressStore } from "@/store/player-progress-store";
import { usePlayerStore } from "@/store/player-store";

/** Finite, non-negative seconds; anything else (NaN, Infinity, negative) is 0. */
function sanitize(seconds: number): number {
  return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
}

interface ProgressBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  showTimes?: boolean;
  className?: string;
}

/**
 * Seek slider on a native range input (mouse, touch and keyboard for free).
 * While the pointer is down the thumb follows the pointer and the seek is
 * sent once on release, so engine time updates never fight the drag.
 * Presentational: the caller supplies the numbers and the seek action.
 */
export function ProgressBar({
  currentTime,
  duration,
  onSeek,
  showTimes = true,
  className,
}: ProgressBarProps) {
  const [drag, setDrag] = useState<number | null>(null);

  const total = sanitize(duration);
  const position = Math.min(sanitize(currentTime), total);
  const shown = drag ?? position;
  const percent = total > 0 ? (shown / total) * 100 : 0;
  const clamp = (seconds: number) => Math.min(Math.max(seconds, 0), total);

  const commit = () => {
    if (drag !== null) onSeek(clamp(drag));
    setDrag(null);
  };

  return (
    <div className={cn("w-full min-w-0", className)}>
      <input
        type="range"
        className="slider"
        aria-label="Seek"
        aria-valuetext={`${formatTime(shown)} of ${formatTime(total)}`}
        min={0}
        max={total}
        step={1}
        value={shown}
        disabled={total === 0}
        style={{ "--fill": `${percent}%` } as CSSProperties}
        onPointerDown={() => setDrag(position)}
        onPointerUp={commit}
        onPointerCancel={commit}
        onLostPointerCapture={commit}
        onChange={(event) => {
          const value = Number(event.target.value);
          if (drag !== null) {
            setDrag(value);
          } else {
            onSeek(clamp(value)); // keyboard
          }
        }}
      />
      {showTimes && (
        <div className="flex justify-between text-xs tabular-nums text-muted">
          <span>{formatTime(shown)}</span>
          <span>{formatTime(total)}</span>
        </div>
      )}
    </div>
  );
}

/**
 * ProgressBar wired to the progress store and the seek action. Only this
 * component re-renders on playback ticks.
 */
export function PlayerProgress({ showTimes = true }: { showTimes?: boolean }) {
  const currentTime = usePlayerProgressStore((state) => state.currentTime);
  const duration = usePlayerProgressStore((state) => state.duration);
  const seek = usePlayerStore((state) => state.seek);

  return (
    <ProgressBar
      currentTime={currentTime}
      duration={duration}
      onSeek={seek}
      showTimes={showTimes}
    />
  );
}

/** Thin non-interactive indicator for the MiniPlayer. Re-renders alone. */
export function ProgressLine({ className }: { className?: string }) {
  const currentTime = usePlayerProgressStore((state) => state.currentTime);
  const duration = usePlayerProgressStore((state) => state.duration);

  const total = sanitize(duration);
  const percent =
    total > 0 ? Math.min(100, (sanitize(currentTime) / total) * 100) : 0;

  return (
    <div
      aria-hidden="true"
      className={cn("h-0.5 w-full bg-border", className)}
    >
      <div className="h-full bg-accent" style={{ width: `${percent}%` }} />
    </div>
  );
}
