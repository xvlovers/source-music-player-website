import { create } from "zustand";

/**
 * Open/closed state of the player overlays only. It holds no playback state:
 * what is playing always comes from player-store.
 */
interface PlayerUiStore {
  fullOpen: boolean;
  /** The queue is a view inside the full player, so it needs fullOpen too. */
  queueOpen: boolean;
  openFull(): void;
  closeFull(): void;
  openQueue(): void;
  closeQueue(): void;
}

export const usePlayerUiStore = create<PlayerUiStore>()((set) => ({
  fullOpen: false,
  queueOpen: false,
  openFull: () => set({ fullOpen: true }),
  closeFull: () => set({ fullOpen: false, queueOpen: false }),
  openQueue: () => set({ queueOpen: true }),
  closeQueue: () => set({ queueOpen: false }),
}));
