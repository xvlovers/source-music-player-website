"use client";

import { useCallback } from "react";

import { usePlayerStore } from "@/store/player-store";
import type { MusicTrack } from "@/types/music";

/**
 * Click behaviour shared by track lists: the clicked list becomes the queue
 * (existing playQueue action); clicking the active track toggles it.
 */
export function useTrackPlayback(tracks: readonly MusicTrack[]) {
  const currentId = usePlayerStore((state) => state.currentTrack?.id ?? null);
  const status = usePlayerStore((state) => state.status);
  const playQueue = usePlayerStore((state) => state.playQueue);
  const toggle = usePlayerStore((state) => state.toggle);

  const isPlaying = status === "playing" || status === "buffering";

  const play = useCallback(
    (index: number) => {
      const track = tracks[index];
      if (track === undefined) return;

      if (track.id === currentId) {
        toggle();
      } else {
        void playQueue(tracks, index);
      }
    },
    [tracks, currentId, playQueue, toggle],
  );

  return { currentId, isPlaying, play };
}
