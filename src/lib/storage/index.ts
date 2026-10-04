import { createLocalStorageAdapter } from "./local-storage";
import {
  createLikedRepository,
  createPlaylistRepository,
  createRecentRepository,
} from "./repositories";

/**
 * One adapter (and therefore one `storage` listener) shared by all
 * repositories. Creating it touches no browser API, so importing this
 * module on the server is safe.
 */
const adapter = createLocalStorageAdapter();

export const likedRepository = createLikedRepository(adapter);
export const recentRepository = createRecentRepository(adapter);
export const playlistRepository = createPlaylistRepository(adapter);

export { STORAGE_KEYS } from "./keys";
export { EMPTY_PLAYLISTS, EMPTY_RECENT, EMPTY_TRACKS } from "./validation";
export type {
  LikedRepository,
  MoveDirection,
  PlaylistRepository,
  RecentRepository,
} from "./types";
