import { errorResponseFrom, jsonError, jsonSuccess } from "@/lib/api/response";
import { sanitizeProviderTrack } from "@/lib/api/sanitize";
import { parseTrackId } from "@/lib/api/validate";
import { MusicProviderError } from "@/lib/music/provider";
import { getProviderForSource } from "@/lib/providers";
import { createNamespacedId } from "@/lib/utils/id";

interface TrackRouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: Request,
  context: TrackRouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const parsed = parseTrackId(id);

  if (!parsed.ok) {
    return jsonError("INVALID_QUERY", parsed.message);
  }

  const { source, rawId } = parsed.value;

  try {
    const provider = getProviderForSource(source);
    const result: unknown = await provider.getTrack(rawId, {
      signal: request.signal,
    });

    if (result === null) {
      return jsonError("NOT_FOUND");
    }

    // Never hand the client anything but a clean track for the id it asked for.
    const track = sanitizeProviderTrack(result, source);

    if (track === null || track.id !== createNamespacedId(source, rawId)) {
      throw new MusicProviderError(
        "PROVIDER_ERROR",
        `Provider "${provider.id}" returned an invalid or mismatched track.`,
      );
    }

    return jsonSuccess(track);
  } catch (error) {
    return errorResponseFrom(error, request.signal);
  }
}
