import { createMusicTrack } from "@/lib/music/normalize";
import { parseNamespacedId } from "@/lib/utils/id";
import type { MusicTrack } from "@/types/music";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

/**
 * Provider output is untrusted. This rebuilds a track from scratch through
 * createMusicTrack (trimmed text, http(s)-only URLs, valid duration) and
 * drops anything that is not a well-formed "source:rawId" track owned by
 * `expectedSource`. Unknown fields are never copied, so nothing a provider
 * adds can reach the frontend.
 */
export function sanitizeProviderTrack(
  value: unknown,
  expectedSource: string,
): MusicTrack | null {
  if (!isRecord(value)) return null;

  const id = asString(value.id);
  const parsed = id === null ? null : parseNamespacedId(id);

  if (parsed === null || parsed.source !== expectedSource) return null;
  if (value.source !== expectedSource) return null;

  const track = createMusicTrack({
    source: parsed.source,
    rawId: parsed.rawId,
    title: asString(value.title),
    artist: asString(value.artist),
    artworkUrl: asString(value.artworkUrl),
    durationSeconds: asNumber(value.duration),
    permalink: asString(value.permalink),
    streamUrl: asString(value.streamUrl),
  });

  // createMusicTrack rebuilds the id; it must match what the provider sent.
  return track !== null && track.id === id ? track : null;
}

/** Sanitizes a provider result list: invalid items and duplicate ids are dropped. */
export function sanitizeProviderTracks(
  values: unknown,
  expectedSource: string,
): MusicTrack[] {
  if (!Array.isArray(values)) return [];

  const seen = new Set<string>();
  const tracks: MusicTrack[] = [];

  for (const value of values) {
    const track = sanitizeProviderTrack(value, expectedSource);
    if (track === null || seen.has(track.id)) continue;

    seen.add(track.id);
    tracks.push(track);
  }

  return tracks;
}
