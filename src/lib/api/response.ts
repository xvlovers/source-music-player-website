import { MusicProviderError } from "@/lib/music/provider";
import type { ApiError, ApiErrorCode, ApiSuccess } from "@/types/api";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  INVALID_QUERY: 400,
  PROVIDER_NOT_CONFIGURED: 503,
  NOT_FOUND: 404,
  PROVIDER_ERROR: 502,
  UNKNOWN_INTERNAL_ERROR: 500,
};

/** Fixed client-facing messages. Internal error text is never sent. */
const DEFAULT_MESSAGE: Record<ApiErrorCode, string> = {
  INVALID_QUERY: "Invalid request.",
  PROVIDER_NOT_CONFIGURED: "Music provider is not configured.",
  NOT_FOUND: "Track not found.",
  PROVIDER_ERROR: "Music provider request failed.",
  UNKNOWN_INTERNAL_ERROR: "Something went wrong on the server.",
};

export function jsonSuccess<T>(data: T): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, { headers: NO_STORE_HEADERS });
}

export function jsonError(
  code: ApiErrorCode,
  message: string = DEFAULT_MESSAGE[code],
  status: number = STATUS_BY_CODE[code],
): Response {
  const body: ApiError = { success: false, error: { code, message } };
  return Response.json(body, { status, headers: NO_STORE_HEADERS });
}

function logServerError(error: unknown): void {
  const detail =
    error instanceof Error ? `${error.name}: ${error.message}` : "Unknown error";
  console.error(`[music-api] ${detail}`);
}

/**
 * Maps any thrown value to the API envelope. The client only receives a
 * code and a fixed message: no stack, cause, upstream text or env values.
 *
 * - MusicProviderError keeps its own code (503 / 404 / 502).
 * - Anything else is UNKNOWN_INTERNAL_ERROR (500).
 * - When the client already went away (`signal` aborted) nothing is logged
 *   and the response is never read, so a bare 499 is returned.
 */
export function errorResponseFrom(
  error: unknown,
  signal?: AbortSignal,
): Response {
  if (signal?.aborted) return new Response(null, { status: 499 });

  if (error instanceof MusicProviderError) {
    if (error.code === "PROVIDER_ERROR") logServerError(error);
    return jsonError(error.code);
  }

  logServerError(error);
  return jsonError("UNKNOWN_INTERNAL_ERROR");
}
