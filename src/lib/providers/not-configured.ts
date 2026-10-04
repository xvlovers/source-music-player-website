import {
  MusicProviderError,
  type MusicProvider,
} from "@/lib/music/provider";
import type { MusicSource, MusicTrack } from "@/types/music";

const MESSAGE = "No music provider is configured.";

/**
 * Default provider. Always fails with PROVIDER_NOT_CONFIGURED so the UI
 * shows an error instead of an empty (and misleading) result list.
 */
export class NotConfiguredProvider implements MusicProvider {
  readonly id: MusicSource = "not-configured";

  async search(): Promise<MusicTrack[]> {
    throw new MusicProviderError("PROVIDER_NOT_CONFIGURED", MESSAGE);
  }

  async getTrack(): Promise<MusicTrack | null> {
    throw new MusicProviderError("PROVIDER_NOT_CONFIGURED", MESSAGE);
  }
}
