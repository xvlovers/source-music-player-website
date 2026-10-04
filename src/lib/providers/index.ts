import {
  MusicProviderError,
  type MusicProvider,
} from "@/lib/music/provider";
import type { MusicSource } from "@/types/music";

import { AudiusProvider, AUDIUS_SOURCE } from "./audius";
import { NotConfiguredProvider } from "./not-configured";

/**
 * Providers available to MUSIC_PROVIDER, keyed by the env value.
 * A provider is added here as `name -> factory`. Factories run per call,
 * so nothing is created (and no request is made) at import or build time.
 */
const PROVIDER_FACTORIES = new Map<string, () => MusicProvider>([
  [AUDIUS_SOURCE, () => new AudiusProvider()],
]);

/**
 * Selects the provider named by MUSIC_PROVIDER when called.
 * Without the variable the NotConfiguredProvider is returned.
 * Throws PROVIDER_NOT_CONFIGURED when the name is unknown.
 */
export function getProvider(): MusicProvider {
  const name = process.env.MUSIC_PROVIDER?.trim();

  if (!name) return new NotConfiguredProvider();

  const create = PROVIDER_FACTORIES.get(name);

  if (!create) {
    throw new MusicProviderError(
      "PROVIDER_NOT_CONFIGURED",
      `Music provider "${name}" is not available.`,
    );
  }

  return create();
}

/**
 * Returns the active provider for a namespaced id's source.
 * A source the active provider does not own is NOT_FOUND, so an id is never
 * handed to a provider that did not create it. When nothing is configured
 * the NotConfiguredProvider is returned so callers get
 * PROVIDER_NOT_CONFIGURED rather than a misleading NOT_FOUND.
 */
export function getProviderForSource(source: MusicSource): MusicProvider {
  const provider = getProvider();

  if (provider instanceof NotConfiguredProvider) return provider;

  if (provider.id !== source) {
    throw new MusicProviderError(
      "NOT_FOUND",
      `Active provider "${provider.id}" does not serve source "${source}".`,
    );
  }

  return provider;
}
