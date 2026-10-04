import type { MusicTrack } from "@/types/music";

export type PlayerStatus =
  | "idle"
  | "loading"
  | "playing"
  | "paused"
  | "buffering"
  | "ended"
  | "error";

export type RepeatMode = "off" | "all" | "one";

export interface PlayerError {
  message: string;
}

/**
 * Core player state. Playback progress (current time) is deliberately not
 * part of it: it lives in a separate progress store so frequent time updates
 * do not re-render the whole player UI.
 */
export interface PlayerState {
  currentTrack: MusicTrack | null;
  queue: readonly MusicTrack[];
  /** Index of currentTrack inside queue, or -1 when nothing is queued. */
  queueIndex: number;
  status: PlayerStatus;
  /** Range 0 to 1. */
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: RepeatMode;
  error: PlayerError | null;
}
