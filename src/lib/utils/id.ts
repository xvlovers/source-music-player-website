import type { MusicSource } from "@/types/music";

const SEPARATOR = ":";

export interface ParsedNamespacedId {
  source: MusicSource;
  rawId: string;
}

/**
 * Builds a namespaced id: "source:rawId".
 * Throws when source is empty or contains ":" or rawId is empty,
 * since that is a programming error in a provider.
 */
export function createNamespacedId(
  source: MusicSource,
  rawId: string,
): string {
  if (source === "" || source.includes(SEPARATOR)) {
    throw new Error(`Invalid music source: "${source}"`);
  }

  if (rawId === "") {
    throw new Error("Raw id must not be empty");
  }

  return `${source}${SEPARATOR}${rawId}`;
}

/**
 * Splits on the first ":" only, so raw ids may contain colons.
 * Returns null when the id is not a valid namespaced id.
 */
export function parseNamespacedId(id: string): ParsedNamespacedId | null {
  const index = id.indexOf(SEPARATOR);

  if (index <= 0) return null;

  const rawId = id.slice(index + SEPARATOR.length);

  if (rawId === "") return null;

  return { source: id.slice(0, index), rawId };
}
