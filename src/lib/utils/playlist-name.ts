export const PLAYLIST_NAME_MAX_LENGTH = 60;

/**
 * Returns a user-facing message when `name` cannot be used as a playlist
 * name, or null when it is fine. Whitespace-only names are rejected; the
 * repository trims again, so callers may pass the raw input.
 */
export function validatePlaylistName(name: string): string | null {
  const trimmed = name.trim();

  if (trimmed === "") return "Enter a playlist name.";

  if (trimmed.length > PLAYLIST_NAME_MAX_LENGTH) {
    return `Use at most ${PLAYLIST_NAME_MAX_LENGTH} characters.`;
  }

  return null;
}
