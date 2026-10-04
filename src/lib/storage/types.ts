import type {
  LibraryTrackSnapshot,
  Playlist,
  RecentItem,
} from "@/types/library";

export type Unsubscribe = () => void;

export type MoveDirection = "up" | "down";

/** Minimal string key-value store with change notification. */
export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
  /** Notified after a change to `key`, from this tab or another one. */
  subscribe(key: string, listener: () => void): Unsubscribe;
}

/**
 * Every repository's getAll() returns a referentially stable value until the
 * underlying data changes, so it can be used directly as a snapshot.
 */
export interface LikedRepository {
  getAll(): readonly LibraryTrackSnapshot[];
  has(trackId: string): boolean;
  add(track: LibraryTrackSnapshot): void;
  remove(trackId: string): void;
  /** Returns whether the track is liked after the call. */
  toggle(track: LibraryTrackSnapshot): boolean;
  clear(): void;
  subscribe(listener: () => void): Unsubscribe;
}

export interface RecentRepository {
  getAll(): readonly RecentItem[];
  add(track: LibraryTrackSnapshot): void;
  remove(trackId: string): void;
  clear(): void;
  subscribe(listener: () => void): Unsubscribe;
}

/** Mutations return true when something actually changed. */
export interface PlaylistRepository {
  getAll(): readonly Playlist[];
  getById(id: string): Playlist | null;
  /** Returns null when the trimmed name is empty. */
  create(name: string): Playlist | null;
  rename(id: string, name: string): boolean;
  delete(id: string): boolean;
  addTrack(playlistId: string, track: LibraryTrackSnapshot): boolean;
  removeTrack(playlistId: string, trackId: string): boolean;
  moveTrack(
    playlistId: string,
    trackId: string,
    direction: MoveDirection,
  ): boolean;
  subscribe(listener: () => void): Unsubscribe;
}
