import { TrackRow } from "@/components/ui/TrackRow";
import type { MusicTrack } from "@/types/music";

interface SearchResultsProps {
  tracks: readonly MusicTrack[];
  currentTrackId: string | null;
  isPlaying: boolean;
  /** Index of the clicked track inside `tracks`. */
  onPlay: (index: number) => void;
  isLiked: (trackId: string) => boolean;
  onToggleLike: (track: MusicTrack) => void;
  onAddToPlaylist?: (track: MusicTrack) => void;
}

/** Presentational: tracks in, callbacks out. */
export function SearchResults({
  tracks,
  currentTrackId,
  isPlaying,
  onPlay,
  isLiked,
  onToggleLike,
  onAddToPlaylist,
}: SearchResultsProps) {
  return (
    <ul className="flex flex-col gap-0.5">
      {tracks.map((track, index) => (
        <li key={track.id} className="min-w-0">
          <TrackRow
            track={track}
            index={index}
            active={track.id === currentTrackId}
            isPlaying={isPlaying}
            onPlay={() => onPlay(index)}
            isLiked={isLiked(track.id)}
            onLike={() => onToggleLike(track)}
            onAddToPlaylist={
              onAddToPlaylist ? () => onAddToPlaylist(track) : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}
