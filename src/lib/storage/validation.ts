import { toLibraryTrackSnapshot } from "@/lib/music/snapshot";
import type {
  LibraryTrackSnapshot,
  Playlist,
  RecentItem,
} from "@/types/library";

export const MAX_RECENT_ITEMS = 50;

/** Stable empty values, shared by server snapshots and empty storage. */
export const EMPTY_TRACKS: readonly LibraryTrackSnapshot[] = Object.freeze([]);
export const EMPTY_RECENT: readonly RecentItem[] = Object.freeze([]);
export const EMPTY_PLAYLISTS: readonly Playlist[] = Object.freeze([]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value !== "";
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function dedupeBy<T>(items: readonly T[], getId: (item: T) => string): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const id = getId(item);
    if (seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }

  return result;
}

/** JSON.parse that never throws. Returns undefined for corrupt input. */
export function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}

export function isLibraryTrackSnapshot(
  value: unknown,
): value is LibraryTrackSnapshot {
  if (!isRecord(value)) return false;

  return (
    isNonEmptyString(value.id) &&
    typeof value.title === "string" &&
    typeof value.artist === "string" &&
    isNullableString(value.artworkUrl) &&
    (value.duration === null ||
      (isFiniteNumber(value.duration) && value.duration >= 0)) &&
    isNullableString(value.permalink) &&
    isNonEmptyString(value.source)
  );
}

/**
 * Validates untrusted input and returns a clean snapshot that contains only
 * the persistent fields (any extra field, such as streamUrl, is dropped).
 */
export function parseTrackSnapshot(value: unknown): LibraryTrackSnapshot | null {
  return isLibraryTrackSnapshot(value) ? toLibraryTrackSnapshot(value) : null;
}

function parseTrackList(value: unknown): LibraryTrackSnapshot[] {
  if (!Array.isArray(value)) return [];

  const tracks: LibraryTrackSnapshot[] = [];

  for (const item of value) {
    const track = parseTrackSnapshot(item);
    if (track !== null) tracks.push(track);
  }

  return dedupeBy(tracks, (track) => track.id);
}

/** Liked collection: invalid items dropped, duplicate ids removed. */
export function parseLikedCollection(
  value: unknown,
): readonly LibraryTrackSnapshot[] {
  return parseTrackList(value);
}

/**
 * Recent collection: invalid items dropped, ordered newest first by playedAt,
 * deduplicated (the newest entry of a track wins), capped at 50. Sorting here
 * means hand-edited or merged data still comes out in timestamp order.
 */
export function parseRecentCollection(value: unknown): readonly RecentItem[] {
  if (!Array.isArray(value)) return [];

  const items: RecentItem[] = [];

  for (const item of value) {
    if (!isRecord(item) || !isFiniteNumber(item.playedAt)) continue;

    const track = parseTrackSnapshot(item.track);
    if (track !== null) items.push({ track, playedAt: item.playedAt });
  }

  // Array.prototype.sort is stable, so equal timestamps keep stored order.
  items.sort((a, b) => b.playedAt - a.playedAt);

  return dedupeBy(items, (item) => item.track.id).slice(0, MAX_RECENT_ITEMS);
}

/** Playlist: invalid tracks inside are dropped, an invalid playlist is null. */
export function parsePlaylist(value: unknown): Playlist | null {
  if (!isRecord(value)) return null;

  if (
    !isNonEmptyString(value.id) ||
    typeof value.name !== "string" ||
    !isFiniteNumber(value.createdAt) ||
    !isFiniteNumber(value.updatedAt)
  ) {
    return null;
  }

  const name = value.name.trim();
  if (name === "") return null;

  return {
    id: value.id,
    name,
    tracks: parseTrackList(value.tracks),
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
  };
}

/** Playlist collection: invalid playlists dropped, duplicate ids removed. */
export function parsePlaylistCollection(value: unknown): readonly Playlist[] {
  if (!Array.isArray(value)) return [];

  const playlists: Playlist[] = [];

  for (const item of value) {
    const playlist = parsePlaylist(item);
    if (playlist !== null) playlists.push(playlist);
  }

  return dedupeBy(playlists, (playlist) => playlist.id);
}
