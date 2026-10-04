"use client";

import { SkipBack, SkipForward, X } from "lucide-react";

import { Artwork } from "@/components/ui/Artwork";
import { IconButton } from "@/components/ui/IconButton";
import { usePlayerStore } from "@/store/player-store";
import { usePlayerUiStore } from "@/store/player-ui-store";

import { LikeCurrentButton } from "./LikeCurrentButton";
import { PlayPauseButton } from "./PlayPauseButton";
import { ProgressLine } from "./ProgressBar";

/**
 * Persistent mini player, mounted once in the root layout.
 * Layout contract (see AppShell): the root carries `data-mini-player`, which
 * reserves space through --player-offset; it is --mini-player-height tall,
 * sits above BottomNavigation on mobile and under the content column (right of the sidebar) on desktop.
 * Renders nothing, and reserves nothing, while there is no current track.
 */
export function MiniPlayer() {
  const track = usePlayerStore((state) => state.currentTrack);
  const errorMessage = usePlayerStore((state) => state.error?.message ?? null);
  const next = usePlayerStore((state) => state.next);
  const previous = usePlayerStore((state) => state.previous);
  const stop = usePlayerStore((state) => state.stop);
  const openFull = usePlayerUiStore((state) => state.openFull);

  if (track === null) return null;

  return (
    <div
      data-mini-player
      role="region"
      aria-label="Player"
      className="fixed inset-x-0 bottom-[calc(var(--bottom-nav-height)+env(safe-area-inset-bottom,0px))] z-40 h-[var(--mini-player-height)] border-t border-border bg-surface md:bottom-0 md:left-[var(--sidebar-width)]"
    >
      <ProgressLine className="absolute inset-x-0 top-0" />

      <div className="safe-x mx-auto flex h-full max-w-6xl items-center gap-1">
        <button
          type="button"
          onClick={openFull}
          aria-haspopup="dialog"
          aria-label={`Open player. ${track.title} by ${track.artist}`}
          className="flex h-full min-w-0 flex-1 items-center gap-3 rounded-md text-left"
        >
          <Artwork src={track.artworkUrl} alt="" size={44} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-foreground">
              {track.title}
            </span>
            {errorMessage !== null ? (
              <span className="block truncate text-xs text-danger">
                {errorMessage}
              </span>
            ) : (
              <span className="block truncate text-xs text-secondary">
                {track.artist}
              </span>
            )}
          </span>
        </button>

        {/* Wrapped, because IconButton already sets its own display. */}
        <span className="hidden sm:inline-flex">
          <LikeCurrentButton track={track} />
        </span>
        <span className="hidden md:inline-flex">
          <IconButton
            icon={SkipBack}
            filled
            label="Previous"
            onClick={previous}
          />
        </span>
        <PlayPauseButton />
        <IconButton icon={SkipForward} filled label="Next" onClick={next} />
        {errorMessage !== null && (
          <IconButton icon={X} label="Stop playback" onClick={stop} />
        )}
      </div>
    </div>
  );
}
