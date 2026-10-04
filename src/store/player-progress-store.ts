import { create } from "zustand";

interface PlayerProgressStore {
  /** Seconds. */
  currentTime: number;
  /** Seconds, 0 when unknown. */
  duration: number;
  setCurrentTime(seconds: number): void;
  setDuration(seconds: number): void;
  reset(): void;
}

function toSeconds(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * Playback progress only. It changes several times a second, so it is kept
 * apart from the player store to avoid re-rendering all player UI.
 */
export const usePlayerProgressStore = create<PlayerProgressStore>()(
  (set, get) => ({
    currentTime: 0,
    duration: 0,
    setCurrentTime: (seconds) => {
      const next = toSeconds(seconds);
      if (next !== get().currentTime) set({ currentTime: next });
    },
    setDuration: (seconds) => {
      const next = toSeconds(seconds);
      if (next !== get().duration) set({ duration: next });
    },
    reset: () => set({ currentTime: 0, duration: 0 }),
  }),
);
