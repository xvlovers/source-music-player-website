import { MusicProviderError } from "@/lib/music/provider";
import { cleanText, createMusicTrack } from "@/lib/music/normalize";
import type { MusicTrack } from "@/types/music";

import { buildStreamUrl, isValidRawId } from "./client";
import { AUDIUS_SITE_BASE, AUDIUS_SOURCE, type AudiusRawTrack } from "./types";

const ARTWORK_SIZES = ["480x480", "1000x1000", "150x150"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function pickArtwork(value: unknown): string | null {
  if (!isRecord(value)) return null;

  for (const size of ARTWORK_SIZES) {
    const candidate = value[size];
    if (typeof candidate === "string" && candidate !== "") return candidate;
  }

  return null;
}

function pickArtist(value: unknown): string {
  if (!isRecord(value)) return "";

  const name = typeof value.name === "string" ? cleanText(value.name) : "";
  if (name !== "") return name;

  return typeof value.handle === "string" ? cleanText(value.handle) : "";
}

function toPermalink(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/")) return null;
  return `${AUDIUS_SITE_BASE}${value}`;
}

/** False when the source explicitly says the track cannot be streamed. */
function isStreamable(raw: AudiusRawTrack): boolean {
  if (raw.is_streamable === false) return false;
  return !(isRecord(raw.access) && raw.access.stream === false);
}

export interface NormalizeOptions {
  /** Include the (runtime-only) stream URL. Search results leave it null. */
  withStream: boolean;
  /** Drop tracks the source marks as not streamable. */
  dropUnstreamable: boolean;
}

/**
 * Raw Audius track -> MusicTrack, or null when the item is unusable
 * (missing id/title, deleted, unlisted, not streamable when requested).
 */
export function normalizeAudiusTrack(
  value: unknown,
  options: NormalizeOptions,
): MusicTrack | null {
  if (!isRecord(value)) return null;

  const raw: AudiusRawTrack = value;

  if (typeof raw.id !== "string" || !isValidRawId(raw.id)) return null;
  if (typeof raw.title !== "string" || cleanText(raw.title) === "") return null;
  if (raw.is_delete === true || raw.is_unlisted === true) return null;

  const streamable = isStreamable(raw);
  if (options.dropUnstreamable && !streamable) return null;

  return createMusicTrack({
    source: AUDIUS_SOURCE,
    rawId: raw.id,
    title: raw.title,
    artist: pickArtist(raw.user),
    artworkUrl: pickArtwork(raw.artwork),
    durationSeconds: typeof raw.duration === "number" ? raw.duration : null,
    permalink: toPermalink(raw.permalink),
    streamUrl: options.withStream && streamable ? buildStreamUrl(raw.id) : null,
  });
}

/** Extracts `data` as a list; any other shape means the API changed. */
export function extractTrackList(body: unknown): unknown[] {
  if (isRecord(body) && Array.isArray(body.data)) return body.data;

  throw new MusicProviderError(
    "PROVIDER_ERROR",
    "Audius search response has an unexpected shape.",
  );
}

/** Extracts `data` as a single raw object; any other shape means the API changed. */
export function extractTrack(body: unknown): unknown {
  if (isRecord(body) && isRecord(body.data)) return body.data;

  throw new MusicProviderError(
    "PROVIDER_ERROR",
    "Audius track response has an unexpected shape.",
  );
}
