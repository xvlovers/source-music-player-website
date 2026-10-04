/**
 * Identifier of a music provider (for example "soundcloud").
 * Intentionally a plain string so new providers can be added without
 * touching shared types.
 */
export type MusicSource = string;

/**
 * Runtime track model produced by a music provider.
 * Never persisted as-is: library storage uses LibraryTrackSnapshot instead.
 */
export interface MusicTrack {
  /** Namespaced by the provider, e.g. "source:rawId". */
  id: string;
  title: string;
  artist: string;
  artworkUrl: string | null;
  /** Duration in seconds, or null when unknown. */
  duration: number | null;
  permalink: string | null;
  /** Null when the track has to be resolved before it can be played. */
  streamUrl: string | null;
  source: MusicSource;
}

export interface MusicSearchOptions {
  limit?: number;
  signal?: AbortSignal;
}
