"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  EMPTY_PLAYLISTS,
  EMPTY_RECENT,
  EMPTY_TRACKS,
  likedRepository,
  playlistRepository,
  recentRepository,
} from "@/lib/storage";
import type { MoveDirection } from "@/lib/storage";
import type {
  LibraryTrackSnapshot,
  Playlist,
  RecentItem,
} from "@/types/library";

const getEmptyTracks = () => EMPTY_TRACKS;
const getEmptyRecent = () => EMPTY_RECENT;
const getEmptyPlaylists = () => EMPTY_PLAYLISTS;
const getNoPlaylist = (): Playlist | null => null;

/** Liked songs, newest first. Re-renders only when liked songs change. */
export function useLikedTracks(): readonly LibraryTrackSnapshot[] {
  return useSyncExternalStore(
    likedRepository.subscribe,
    likedRepository.getAll,
    getEmptyTracks,
  );
}

/** Recently played items (track + playedAt), most recent first. */
export function useRecentItems(): readonly RecentItem[] {
  return useSyncExternalStore(
    recentRepository.subscribe,
    recentRepository.getAll,
    getEmptyRecent,
  );
}

export function usePlaylists(): readonly Playlist[] {
  return useSyncExternalStore(
    playlistRepository.subscribe,
    playlistRepository.getAll,
    getEmptyPlaylists,
  );
}

/** One playlist by id, or null when it does not exist. */
export function usePlaylist(id: string): Playlist | null {
  const getSnapshot = useCallback(
    () => playlistRepository.getById(id),
    [id],
  );

  return useSyncExternalStore(
    playlistRepository.subscribe,
    getSnapshot,
    getNoPlaylist,
  );
}

/** Whether one track is liked. Re-renders only when its answer changes. */
export function useIsLiked(trackId: string): boolean {
  const getSnapshot = useCallback(
    () => likedRepository.has(trackId),
    [trackId],
  );

  return useSyncExternalStore(likedRepository.subscribe, getSnapshot, () => false);
}

/**
 * Library actions. A stable module-level object that subscribes to nothing,
 * so components that only trigger actions never re-render on data changes.
 */
const libraryActions = {
  toggleLiked: (track: LibraryTrackSnapshot) => likedRepository.toggle(track),
  clearLiked: () => likedRepository.clear(),
  removeRecent: (trackId: string) => recentRepository.remove(trackId),
  clearRecent: () => recentRepository.clear(),
  createPlaylist: (name: string) => playlistRepository.create(name),
  renamePlaylist: (id: string, name: string) =>
    playlistRepository.rename(id, name),
  deletePlaylist: (id: string) => playlistRepository.delete(id),
  addTrackToPlaylist: (playlistId: string, track: LibraryTrackSnapshot) =>
    playlistRepository.addTrack(playlistId, track),
  removeTrackFromPlaylist: (playlistId: string, trackId: string) =>
    playlistRepository.removeTrack(playlistId, trackId),
  moveTrack: (playlistId: string, trackId: string, direction: MoveDirection) =>
    playlistRepository.moveTrack(playlistId, trackId, direction),
} as const;

export function useLibraryActions(): typeof libraryActions {
  return libraryActions;
}

/**
 * Everything at once, for pages that need it. Prefer the granular hooks
 * above in small components such as TrackRow.
 */
export function useLibrary() {
  const likedTracks = useLikedTracks();
  const recentItems = useRecentItems();
  const playlists = usePlaylists();

  const recentTracks = useMemo(
    () => recentItems.map((item) => item.track),
    [recentItems],
  );

  const likedIds = useMemo(
    () => new Set(likedTracks.map((track) => track.id)),
    [likedTracks],
  );

  const isLiked = useCallback(
    (trackId: string) => likedIds.has(trackId),
    [likedIds],
  );

  return {
    likedTracks,
    recentItems,
    recentTracks,
    playlists,
    isLiked,
    ...libraryActions,
  };
}
