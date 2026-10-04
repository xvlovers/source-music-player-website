/**
 * Audius public API: constants and raw response shapes.
 * Raw shapes are deliberately loose (`unknown`): external data is never
 * trusted, and normalize.ts validates every field before use.
 * Nothing in this folder's raw types may leave the folder.
 */

/** Source name used in namespaced ids ("audius:rawId") and MUSIC_PROVIDER. */
export const AUDIUS_SOURCE = "audius";

/** Public, keyless API host (documented at https://docs.audius.org). */
export const AUDIUS_API_BASE = "https://api.audius.co";

/** Public site, used to turn a track permalink path into a full URL. */
export const AUDIUS_SITE_BASE = "https://audius.co";

/** Plain identifier of this app for the API (not a secret or credential). */
export const AUDIUS_APP_NAME = "music-standalone";

/** Raw track object as returned by the API. */
export interface AudiusRawTrack {
  id?: unknown;
  title?: unknown;
  user?: unknown;
  artwork?: unknown;
  duration?: unknown;
  permalink?: unknown;
  is_streamable?: unknown;
  is_delete?: unknown;
  is_unlisted?: unknown;
  access?: unknown;
}
