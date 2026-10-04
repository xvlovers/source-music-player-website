import type { MusicSource } from "@/types/music";

/**
 * Persistent copy of a track. Deliberately has no streamUrl: stream URLs
 * can expire and are resolved again when the track is played.
 * Everything in the library models is JSON-serializable.
 */
export interface LibraryTrackSnapshot {
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  /** Duration in seconds, or null when unknown. */
  duration: number | null;
  permalink: string | null;
  source: MusicSource;
}

export interface RecentItem {
  track: LibraryTrackSnapshot;
  /** Unix timestamp in milliseconds. */
  playedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  tracks: readonly LibraryTrackSnapshot[];
  /** Unix timestamp in milliseconds. */
  createdAt: number;
  /** Unix timestamp in milliseconds. */
  updatedAt: number;
}
