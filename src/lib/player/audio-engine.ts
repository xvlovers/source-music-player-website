export type EngineState = "playing" | "paused" | "buffering" | "ready";

export interface AudioEngineCallbacks {
  onState(state: EngineState): void;
  onTime(seconds: number): void;
  onDuration(seconds: number): void;
  onEnded(): void;
  onError(): void;
}

const HAVE_FUTURE_DATA = 3;

/** Clamps a finite volume to 0..1. */
export function clampVolume(volume: number): number {
  return Math.min(1, Math.max(0, volume));
}

/**
 * Thin wrapper around exactly one HTMLAudioElement.
 * It knows nothing about tracks, queues, stores or React: it plays a URL
 * and reports what the element does through callbacks.
 */
export class AudioEngine {
  private audio: HTMLAudioElement | null;
  private callbacks: Partial<AudioEngineCallbacks> = {};
  private removeListeners: () => void;

  constructor() {
    const audio = new Audio();
    audio.preload = "auto";

    this.audio = audio;
    this.removeListeners = this.attachListeners(audio);
  }

  setCallbacks(callbacks: Partial<AudioEngineCallbacks>): void {
    this.callbacks = callbacks;
  }

  clearCallbacks(): void {
    this.callbacks = {};
  }

  /** Stops the current playback and points the element at a new source. */
  load(url: string): void {
    const audio = this.audio;
    if (audio === null) return;

    audio.pause();
    audio.src = url;
    audio.load();
  }

  /**
   * Rejects when the browser refuses (autoplay policy) or the request is
   * interrupted; callers decide what that means for their state.
   */
  async play(): Promise<void> {
    const audio = this.audio;
    if (audio === null) throw new Error("Audio engine is destroyed.");

    await audio.play();
  }

  pause(): void {
    this.audio?.pause();
  }

  /** Stops playback and releases the current source. */
  unload(): void {
    const audio = this.audio;
    if (audio === null) return;

    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  }

  seek(seconds: number): void {
    const audio = this.audio;
    if (audio === null || Number.isNaN(seconds)) return;

    let target = Math.max(0, seconds);
    if (Number.isFinite(audio.duration)) target = Math.min(target, audio.duration);

    audio.currentTime = target;
  }

  setVolume(volume: number): void {
    if (this.audio === null || !Number.isFinite(volume)) return;

    this.audio.volume = clampVolume(volume);
  }

  /** Mute is independent of volume: the volume value is kept. */
  setMuted(muted: boolean): void {
    if (this.audio !== null) this.audio.muted = muted;
  }

  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0;
  }

  getDuration(): number {
    const duration = this.audio?.duration ?? 0;
    return Number.isFinite(duration) ? duration : 0;
  }

  isPaused(): boolean {
    return this.audio === null ? true : this.audio.paused;
  }

  /** Removes every listener, releases the element and clears callbacks. */
  destroy(): void {
    const audio = this.audio;
    if (audio === null) return;

    this.removeListeners();
    audio.pause();
    audio.removeAttribute("src");
    audio.load();

    this.audio = null;
    this.callbacks = {};
  }

  private emitState(state: EngineState): void {
    this.callbacks.onState?.(state);
  }

  private emitDuration(audio: HTMLAudioElement): void {
    this.callbacks.onDuration?.(
      Number.isFinite(audio.duration) ? audio.duration : 0,
    );
  }

  /** The only place that registers audio listeners. Returns the cleanup. */
  private attachListeners(audio: HTMLAudioElement): () => void {
    const handlers: ReadonlyArray<readonly [string, () => void]> = [
      [
        "play",
        () =>
          this.emitState(
            audio.readyState >= HAVE_FUTURE_DATA ? "playing" : "buffering",
          ),
      ],
      [
        "pause",
        () => {
          // Reaching the end fires "pause" before "ended"; that is not a user pause.
          if (!audio.ended) this.emitState("paused");
        },
      ],
      ["timeupdate", () => this.callbacks.onTime?.(audio.currentTime)],
      ["loadedmetadata", () => this.emitDuration(audio)],
      ["durationchange", () => this.emitDuration(audio)],
      ["waiting", () => this.emitState("buffering")],
      ["playing", () => this.emitState("playing")],
      ["canplay", () => this.emitState("ready")],
      ["ended", () => this.callbacks.onEnded?.()],
      [
        "error",
        () => {
          // Clearing the source also raises "error" in some browsers.
          if (audio.getAttribute("src") !== null) this.callbacks.onError?.();
        },
      ],
    ];

    for (const [name, handler] of handlers) {
      audio.addEventListener(name, handler);
    }

    return () => {
      for (const [name, handler] of handlers) {
        audio.removeEventListener(name, handler);
      }
    };
  }
}

interface EngineHolder {
  __musicAudioEngine?: AudioEngine;
}

/**
 * Lazy singleton. Returns null on the server. The instance lives on
 * globalThis so hot reloads and Strict Mode never create a second element.
 */
export function getAudioEngine(): AudioEngine | null {
  if (typeof window === "undefined" || typeof Audio === "undefined") {
    return null;
  }

  const holder = globalThis as typeof globalThis & EngineHolder;

  if (!holder.__musicAudioEngine) {
    holder.__musicAudioEngine = new AudioEngine();
  }

  return holder.__musicAudioEngine;
}

export function destroyAudioEngine(): void {
  const holder = globalThis as typeof globalThis & EngineHolder;

  holder.__musicAudioEngine?.destroy();
  delete holder.__musicAudioEngine;
}
