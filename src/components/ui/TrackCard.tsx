import { Ellipsis, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import type { MusicTrack } from "@/types/music";

import { Artwork } from "./Artwork";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { IconButton } from "./IconButton";

interface TrackCardProps {
  track: MusicTrack;
  onPlay: () => void;
  active?: boolean;
  isPlaying?: boolean;
  /** Replaces the menu: the "more" button just calls this. */
  onMore?: () => void;
  /** Items for the built-in menu. Without them (and without onMore) there is no menu. */
  menuItems?: readonly ContextMenuItem[];
  className?: string;
}

/** Grid/list tile: large artwork, title and artist. Presentational only. */
export function TrackCard({
  track,
  onPlay,
  active = false,
  isPlaying = false,
  onMore,
  menuItems,
  className,
}: TrackCardProps) {
  const playing = active && isPlaying;
  const PlayIcon = playing ? Pause : Play;
  const hasMenu = onMore !== undefined || (menuItems?.length ?? 0) > 0;
  const moreLabel = `More options for ${track.title}`;

  return (
    <div className={cn("group relative w-full min-w-0", className)}>
      <button
        type="button"
        onClick={onPlay}
        aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
        aria-current={active ? "true" : undefined}
        className="block w-full min-w-0 rounded-lg text-left"
      >
        <span className="relative block">
          <Artwork src={track.artworkUrl} alt="" size="fill" />
          <span
            aria-hidden="true"
            className={cn(
              "absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground transition-opacity",
              active
                ? "opacity-100"
                : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            <PlayIcon className="size-4" fill="currentColor" />
          </span>
        </span>

        <span className={cn("mt-2 block min-w-0", hasMenu && "pr-10")}>
          <span
            className={cn(
              "block truncate text-sm font-medium",
              active ? "text-accent" : "text-foreground",
            )}
          >
            {track.title}
          </span>
          <span className="block truncate text-xs text-secondary">
            {track.artist}
          </span>
        </span>
      </button>

      {hasMenu && (
        <span className="absolute bottom-0 right-0">
          {onMore ? (
            <IconButton
              icon={Ellipsis}
              size="sm"
              label={moreLabel}
              onClick={onMore}
            />
          ) : (
            <ContextMenu label={moreLabel} size="sm" items={menuItems ?? []} />
          )}
        </span>
      )}
    </div>
  );
}
