"use client";

import { LoaderCircle, Pause, Play, RotateCw } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { usePlayerStore } from "@/store/player-store";

interface PlayPauseButtonProps {
  size?: "md" | "lg";
  /** "solid" is the large filled button of the full player. */
  variant?: "ghost" | "solid";
  /** Marks the button as the element the full player focuses on open. */
  initialFocus?: boolean;
}

/**
 * One button for every status. Buffering still counts as playing (shows
 * Pause); loading shows a spinner and can be cancelled with a press.
 */
export function PlayPauseButton({
  size = "md",
  variant = "ghost",
  initialFocus = false,
}: PlayPauseButtonProps) {
  const status = usePlayerStore((state) => state.status);
  const toggle = usePlayerStore((state) => state.toggle);

  const loading = status === "loading";
  const failed = status === "error";
  const active = loading || status === "playing" || status === "buffering";

  const Icon = loading ? LoaderCircle : failed ? RotateCw : active ? Pause : Play;
  const label = loading
    ? "Loading. Press to pause"
    : failed
      ? "Retry playback"
      : active
        ? "Pause"
        : "Play";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      aria-busy={loading || status === "buffering" || undefined}
      data-autofocus={initialFocus ? true : undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
        size === "lg" ? "size-14" : "size-11",
        variant === "solid"
          ? "bg-foreground text-background hover:bg-foreground/90"
          : "text-foreground hover:bg-surface-elevated",
      )}
    >
      <Icon
        aria-hidden="true"
        className={cn(
          size === "lg" ? "size-6" : "size-5",
          loading && "animate-spin motion-reduce:animate-none",
        )}
        fill={Icon === Play || Icon === Pause ? "currentColor" : "none"}
      />
    </button>
  );
}
