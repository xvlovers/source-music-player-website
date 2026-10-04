import type { LibraryTrackSnapshot } from "@/types/library";
import type { MusicTrack } from "@/types/music";

/**
 * Copies only the persistent fields of a track.
 * Accepts a MusicTrack too (it is structurally compatible), but streamUrl
 * is never copied, because stream URLs expire and must be resolved again.
 */
export function toLibraryTrackSnapshot(
  track: LibraryTrackSnapshot,
): LibraryTrackSnapshot {
  return {
    id: track.id,
    title: track.title,
    artist: track.artist,
    artworkUrl: track.artworkUrl,
    duration: track.duration,
    permalink: track.permalink,
    source: track.source,
  };
}

/** Rebuilds a runtime track from a snapshot. streamUrl is null until resolved. */
export function toMusicTrack(snapshot: LibraryTrackSnapshot): MusicTrack {
  return { ...toLibraryTrackSnapshot(snapshot), streamUrl: null };
}
