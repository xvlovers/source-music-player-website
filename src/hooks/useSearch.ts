"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  searchTracks,
  type SearchErrorCode,
  type SearchOutcome,
} from "@/lib/api/search-client";
import {
  SEARCH_QUERY_MAX_LENGTH,
  SEARCH_QUERY_MIN_LENGTH,
} from "@/lib/api/validate";
import type { MusicTrack } from "@/types/music";

export const SEARCH_DEBOUNCE_MS = 350;

export type SearchState =
  | { status: "idle" }
  | { status: "loading"; query: string }
  | { status: "success"; query: string; tracks: readonly MusicTrack[] }
  | { status: "empty"; query: string }
  | { status: "error"; query: string; code: SearchErrorCode };

const IDLE: SearchState = { status: "idle" };

/** Trimmed query, or null when it is too short to search. */
function normalizeQuery(input: string): string | null {
  const query = input.trim();
  return query.length >= SEARCH_QUERY_MIN_LENGTH ? query : null;
}

function clipInput(input: string): string {
  return input.slice(0, SEARCH_QUERY_MAX_LENGTH);
}

interface SettledSearch {
  query: string;
  /** Which attempt it answered, so a retry never shows the previous answer. */
  attempt: number;
  outcome: SearchOutcome;
}

/**
 * Search state for the Search page.
 *
 * The visible state is DERIVED from (activeQuery, attempt, settled), never
 * stored: an answer only counts while it belongs to the current query and
 * attempt. A late response for an older query can therefore never replace
 * the newest one, even before its request is aborted.
 */
export function useSearch(initialQuery: string) {
  const [input, setInputState] = useState(() => clipInput(initialQuery));
  // Last query that passed the debounce (or was submitted). Direct URLs
  // start committed so they search immediately.
  const [committed, setCommitted] = useState<string | null>(() =>
    normalizeQuery(clipInput(initialQuery)),
  );
  const [attempt, setAttempt] = useState(0);
  const [settled, setSettled] = useState<SettledSearch | null>(null);

  const normalized = normalizeQuery(input);

  // Debounce typing. Too-short input needs no timer: activeQuery is null below.
  useEffect(() => {
    if (normalized === null) return;

    const timer = window.setTimeout(
      () => setCommitted(normalized),
      SEARCH_DEBOUNCE_MS,
    );

    return () => window.clearTimeout(timer);
  }, [normalized]);

  const activeQuery = normalized === null ? null : committed;

  // One request per (activeQuery, attempt). The cleanup aborts it as soon as
  // either changes and on unmount.
  useEffect(() => {
    if (activeQuery === null) return;

    const controller = new AbortController();

    searchTracks(activeQuery, controller.signal).then(
      (outcome) => {
        if (controller.signal.aborted) return;
        setSettled({ query: activeQuery, attempt, outcome });
      },
      () => {
        // Only an abort rejects. It is expected and never shown as an error.
      },
    );

    return () => controller.abort();
  }, [activeQuery, attempt]);

  const state = useMemo<SearchState>(() => {
    if (activeQuery === null) return IDLE;

    if (
      settled === null ||
      settled.query !== activeQuery ||
      settled.attempt !== attempt
    ) {
      return { status: "loading", query: activeQuery };
    }

    const { outcome } = settled;

    if (!outcome.ok) {
      return { status: "error", query: activeQuery, code: outcome.code };
    }

    return outcome.tracks.length === 0
      ? { status: "empty", query: activeQuery }
      : { status: "success", query: activeQuery, tracks: outcome.tracks };
  }, [activeQuery, attempt, settled]);

  /** User typing: debounced. */
  const setInput = useCallback((value: string) => {
    setInputState(clipInput(value));
  }, []);

  /** Programmatic change (URL navigation): searches without the debounce. */
  const setQueryNow = useCallback((value: string) => {
    const clipped = clipInput(value);
    setInputState(clipped);
    setCommitted(normalizeQuery(clipped));
  }, []);

  /** Enter key: skips the rest of the debounce. */
  const submit = useCallback(() => {
    setCommitted(normalizeQuery(input));
  }, [input]);

  const clear = useCallback(() => {
    setInputState("");
    setCommitted(null);
  }, []);

  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  return {
    input,
    /** The query currently searched (trimmed), or null when idle. */
    activeQuery,
    state,
    setInput,
    setQueryNow,
    submit,
    clear,
    retry,
  };
}
