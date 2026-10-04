import { create } from "zustand";

import { toLibraryTrackSnapshot } from "@/lib/music/snapshot";
import {
  clampVolume,
  getAudioEngine,
  type AudioEngine,
  type EngineState,
} from "@/lib/player/audio-engine";
import {
  createSequentialOrder,
  createShuffledOrder,
  getNextIndex,
  resolvePrevious,
  sanitizeQueue,
} from "@/lib/player/queue";
import {
  GENERIC_PLAY_ERROR,
  StreamResolveError,
  isPlayableUrl,
  resolveStreamUrl,
} from "@/lib/player/resolve-stream";
import { recentRepository } from "@/lib/storage";
import { usePlayerProgressStore } from "@/store/player-progress-store";
import type { MusicTrack } from "@/types/music";
import type { PlayerState, RepeatMode } from "@/types/player";

interface PlayerActions {
  playQueue(tracks: readonly MusicTrack[], index: number): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  toggle(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  toggleShuffle(): void;
  cycleRepeat(): void;
  stop(): void;
  clearError(): void;
}

/** `playOrder` holds queue indices in playback order (shuffled or sequential). */
export type PlayerStore = PlayerState & {
  playOrder: readonly number[];
} & PlayerActions;

const BLOCKED_MESSAGE = "Playback was blocked. Press play to start.";

const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = {
  off: "all",
  all: "one",
  one: "off",
};

const progress = () => usePlayerProgressStore.getState();
const current = () => usePlayerStore.getState();

/** Bumped by every new playback request; older async work checks it. */
let generation = 0;
let resolveController: AbortController | null = null;
/** True when the engine holds a loaded source for the current track. */
let engineLoaded = false;
let recordedGeneration = -1;
let wiredEngine: AudioEngine | null = null;
/**
 * Track whose inline streamUrl just failed in the audio element (expired or
 * dead). The next start of that track asks /api/track for a fresh URL
 * instead of retrying the same one.
 */
let staleStreamTrackId: string | null = null;

export const usePlayerStore = create<PlayerStore>()(() => ({
  currentTrack: null,
  queue: [],
  queueIndex: -1,
  playOrder: [],
  status: "idle",
  volume: 1,
  muted: false,
  shuffle: false,
  repeat: "off",
  error: null,
  playQueue,
  play,
  pause,
  toggle,
  next,
  previous,
  seek,
  setVolume,
  setMuted,
  toggleShuffle,
  cycleRepeat,
  stop,
  clearError,
}));

/**
 * Connects the singleton engine to this store exactly once. Safe to call
 * repeatedly (Strict Mode, hot reload): it never adds a second listener.
 * Returns null on the server.
 */
export function ensurePlayerEngine(): AudioEngine | null {
  const engine = getAudioEngine();
  if (engine === null) return null;

  if (wiredEngine !== engine) {
    engine.setCallbacks({
      onState: handleEngineState,
      onTime: (seconds) => progress().setCurrentTime(seconds),
      onDuration: (seconds) => {
        if (seconds > 0) progress().setDuration(seconds);
      },
      onEnded: handleEnded,
      onError: () => {
        staleStreamTrackId = current().currentTrack?.id ?? null;
        failPlayback(GENERIC_PLAY_ERROR);
      },
    });

    const { volume, muted } = current();
    engine.setVolume(volume);
    engine.setMuted(muted);
    wiredEngine = engine;
  }

  return engine;
}

/** Invalidates in-flight work and aborts a pending stream resolve. */
function beginOperation(): number {
  generation += 1;
  resolveController?.abort();
  resolveController = null;
  return generation;
}

function errorName(error: unknown): string | null {
  return typeof error === "object" &&
    error !== null &&
    "name" in error &&
    typeof error.name === "string"
    ? error.name
    : null;
}

function failPlayback(message: string): void {
  engineLoaded = false;
  usePlayerStore.setState({ status: "error", error: { message } });
}

function handlePlayRejection(error: unknown): void {
  const name = errorName(error);

  // Interrupted by pause() or a newer load: state is handled by whoever did it.
  if (name === "AbortError") return;

  if (name === "NotAllowedError") {
    usePlayerStore.setState({
      status: "paused",
      error: { message: BLOCKED_MESSAGE },
    });
    return;
  }

  failPlayback(GENERIC_PLAY_ERROR);
}

function recordRecentlyPlayed(track: MusicTrack): void {
  try {
    recentRepository.add(toLibraryTrackSnapshot(track));
  } catch {
    // History is a convenience; never let it break playback.
  }
}

/** Loads and plays the queue entry at `index`. Stale results are ignored. */
async function startTrack(index: number): Promise<void> {
  const engine = ensurePlayerEngine();
  const track = current().queue[index];
  if (engine === null || track === undefined) return;

  const operation = beginOperation();
  engineLoaded = false;
  engine.pause();

  usePlayerStore.setState({
    currentTrack: track,
    queueIndex: index,
    status: "loading",
    error: null,
  });
  progress().reset();
  progress().setDuration(track.duration ?? 0);

  let url = staleStreamTrackId === track.id ? null : track.streamUrl;
  if (staleStreamTrackId === track.id) staleStreamTrackId = null;

  if (url === null) {
    const controller = new AbortController();
    resolveController = controller;

    try {
      url = await resolveStreamUrl(track.id, controller.signal);
    } catch (error) {
      if (operation === generation) {
        failPlayback(
          error instanceof StreamResolveError
            ? error.userMessage
            : GENERIC_PLAY_ERROR,
        );
      }
      return;
    } finally {
      if (resolveController === controller) resolveController = null;
    }
  }

  if (operation !== generation) return;

  if (!isPlayableUrl(url)) {
    failPlayback(GENERIC_PLAY_ERROR);
    return;
  }

  engine.load(url);
  engineLoaded = true;

  try {
    await engine.play();
  } catch (error) {
    if (operation === generation) handlePlayRejection(error);
  }
}

function handleEngineState(state: EngineState): void {
  const { status, currentTrack } = current();
  if (currentTrack === null) return;

  switch (state) {
    case "playing":
      if (status === "idle" || status === "error") return;

      usePlayerStore.setState({ status: "playing", error: null });

      if (recordedGeneration !== generation) {
        recordedGeneration = generation;
        recordRecentlyPlayed(currentTrack);
      }
      return;

    case "paused":
      if (status === "playing" || status === "buffering") {
        usePlayerStore.setState({ status: "paused" });
      }
      return;

    case "buffering":
      if (status === "playing") usePlayerStore.setState({ status: "buffering" });
      return;

    case "ready":
      if (status === "buffering" && getAudioEngine()?.isPaused() === false) {
        usePlayerStore.setState({ status: "playing" });
      }
      return;
  }
}

function replayCurrent(): void {
  const engine = ensurePlayerEngine();
  if (engine === null) return;

  const operation = generation;

  engine.seek(0);
  progress().setCurrentTime(0);
  usePlayerStore.setState({ status: "buffering", error: null });

  engine.play().catch((error: unknown) => {
    if (operation === generation) handlePlayRejection(error);
  });
}

function endPlayback(): void {
  beginOperation();
  getAudioEngine()?.pause();
  usePlayerStore.setState({ status: "ended" });
}

function handleEnded(): void {
  const { currentTrack, queueIndex, playOrder, repeat } = current();
  if (currentTrack === null) return;

  if (repeat === "one") {
    replayCurrent();
    return;
  }

  const nextIndex = getNextIndex(playOrder, queueIndex, repeat === "all");

  if (nextIndex === null) {
    endPlayback();
  } else if (nextIndex === queueIndex) {
    replayCurrent();
  } else {
    void startTrack(nextIndex);
  }
}

async function playQueue(
  tracks: readonly MusicTrack[],
  index: number,
): Promise<void> {
  const cleaned = sanitizeQueue(tracks, index);
  if (cleaned === null) return;

  const { queue, index: start } = cleaned;

  usePlayerStore.setState({
    queue,
    playOrder: current().shuffle
      ? createShuffledOrder(queue.length, start)
      : createSequentialOrder(queue.length),
  });

  await startTrack(start);
}

async function play(): Promise<void> {
  const engine = ensurePlayerEngine();
  const { status, currentTrack, queueIndex } = current();
  if (engine === null || currentTrack === null) return;

  if (status !== "paused" && status !== "ended" && status !== "error") return;

  if (!engineLoaded) {
    await startTrack(queueIndex);
    return;
  }

  if (status === "ended") {
    replayCurrent();
    return;
  }

  const operation = generation;
  usePlayerStore.setState({ status: "buffering", error: null });

  try {
    await engine.play();
  } catch (error) {
    if (operation === generation) handlePlayRejection(error);
  }
}

function pause(): void {
  const { status } = current();

  if (status === "loading") {
    beginOperation();
    engineLoaded = false;
    getAudioEngine()?.pause();
    usePlayerStore.setState({ status: "paused" });
    return;
  }

  if (status === "playing" || status === "buffering") {
    getAudioEngine()?.pause();
    usePlayerStore.setState({ status: "paused" });
  }
}

function toggle(): void {
  const { status } = current();

  if (status === "playing" || status === "buffering" || status === "loading") {
    pause();
  } else {
    void play();
  }
}

function next(): void {
  const { queueIndex, playOrder, repeat } = current();
  if (queueIndex < 0) return;

  const nextIndex = getNextIndex(playOrder, queueIndex, repeat !== "off");

  if (nextIndex === null) {
    endPlayback();
  } else {
    void startTrack(nextIndex);
  }
}

function previous(): void {
  const { queueIndex, playOrder, repeat } = current();
  const engine = ensurePlayerEngine();
  if (engine === null || queueIndex < 0) return;

  const action = resolvePrevious(
    engine.getCurrentTime(),
    playOrder,
    queueIndex,
    repeat !== "off",
  );

  if (action.type === "go") {
    void startTrack(action.index);
  } else if (!engineLoaded) {
    void startTrack(queueIndex);
  } else if (current().status === "paused" || current().status === "ended") {
    replayCurrent();
  } else {
    engine.seek(0);
    progress().setCurrentTime(0);
  }
}

function seek(seconds: number): void {
  const engine = getAudioEngine();
  if (engine === null || !engineLoaded) return;

  engine.seek(seconds);
  progress().setCurrentTime(engine.getCurrentTime());
}

function setVolume(volume: number): void {
  if (!Number.isFinite(volume)) return;

  const next = clampVolume(volume);
  usePlayerStore.setState({ volume: next });
  getAudioEngine()?.setVolume(next);
}

function setMuted(muted: boolean): void {
  usePlayerStore.setState({ muted });
  getAudioEngine()?.setMuted(muted);
}

function toggleShuffle(): void {
  const { shuffle, queue, queueIndex } = current();
  const enabled = !shuffle;

  usePlayerStore.setState({
    shuffle: enabled,
    playOrder: enabled
      ? createShuffledOrder(queue.length, queueIndex)
      : createSequentialOrder(queue.length),
  });
}

function cycleRepeat(): void {
  usePlayerStore.setState({ repeat: NEXT_REPEAT[current().repeat] });
}

function stop(): void {
  beginOperation();
  engineLoaded = false;
  getAudioEngine()?.unload();

  usePlayerStore.setState({
    currentTrack: null,
    queue: [],
    queueIndex: -1,
    playOrder: [],
    status: "idle",
    error: null,
  });
  progress().reset();
}

function clearError(): void {
  usePlayerStore.setState((state) => ({
    error: null,
    status:
      state.status === "error"
        ? state.currentTrack === null
          ? "idle"
          : "paused"
        : state.status,
  }));
}
