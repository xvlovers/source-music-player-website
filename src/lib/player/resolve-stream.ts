const GENERIC_MESSAGE = "Unable to play this track.";

const MESSAGE_BY_CODE = new Map<string, string>([
  ["NOT_FOUND", "This track is no longer available."],
  ["PROVIDER_NOT_CONFIGURED", "No music provider is configured."],
]);

/** Error whose message is safe to show to the user. */
export class StreamResolveError extends Error {
  readonly userMessage: string;

  constructor(userMessage: string = GENERIC_MESSAGE) {
    super(userMessage);
    this.name = "StreamResolveError";
    this.userMessage = userMessage;
  }
}

export const GENERIC_PLAY_ERROR = GENERIC_MESSAGE;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Only http(s) URLs are ever handed to the audio element. */
export function isPlayableUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/**
 * Asks our own API (never the provider directly) for a fresh stream URL.
 * The URL is runtime-only and must not be persisted.
 */
export async function resolveStreamUrl(
  trackId: string,
  signal: AbortSignal,
): Promise<string> {
  let body: unknown;

  try {
    const response = await fetch(`/api/track/${encodeURIComponent(trackId)}`, {
      signal,
      cache: "no-store",
    });
    body = await response.json();
  } catch (error) {
    if (signal.aborted) throw error;
    throw new StreamResolveError();
  }

  if (!isRecord(body)) throw new StreamResolveError();

  if (body.success !== true) {
    const code = isRecord(body.error) ? body.error.code : undefined;
    const message =
      typeof code === "string" ? MESSAGE_BY_CODE.get(code) : undefined;

    throw new StreamResolveError(message);
  }

  const data = body.data;

  // The answer must be for the track that was asked for.
  if (!isRecord(data) || data.id !== trackId) throw new StreamResolveError();

  if (typeof data.streamUrl !== "string") {
    throw new StreamResolveError("This track can't be played.");
  }

  if (!isPlayableUrl(data.streamUrl)) throw new StreamResolveError();

  return data.streamUrl;
}
