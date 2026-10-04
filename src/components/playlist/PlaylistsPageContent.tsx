"use client";

import { LibraryErrorBoundary } from "@/components/library/LibraryErrorBoundary";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { useIsClient } from "@/hooks/useIsClient";

import { PlaylistsManager } from "./PlaylistsManager";

export function PlaylistsPageContent() {
  // Playlists live in the browser: show a skeleton until hydration is done.
  const ready = useIsClient();

  return (
    <div className="min-w-0">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Playlists
        </h1>
        <p className="mt-1 text-sm text-secondary">Your playlists.</p>
      </header>

      {ready ? (
        <LibraryErrorBoundary>
          <PlaylistsManager showHeading={false} />
        </LibraryErrorBoundary>
      ) : (
        <LoadingSkeleton variant="row" count={4} />
      )}
    </div>
  );
}
