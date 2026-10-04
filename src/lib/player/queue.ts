import type { MusicTrack } from "@/types/music";

/** Past this many seconds, "previous" restarts the current track. */
export const PREVIOUS_RESTART_THRESHOLD_SECONDS = 3;

export type RandomSource = () => number;

export type PreviousAction =
  | { type: "restart" }
  | { type: "go"; index: number };

/** Clamps to a valid index. Returns -1 for an empty queue. */
export function clampIndex(index: number, length: number): number {
  if (length <= 0) return -1;
  if (!Number.isFinite(index)) return 0;

  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
}

function hasValidId(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id !== ""
  );
}

/**
 * Drops entries without a usable id and maps the requested start index onto
 * the cleaned list. Returns null when nothing playable is left.
 */
export function sanitizeQueue(
  tracks: readonly MusicTrack[],
  index: number,
): { queue: MusicTrack[]; index: number } | null {
  const requested = clampIndex(index, tracks.length);
  const queue: MusicTrack[] = [];
  let start = 0;

  tracks.forEach((track, position) => {
    if (position === requested) start = queue.length;
    if (hasValidId(track)) queue.push(track);
  });

  if (queue.length === 0) return null;

  return { queue, index: Math.min(start, queue.length - 1) };
}

/** Playback order for no shuffle: 0, 1, 2, ... */
export function createSequentialOrder(length: number): number[] {
  return Array.from({ length: Math.max(0, length) }, (_, index) => index);
}

/**
 * Shuffled playback order (Fisher-Yates) that never touches the queue itself.
 * The current index stays first so the track being played is not interrupted.
 */
export function createShuffledOrder(
  length: number,
  currentIndex: number,
  random: RandomSource = Math.random,
): number[] {
  const rest: number[] = [];

  for (let index = 0; index < length; index += 1) {
    if (index !== currentIndex) rest.push(index);
  }

  for (let i = rest.length - 1; i > 0; i -= 1) {
    const j = Math.min(Math.floor(random() * (i + 1)), i);
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }

  const hasCurrent =
    Number.isInteger(currentIndex) &&
    currentIndex >= 0 &&
    currentIndex < length;

  return hasCurrent ? [currentIndex, ...rest] : rest;
}

/**
 * Queue index that plays after currentIndex, following `order`.
 * At the end it wraps to the first entry when `wrap` is true, else null.
 */
export function getNextIndex(
  order: readonly number[],
  currentIndex: number,
  wrap: boolean,
): number | null {
  const position = order.indexOf(currentIndex);
  if (position === -1) return null;

  const next = order[position + 1];
  if (next !== undefined) return next;

  return wrap ? (order[0] ?? null) : null;
}

/** Queue index that plays before currentIndex, following `order`. */
export function getPreviousIndex(
  order: readonly number[],
  currentIndex: number,
  wrap: boolean,
): number | null {
  const position = order.indexOf(currentIndex);
  if (position === -1) return null;

  if (position > 0) return order[position - 1] ?? null;

  return wrap ? (order[order.length - 1] ?? null) : null;
}

/**
 * "Previous" rule: past the threshold restart the current track, otherwise
 * go to the previous one. With no previous track the current one restarts.
 */
export function resolvePrevious(
  currentTime: number,
  order: readonly number[],
  currentIndex: number,
  wrap: boolean,
): PreviousAction {
  if (currentTime > PREVIOUS_RESTART_THRESHOLD_SECONDS) {
    return { type: "restart" };
  }

  const index = getPreviousIndex(order, currentIndex, wrap);

  return index === null ? { type: "restart" } : { type: "go", index };
}
