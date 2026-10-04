import { createNamespacedId } from "@/lib/utils/id";
import type { MusicSource, MusicTrack } from "@/types/music";

const FALLBACK_TITLE = "Untitled";
const FALLBACK_ARTIST = "Unknown artist";

/** Provider-agnostic input for building a valid MusicTrack. */
export interface MusicTrackInput {
  source: MusicSource;
  rawId: string;
  title?: string | null;
  artist?: string | null;
  artworkUrl?: string | null;
  durationSeconds?: number | null;
  permalink?: string | null;
  streamUrl?: string | null;
}

/** Trims text and collapses inner whitespace. */
export function cleanText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Returns a normalized absolute http(s) URL, or null for anything else. */
export function toHttpUrl(value: string | null | undefined): string | null {
  const text = cleanText(value);
  if (text === "") return null;

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}

/** Whole seconds, or null for missing, negative or non-finite values. */
export function normalizeDurationSeconds(
  value: number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value);
}

/** Converts milliseconds (common in upstream APIs) to whole seconds. */
export function msToSeconds(ms: number | null | undefined): number | null {
  if (ms === null || ms === undefined) return null;
  return normalizeDurationSeconds(ms / 1000);
}

/**
 * Builds a valid MusicTrack from loosely typed provider values.
 * Returns null when source or rawId cannot form a namespaced id, so
 * providers can drop unusable items with flatMap.
 */
export function createMusicTrack(input: MusicTrackInput): MusicTrack | null {
  let id: string;

  try {
    id = createNamespacedId(input.source, input.rawId);
  } catch {
    return null;
  }

  return {
    id,
    title: cleanText(input.title) || FALLBACK_TITLE,
    artist: cleanText(input.artist) || FALLBACK_ARTIST,
    artworkUrl: toHttpUrl(input.artworkUrl),
    duration: normalizeDurationSeconds(input.durationSeconds),
    permalink: toHttpUrl(input.permalink),
    streamUrl: toHttpUrl(input.streamUrl),
    source: input.source,
  };
}
