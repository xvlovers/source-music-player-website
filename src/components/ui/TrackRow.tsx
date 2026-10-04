import { Ellipsis, ExternalLink, Heart, ListPlus, Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils/cn";
import { formatTime } from "@/lib/utils/format-time";
import { isHttpUrl } from "@/lib/utils/url";
import type { MusicTrack } from "@/types/music";

import { Artwork } from "./Artwork";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { IconButton } from "./IconButton";

interface TrackRowProps {
  track: MusicTrack;
  /** Zero-based position. Shown as a number on desktop when provided. */
  index?: number;
  active?: boolean;
  isPlaying?: boolean;
  /** The parent decides what playing means (usually playQueue or toggle). */
  onPlay: () => void;
  onLike?: () => void;
  isLiked?: boolean;
  onAddToPlaylist?: () => void;
  /** Replaces the built-in menu: the "more" button just calls this. */
  onMore?: () => void;
  /** Extra items appended to the built-in menu (for example "Remove"). */
  menuItems?: readonly ContextMenuItem[];
  showArtist?: boolean;
  showDuration?: boolean;
  className?: string;
}

/**
 * Mobile:  [Artwork] [Title / Artist] [More]
 * Desktop: [#] [Artwork] [Title / Artist] [Duration] [Like] [More]
 * Presentational: every action is a callback from the parent.
 */
export function TrackRow({
  track,
  index,
  active = false,
  isPlaying = false,
  onPlay,
  onLike,
  isLiked = false,
  onAddToPlaylist,
  onMore,
  menuItems,
  showArtist = true,
  showDuration = true,
  className,
}: TrackRowProps) {
  const playing = active && isPlaying;
  const PlayIcon = playing ? Pause : Play;

  const items: ContextMenuItem[] = [
    {
      key: "play",
      label: playing ? "Pause" : "Play",
      icon: PlayIcon,
      onSelect: onPlay,
    },
  ];

  if (onLike) {
    items.push({
      key: "like",
      label: isLiked ? "Unlike" : "Like",
      icon: Heart,
      onSelect: onLike,
    });
  }

  if (onAddToPlaylist) {
    items.push({
      key: "add-to-playlist",
      label: "Add to playlist",
      icon: ListPlus,
      onSelect: onAddToPlaylist,
    });
  }

  if (isHttpUrl(track.permalink)) {
    items.push({
      key: "open-source",
      label: "Open source",
      icon: ExternalLink,
      href: track.permalink,
    });
  }

  if (menuItems) items.push(...menuItems);

  const moreLabel = `More options for ${track.title}`;

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-elevated/60 md:gap-3",
        active && "bg-surface-elevated/60",
        className,
      )}
    >
      {index !== undefined && (
        <span className="hidden w-6 shrink-0 text-center text-sm tabular-nums text-muted md:block">
          {index + 1}
        </span>
      )}

      <button
        type="button"
        onClick={onPlay}
        aria-label={`${playing ? "Pause" : "Play"} ${track.title}`}
        aria-current={active ? "true" : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md text-left"
      >
        <span className="relative shrink-0">
          <Artwork src={track.artworkUrl} alt="" size={44} />
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-0 flex items-center justify-center rounded-md bg-black/55 text-foreground transition-opacity",
              active
                ? "opacity-100"
                : "opacity-0 group-focus-within:opacity-100 group-hover:opacity-100",
            )}
          >
            <PlayIcon className="size-5" fill="currentColor" />
          </span>
        </span>

        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block truncate text-sm font-medium",
              active ? "text-accent" : "text-foreground",
            )}
          >
            {track.title}
          </span>
          {showArtist && (
            <span className="block truncate text-xs text-secondary">
              {track.artist}
            </span>
          )}
        </span>
      </button>

      {showDuration && (
        <span className="hidden w-12 shrink-0 text-right text-xs tabular-nums text-muted md:block">
          {track.duration === null ? "–" : formatTime(track.duration)}
        </span>
      )}

      {onLike && (
        <span className="hidden md:inline-flex">
          <IconButton
            icon={Heart}
            filled={isLiked}
            accent={isLiked}
            label={isLiked ? `Unlike ${track.title}` : `Like ${track.title}`}
            onClick={onLike}
          />
        </span>
      )}

      {onMore ? (
        <IconButton icon={Ellipsis} label={moreLabel} onClick={onMore} />
      ) : (
        <ContextMenu label={moreLabel} items={items} />
      )}
    </div>
  );
}
