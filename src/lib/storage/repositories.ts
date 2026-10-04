import type {
  LibraryTrackSnapshot,
  Playlist,
  RecentItem,
} from "@/types/library";

import { STORAGE_KEYS } from "./keys";
import type {
  LikedRepository,
  MoveDirection,
  PlaylistRepository,
  RecentRepository,
  StorageAdapter,
  Unsubscribe,
} from "./types";
import {
  EMPTY_PLAYLISTS,
  EMPTY_RECENT,
  EMPTY_TRACKS,
  MAX_RECENT_ITEMS,
  parseLikedCollection,
  parsePlaylistCollection,
  parseRecentCollection,
  parseTrackSnapshot,
  safeJsonParse,
} from "./validation";

type PlaylistPatch = Partial<Pick<Playlist, "name" | "tracks">>;

interface Collection<T> {
  read(): T;
  write(value: T): void;
  clear(): void;
  subscribe(listener: () => void): Unsubscribe;
}

/**
 * A validated, cached view of one storage key.
 * read() re-parses only when the raw string changed, so it returns the same
 * reference until the data changes (required by useSyncExternalStore).
 */
function createCollection<T>(
  adapter: StorageAdapter,
  key: string,
  parse: (value: unknown) => T,
  empty: T,
): Collection<T> {
  let cachedRaw: string | null | undefined;
  let cachedValue: T = empty;

  return {
    read() {
      const raw = adapter.get(key);

      if (raw !== cachedRaw) {
        cachedValue = raw === null ? empty : parse(safeJsonParse(raw));
        cachedRaw = raw;
      }

      return cachedValue;
    },
    write: (value) => adapter.set(key, JSON.stringify(value)),
    clear: () => adapter.remove(key),
    subscribe: (listener) => adapter.subscribe(key, listener),
  };
}

/** crypto.randomUUID needs a secure context; fall back for plain-http dev. */
function generateId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"));

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join(""),
  ].join("-");
}

/** Liked songs, newest like first. */
export function createLikedRepository(adapter: StorageAdapter): LikedRepository {
  const collection = createCollection<readonly LibraryTrackSnapshot[]>(
    adapter,
    STORAGE_KEYS.liked,
    parseLikedCollection,
    EMPTY_TRACKS,
  );

  const getAll = () => collection.read();
  const has = (trackId: string) =>
    getAll().some((track) => track.id === trackId);

  function add(track: LibraryTrackSnapshot): void {
    const snapshot = parseTrackSnapshot(track);
    if (snapshot === null || has(snapshot.id)) return;

    collection.write([snapshot, ...getAll()]);
  }

  function remove(trackId: string): void {
    const current = getAll();
    const next = current.filter((track) => track.id !== trackId);

    if (next.length !== current.length) collection.write(next);
  }

  function toggle(track: LibraryTrackSnapshot): boolean {
    if (has(track.id)) {
      remove(track.id);
      return false;
    }

    add(track);
    return has(track.id);
  }

  return {
    getAll,
    has,
    add,
    remove,
    toggle,
    clear: collection.clear,
    subscribe: collection.subscribe,
  };
}

/** Recently played, most recent first, at most MAX_RECENT_ITEMS. */
export function createRecentRepository(
  adapter: StorageAdapter,
): RecentRepository {
  const collection = createCollection<readonly RecentItem[]>(
    adapter,
    STORAGE_KEYS.recent,
    parseRecentCollection,
    EMPTY_RECENT,
  );

  const getAll = () => collection.read();

  function add(track: LibraryTrackSnapshot): void {
    const snapshot = parseTrackSnapshot(track);
    if (snapshot === null) return;

    const others = getAll().filter((item) => item.track.id !== snapshot.id);

    collection.write(
      [{ track: snapshot, playedAt: Date.now() }, ...others].slice(
        0,
        MAX_RECENT_ITEMS,
      ),
    );
  }

  function remove(trackId: string): void {
    const current = getAll();
    const next = current.filter((item) => item.track.id !== trackId);

    if (next.length !== current.length) collection.write(next);
  }

  return {
    getAll,
    add,
    remove,
    clear: collection.clear,
    subscribe: collection.subscribe,
  };
}

/** Playlists in creation order (oldest first). */
export function createPlaylistRepository(
  adapter: StorageAdapter,
): PlaylistRepository {
  const collection = createCollection<readonly Playlist[]>(
    adapter,
    STORAGE_KEYS.playlists,
    parsePlaylistCollection,
    EMPTY_PLAYLISTS,
  );

  const getAll = () => collection.read();
  const getById = (id: string) =>
    getAll().find((playlist) => playlist.id === id) ?? null;

  /** Applies a patch to one playlist; no write when `update` returns null. */
  function mutate(
    id: string,
    update: (playlist: Playlist) => PlaylistPatch | null,
  ): boolean {
    const playlist = getById(id);
    if (playlist === null) return false;

    const patch = update(playlist);
    if (patch === null) return false;

    const changed: Playlist = { ...playlist, ...patch, updatedAt: Date.now() };

    collection.write(
      getAll().map((item) => (item.id === id ? changed : item)),
    );
    return true;
  }

  function create(name: string): Playlist | null {
    const trimmed = name.trim();
    if (trimmed === "") return null;

    const now = Date.now();
    const playlist: Playlist = {
      id: generateId(),
      name: trimmed,
      tracks: [],
      createdAt: now,
      updatedAt: now,
    };

    collection.write([...getAll(), playlist]);
    return playlist;
  }

  function rename(id: string, name: string): boolean {
    const trimmed = name.trim();
    if (trimmed === "") return false;

    return mutate(id, (playlist) =>
      playlist.name === trimmed ? null : { name: trimmed },
    );
  }

  function deletePlaylist(id: string): boolean {
    const current = getAll();
    const next = current.filter((playlist) => playlist.id !== id);
    if (next.length === current.length) return false;

    collection.write(next);
    return true;
  }

  function addTrack(playlistId: string, track: LibraryTrackSnapshot): boolean {
    const snapshot = parseTrackSnapshot(track);
    if (snapshot === null) return false;

    return mutate(playlistId, (playlist) =>
      playlist.tracks.some((item) => item.id === snapshot.id)
        ? null
        : { tracks: [...playlist.tracks, snapshot] },
    );
  }

  function removeTrack(playlistId: string, trackId: string): boolean {
    return mutate(playlistId, (playlist) => {
      const tracks = playlist.tracks.filter((track) => track.id !== trackId);
      return tracks.length === playlist.tracks.length ? null : { tracks };
    });
  }

  function moveTrack(
    playlistId: string,
    trackId: string,
    direction: MoveDirection,
  ): boolean {
    return mutate(playlistId, (playlist) => {
      const from = playlist.tracks.findIndex((track) => track.id === trackId);
      const to = direction === "up" ? from - 1 : from + 1;

      if (from === -1 || to < 0 || to >= playlist.tracks.length) return null;

      const tracks = [...playlist.tracks];
      [tracks[from], tracks[to]] = [tracks[to], tracks[from]];
      return { tracks };
    });
  }

  return {
    getAll,
    getById,
    create,
    rename,
    delete: deletePlaylist,
    addTrack,
    removeTrack,
    moveTrack,
    subscribe: collection.subscribe,
  };
}
