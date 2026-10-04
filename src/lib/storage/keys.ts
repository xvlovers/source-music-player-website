/** Versioned, namespaced localStorage keys. Bump the version on schema changes. */
export const STORAGE_KEYS = {
  playlists: "mp:v1:playlists",
  liked: "mp:v1:liked",
  recent: "mp:v1:recent",
} as const;
