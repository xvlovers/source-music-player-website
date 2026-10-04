"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { AddToPlaylistModal } from "@/components/playlist/AddToPlaylistModal";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useLibraryActions, useLikedTracks } from "@/hooks/useLibrary";
import { useSearch } from "@/hooks/useSearch";
import { useTrackPlayback } from "@/hooks/useTrackPlayback";
import type { SearchErrorCode } from "@/lib/api/search-client";
import { SEARCH_QUERY_MAX_LENGTH } from "@/lib/api/validate";
import { toLibraryTrackSnapshot } from "@/lib/music/snapshot";
import type { LibraryTrackSnapshot } from "@/types/library";
import type { MusicTrack } from "@/types/music";

import { SearchBar } from "./SearchBar";
import { SearchResults } from "./SearchResults";

const NO_TRACKS: readonly MusicTrack[] = [];

const ERROR_COPY: Record<SearchErrorCode, { title: string; message: string }> = {
  PROVIDER_NOT_CONFIGURED: {
    title: "Music provider not configured",
    message:
      "No music provider has been set up yet, so search is unavailable. Configure a provider to enable it.",
  },
  PROVIDER_ERROR: {
    title: "Search failed",
    message: "The music provider could not complete the request. Try again.",
  },
  INVALID_QUERY: {
    title: "Invalid search",
    message: "That search could not be processed. Try a different query.",
  },
  NOT_FOUND: {
    title: "Nothing found",
    message: "The music provider could not find what you asked for.",
  },
  UNKNOWN_INTERNAL_ERROR: {
    title: "Something went wrong",
    message: "The server hit an unexpected problem. Try again.",
  },
  NETWORK_ERROR: {
    title: "Connection problem",
    message: "Could not reach the server. Check your connection and try again.",
  },
  INVALID_RESPONSE: {
    title: "Unexpected response",
    message: "The server sent a response this app could not read. Try again.",
  },
};

/** Retrying cannot help when the provider is simply not configured. */
const RETRYABLE: ReadonlySet<SearchErrorCode> = new Set<SearchErrorCode>([
  "PROVIDER_ERROR",
  "UNKNOWN_INTERNAL_ERROR",
  "NETWORK_ERROR",
  "INVALID_RESPONSE",
]);

export function SearchView() {
  const router = useRouter();
  const pathname = usePathname();
  const urlQuery = useSearchParams().get("q") ?? "";

  const search = useSearch(urlQuery);
  const { setQueryNow } = search;

  // --- URL <-> state sync -------------------------------------------------
  // `known` is the q the URL has or is about to have; `pending` holds q values
  // this page wrote with router.replace and that have not come back yet. A
  // value found in `pending` is our own echo and is ignored, so typing is never
  // overwritten by a slower navigation and URL <-> state cannot loop.
  const known = useRef(urlQuery);
  const pending = useRef<string[]>([]);

  useEffect(() => {
    const echo = pending.current.indexOf(urlQuery);

    if (echo >= 0) {
      pending.current.splice(0, echo + 1);
      return;
    }

    if (urlQuery === known.current) return;

    // External change (back/forward, nav link): the URL wins.
    known.current = urlQuery;
    pending.current = [];
    setQueryNow(urlQuery);
  }, [urlQuery, setQueryNow]);

  const { activeQuery } = search;
  const inputEmpty = search.input.trim() === "";

  useEffect(() => {
    // A too-short query leaves the URL alone; only an emptied input removes q.
    const target = activeQuery ?? (inputEmpty ? "" : null);
    if (target === null || target === known.current) return;

    known.current = target;
    pending.current.push(target);

    const href =
      target === "" ? pathname : `${pathname}?q=${encodeURIComponent(target)}`;
    router.replace(href, { scroll: false });
  }, [activeQuery, inputEmpty, pathname, router]);

  // --- Likes + playback ---------------------------------------------------
  const likedTracks = useLikedTracks();
  const { toggleLiked } = useLibraryActions();
  const likedIds = useMemo(
    () => new Set(likedTracks.map((track) => track.id)),
    [likedTracks],
  );

  const { state } = search;
  const tracks = state.status === "success" ? state.tracks : NO_TRACKS;
  const playback = useTrackPlayback(tracks);

  const [addTarget, setAddTarget] = useState<LibraryTrackSnapshot | null>(null);

  const handleToggleLike = (track: MusicTrack) => {
    // Snapshot drops streamUrl: expiring URLs are never persisted.
    toggleLiked(toLibraryTrackSnapshot(track));
  };

  return (
    <div className="min-w-0">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Search
        </h1>
      </header>

      <SearchBar
        value={search.input}
        onChange={search.setInput}
        onSubmit={search.submit}
        onClear={search.clear}
        loading={state.status === "loading"}
        maxLength={SEARCH_QUERY_MAX_LENGTH}
        autoFocus={urlQuery === ""}
        className="md:max-w-2xl"
      />

      <div className="mt-6 max-w-3xl">
        {state.status === "idle" && (
          <EmptyState
            icon={Search}
            title="Search for music"
            description="Type at least 2 characters to find songs and artists."
          />
        )}

        {state.status === "loading" && (
          <LoadingSkeleton variant="row" count={6} />
        )}

        {state.status === "error" && (
          <ErrorState
            code={state.code}
            title={ERROR_COPY[state.code].title}
            message={ERROR_COPY[state.code].message}
            action={
              RETRYABLE.has(state.code) ? (
                <Button onClick={search.retry}>Try again</Button>
              ) : undefined
            }
          />
        )}

        {state.status === "empty" && (
          <EmptyState
            icon={Search}
            title="No results found"
            description={`Nothing matched "${state.query}". Try another search.`}
          />
        )}

        {state.status === "success" && (
          <>
            <p role="status" className="sr-only">
              {state.tracks.length}{" "}
              {state.tracks.length === 1 ? "result" : "results"} for{" "}
              {state.query}
            </p>
            <SearchResults
              tracks={state.tracks}
              currentTrackId={playback.currentId}
              isPlaying={playback.isPlaying}
              onPlay={playback.play}
              isLiked={(id) => likedIds.has(id)}
              onToggleLike={handleToggleLike}
              onAddToPlaylist={(track) =>
                setAddTarget(toLibraryTrackSnapshot(track))
              }
            />
          </>
        )}
      </div>

      <AddToPlaylistModal
        track={addTarget}
        onClose={() => setAddTarget(null)}
      />
    </div>
  );
}
