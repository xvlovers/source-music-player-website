import { MusicProviderError } from "@/lib/music/provider";

import { AUDIUS_API_BASE, AUDIUS_APP_NAME } from "./types";

/** Long enough for a slow public node, short enough to never hang a request. */
export const REQUEST_TIMEOUT_MS = 10_000;

/** Upper bound for a response body; a normal answer is a few dozen KB. */
const MAX_BODY_CHARS = 2_000_000;

/** Raw ids from Audius are short alphanumeric hashes. */
const RAW_ID_PATTERN = /^[A-Za-z0-9_-]{1,32}$/;

export function isValidRawId(rawId: string): boolean {
  return RAW_ID_PATTERN.test(rawId);
}

export type AudiusResponse =
  | { found: true; body: unknown }
  | { found: false };

/**
 * GET against the public API with a hard timeout.
 * - HTTP 404 resolves to `{ found: false }`.
 * - Every other failure (network, timeout, HTTP error, oversized or
 *   non-JSON body, caller abort) becomes a MusicProviderError PROVIDER_ERROR.
 * The timer and abort listener are always cleaned up.
 */
async function requestJson(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<AudiusResponse> {
  const url = new URL(path, AUDIUS_API_BASE);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("app_name", AUDIUS_APP_NAME);

  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const onAbort = () => controller.abort();

  if (signal?.aborted) {
    controller.abort();
  } else {
    signal?.addEventListener("abort", onAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (response.status === 404) return { found: false };

    if (!response.ok) {
      throw new MusicProviderError(
        "PROVIDER_ERROR",
        `Audius responded with HTTP ${response.status}.`,
      );
    }

    // The body is read inside the try block so the timeout covers it too.
    const text = await response.text();

    if (text.length > MAX_BODY_CHARS) {
      throw new MusicProviderError(
        "PROVIDER_ERROR",
        "Audius response is too large.",
      );
    }

    let body: unknown;

    try {
      body = JSON.parse(text);
    } catch (cause) {
      throw new MusicProviderError(
        "PROVIDER_ERROR",
        "Audius returned invalid JSON.",
        { cause },
      );
    }

    return { found: true, body };
  } catch (error) {
    if (error instanceof MusicProviderError) throw error;

    throw new MusicProviderError(
      "PROVIDER_ERROR",
      timedOut ? "Audius request timed out." : "Audius request failed.",
      { cause: error },
    );
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}

/** GET /v1/tracks/search. Returns the raw response body. */
export async function searchTracksRaw(
  query: string,
  limit: number,
  signal?: AbortSignal,
): Promise<unknown> {
  const result = await requestJson(
    "/v1/tracks/search",
    { query, limit: String(limit) },
    signal,
  );

  if (!result.found) {
    throw new MusicProviderError(
      "PROVIDER_ERROR",
      "Audius search endpoint was not found.",
    );
  }

  return result.body;
}

/** GET /v1/tracks/{id}. Returns null when the track does not exist. */
export async function getTrackRaw(
  rawId: string,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const result = await requestJson(
    `/v1/tracks/${encodeURIComponent(rawId)}`,
    {},
    signal,
  );

  return result.found ? result.body : null;
}

/**
 * Documented public stream endpoint for a track. Audius answers it with a
 * redirect to the audio file, which the browser's audio element follows.
 * Built from the validated raw id only; never stored.
 */
export function buildStreamUrl(rawId: string): string {
  const url = new URL(
    `/v1/tracks/${encodeURIComponent(rawId)}/stream`,
    AUDIUS_API_BASE,
  );
  url.searchParams.set("app_name", AUDIUS_APP_NAME);
  return url.href;
}
