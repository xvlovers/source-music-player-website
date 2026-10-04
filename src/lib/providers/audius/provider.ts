import {
  MusicProviderError,
  type MusicProvider,
  type MusicTrackLookupOptions,
} from "@/lib/music/provider";
import type { MusicSearchOptions, MusicTrack } from "@/types/music";

import { getTrackRaw, isValidRawId, searchTracksRaw } from "./client";
import {
  extractTrack,
  extractTrackList,
  normalizeAudiusTrack,
} from "./normalize";
import { AUDIUS_SOURCE } from "./types";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function clampLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

/**
 * Music provider backed by the public, keyless Audius API.
 * Search results carry no stream URL; /api/track/[id] -> getTrack() is the
 * only place a stream URL is produced, so it is always fresh.
 */
export class AudiusProvider implements MusicProvider {
  readonly id = AUDIUS_SOURCE;

  async search(
    query: string,
    opts?: MusicSearchOptions,
  ): Promise<MusicTrack[]> {
    const text = query.trim();
    if (text === "") return [];

    const limit = clampLimit(opts?.limit);
    const body = await searchTracksRaw(text, limit, opts?.signal);
    const items = extractTrackList(body);

    const tracks: MusicTrack[] = [];

    for (const item of items) {
      const track = normalizeAudiusTrack(item, {
        withStream: false,
        dropUnstreamable: true,
      });
      if (track !== null) tracks.push(track);
      if (tracks.length >= limit) break;
    }

    return tracks;
  }

  /** @param id Raw Audius id, without the "audius:" prefix. */
  async getTrack(
    id: string,
    opts?: MusicTrackLookupOptions,
  ): Promise<MusicTrack | null> {
    // Never forward an arbitrary string into a request path.
    if (!isValidRawId(id)) return null;

    const body = await getTrackRaw(id, opts?.signal);
    if (body === null) return null;

    const track = normalizeAudiusTrack(extractTrack(body), {
      withStream: true,
      dropUnstreamable: false,
    });

    // A response for another id or an unusable item is a broken answer.
    if (track === null) {
      throw new MusicProviderError(
        "PROVIDER_ERROR",
        "Audius returned an unusable track.",
      );
    }

    return track;
  }
}
