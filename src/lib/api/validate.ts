import { parseNamespacedId, type ParsedNamespacedId } from "@/lib/utils/id";

export const SEARCH_QUERY_MIN_LENGTH = 2;
export const SEARCH_QUERY_MAX_LENGTH = 100;
export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_SEARCH_LIMIT = 50;
export const MAX_TRACK_ID_LENGTH = 200;

/** C0 controls and DEL. Whitespace controls are collapsed before this check. */
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/;

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; message: string };

export interface SearchRequest {
  query: string;
  limit: number;
}

/**
 * Validates GET /api/search parameters.
 * `q` is trimmed and rejected (never truncated) when too short or too long.
 * `limit` is optional, must be a positive integer, and is capped server-side.
 */
export function parseSearchRequest(
  params: URLSearchParams,
): ValidationResult<SearchRequest> {
  const rawQuery = params.get("q");

  if (rawQuery === null) {
    return { ok: false, message: "Query parameter q is required." };
  }

  // Collapse whitespace so "a   b" and "a b" are the same search.
  const query = rawQuery.replace(/\s+/g, " ").trim();

  if (CONTROL_CHARS.test(query)) {
    return { ok: false, message: "Query contains invalid characters." };
  }

  if (query.length < SEARCH_QUERY_MIN_LENGTH) {
    return {
      ok: false,
      message: `Query must be at least ${SEARCH_QUERY_MIN_LENGTH} characters.`,
    };
  }

  if (query.length > SEARCH_QUERY_MAX_LENGTH) {
    return {
      ok: false,
      message: `Query must be at most ${SEARCH_QUERY_MAX_LENGTH} characters.`,
    };
  }

  const rawLimit = params.get("limit");

  if (rawLimit === null) {
    return { ok: true, value: { query, limit: DEFAULT_SEARCH_LIMIT } };
  }

  if (!/^\d{1,6}$/.test(rawLimit) || Number(rawLimit) < 1) {
    return { ok: false, message: "Limit must be a positive integer." };
  }

  return {
    ok: true,
    value: { query, limit: Math.min(Number(rawLimit), MAX_SEARCH_LIMIT) },
  };
}

/**
 * Validates the [id] segment of GET /api/track/[id].
 * Accepts an id that arrives still percent-encoded (e.g. "source%3Aid").
 */
export function parseTrackId(
  id: string,
): ValidationResult<ParsedNamespacedId> {
  if (
    id.length === 0 ||
    id.length > MAX_TRACK_ID_LENGTH ||
    CONTROL_CHARS.test(id)
  ) {
    return { ok: false, message: "Invalid track id." };
  }

  let parsed = parseNamespacedId(id);

  if (parsed === null && id.includes("%")) {
    try {
      parsed = parseNamespacedId(decodeURIComponent(id));
    } catch {
      parsed = null;
    }
  }

  if (parsed === null || CONTROL_CHARS.test(parsed.rawId)) {
    return { ok: false, message: "Invalid track id." };
  }

  return { ok: true, value: parsed };
}
