import type { ApiErrorCode, SearchApiResponse } from "@/types/api";
import type { MusicTrack } from "@/types/music";

/** Codes the API can send, plus two raised locally when no valid envelope arrived. */
export type SearchErrorCode = ApiErrorCode | "NETWORK_ERROR" | "INVALID_RESPONSE";

export type SearchOutcome =
  | { ok: true; tracks: MusicTrack[] }
  | { ok: false; code: SearchErrorCode };

const API_ERROR_CODES: readonly string[] = [
  "INVALID_QUERY",
  "PROVIDER_NOT_CONFIGURED",
  "PROVIDER_ERROR",
  "NOT_FOUND",
  "UNKNOWN_INTERNAL_ERROR",
] satisfies ApiErrorCode[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isMusicTrack(value: unknown): value is MusicTrack {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    value.id !== "" &&
    typeof value.title === "string" &&
    typeof value.artist === "string" &&
    isNullableString(value.artworkUrl) &&
    (value.duration === null || typeof value.duration === "number") &&
    isNullableString(value.permalink) &&
    isNullableString(value.streamUrl) &&
    typeof value.source === "string"
  );
}

function isApiErrorCode(value: unknown): value is ApiErrorCode {
  return typeof value === "string" && API_ERROR_CODES.includes(value);
}

/** Narrows an unknown JSON body to the BATCH 3 envelope, validating every track. */
function isSearchApiResponse(body: unknown): body is SearchApiResponse {
  if (!isRecord(body)) return false;

  if (body.success === true) {
    return Array.isArray(body.data) && body.data.every(isMusicTrack);
  }

  return (
    body.success === false &&
    isRecord(body.error) &&
    isApiErrorCode(body.error.code) &&
    typeof body.error.message === "string"
  );
}

function dedupeById(tracks: readonly MusicTrack[]): MusicTrack[] {
  const seen = new Set<string>();
  const unique: MusicTrack[] = [];

  for (const track of tracks) {
    if (seen.has(track.id)) continue;
    seen.add(track.id);
    unique.push(track);
  }

  return unique;
}

/**
 * Calls our own GET /api/search (never a provider). Resolves with an outcome
 * for every server answer; rejects only when `signal` aborts, so callers can
 * tell a cancelled request from a failed one.
 */
export async function searchTracks(
  query: string,
  signal: AbortSignal,
): Promise<SearchOutcome> {
  let response: Response;

  try {
    response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (signal.aborted) throw error;
    return { ok: false, code: "NETWORK_ERROR" };
  }

  let body: unknown;

  try {
    body = await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    // Reached the server but the body was not JSON (e.g. an HTML error page).
    return { ok: false, code: "INVALID_RESPONSE" };
  }

  if (!isSearchApiResponse(body)) {
    return { ok: false, code: "INVALID_RESPONSE" };
  }

  if (!body.success) {
    return { ok: false, code: body.error.code };
  }

  return { ok: true, tracks: dedupeById(body.data) };
}
