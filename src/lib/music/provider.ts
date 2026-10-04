import type { ApiErrorCode } from "@/types/api";
import type { MusicSearchOptions, MusicSource, MusicTrack } from "@/types/music";

export type MusicProviderErrorCode = Extract<
  ApiErrorCode,
  "PROVIDER_NOT_CONFIGURED" | "PROVIDER_ERROR" | "NOT_FOUND"
>;

/**
 * Error thrown by providers and the provider registry.
 * The API layer maps `code` to an HTTP status and sends the client a fixed
 * message, so `message` and `cause` are for server-side logs only and must
 * never contain secrets.
 */
export class MusicProviderError extends Error {
  readonly code: MusicProviderErrorCode;

  constructor(
    code: MusicProviderErrorCode,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "MusicProviderError";
    this.code = code;
  }
}

export interface MusicTrackLookupOptions {
  signal?: AbortSignal;
}

/**
 * Service boundary for a music source. Implementations normalize their own
 * raw responses and only ever return MusicTrack values whose ids are
 * namespaced as "source:rawId" (see createNamespacedId).
 */
export interface MusicProvider {
  readonly id: MusicSource;

  search(query: string, opts?: MusicSearchOptions): Promise<MusicTrack[]>;

  /**
   * @param id Provider-specific raw id, without the "source:" prefix.
   * Resolves to null when the track does not exist.
   */
  getTrack(
    id: string,
    opts?: MusicTrackLookupOptions,
  ): Promise<MusicTrack | null>;
}
