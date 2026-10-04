"use client";

import { useMemo, type ReactNode } from "react";

import type { ContextMenuItem } from "@/components/ui/ContextMenu";
import { TrackRow } from "@/components/ui/TrackRow";
import { useLibraryActions, useLikedTracks } from "@/hooks/useLibrary";
import { useTrackPlayback } from "@/hooks/useTrackPlayback";
import { toMusicTrack } from "@/lib/music/snapshot";
import { cn } from "@/lib/utils/cn";
import type { LibraryTrackSnapshot } from "@/types/library";

interface TrackListProps {
  tracks: readonly LibraryTrackSnapshot[];
  /** Numbers the rows on desktop (playlists). */
  showIndex?: boolean;
  onAddToPlaylist?: (track: LibraryTrackSnapshot) => void;
  /** Extra items for each row's menu (for example "Remove from playlist"). */
  getMenuItems?: (
    track: LibraryTrackSnapshot,
    index: number,
  ) => readonly ContextMenuItem[];
  /** Controls shown after each row (for example move up / move down). */
  renderTrailing?: (
    track: LibraryTrackSnapshot,
    index: number,
    count: number,
  ) => ReactNode;
  className?: string;
}

/**
 * Library-backed track list. Clicking a row makes the list shown the queue
 * (existing playQueue action); liked state comes straight from the library
 * domain, so it can never go stale.
 */
export function TrackList({
  tracks,
  showIndex = false,
  onAddToPlaylist,
  getMenuItems,
  renderTrailing,
  className,
}: TrackListProps) {
  const musicTracks = useMemo(() => tracks.map(toMusicTrack), [tracks]);
  const playback = useTrackPlayback(musicTracks);

  const likedTracks = useLikedTracks();
  const likedIds = useMemo(
    () => new Set(likedTracks.map((track) => track.id)),
    [likedTracks],
  );
  const { toggleLiked } = useLibraryActions();

  return (
    <ul className={cn("flex flex-col gap-0.5", className)}>
      {tracks.map((snapshot, index) => {
        const track = musicTracks[index];
        if (track === undefined) return null;

        return (
          <li key={snapshot.id} className="flex min-w-0 items-center">
            <TrackRow
              className="min-w-0 flex-1"
              track={track}
              index={showIndex ? index : undefined}
              active={track.id === playback.currentId}
              isPlaying={playback.isPlaying}
              onPlay={() => playback.play(index)}
              isLiked={likedIds.has(track.id)}
              onLike={() => toggleLiked(snapshot)}
              onAddToPlaylist={
                onAddToPlaylist ? () => onAddToPlaylist(snapshot) : undefined
              }
              menuItems={getMenuItems?.(snapshot, index)}
            />
            {renderTrailing?.(snapshot, index, tracks.length)}
          </li>
        );
      })}
    </ul>
  );
}
