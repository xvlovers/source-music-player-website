import { errorResponseFrom, jsonError, jsonSuccess } from "@/lib/api/response";
import { sanitizeProviderTracks } from "@/lib/api/sanitize";
import { parseSearchRequest } from "@/lib/api/validate";
import { MusicProviderError } from "@/lib/music/provider";
import { getProvider } from "@/lib/providers";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const parsed = parseSearchRequest(searchParams);

  if (!parsed.ok) {
    return jsonError("INVALID_QUERY", parsed.message);
  }

  const { query, limit } = parsed.value;

  try {
    const provider = getProvider();
    const result: unknown = await provider.search(query, {
      limit,
      signal: request.signal,
    });

    // A provider that answers with something that is not a list is broken.
    if (!Array.isArray(result)) {
      throw new MusicProviderError(
        "PROVIDER_ERROR",
        `Provider "${provider.id}" returned a non-list search result.`,
      );
    }

    return jsonSuccess(
      sanitizeProviderTracks(result, provider.id).slice(0, limit),
    );
  } catch (error) {
    return errorResponseFrom(error, request.signal);
  }
}
