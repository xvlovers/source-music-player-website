import { cn } from "@/lib/utils/cn";

export type LoadingSkeletonVariant = "row" | "card" | "player";

interface LoadingSkeletonProps {
  variant?: LoadingSkeletonVariant;
  /** How many rows or cards to render (1 to 50). */
  count?: number;
  className?: string;
}

const BLOCK = "bg-surface-elevated";
const PULSE = "animate-pulse motion-reduce:animate-none";

/** Same dimensions as TrackRow, so loading does not shift the layout. */
function RowSkeleton() {
  return (
    <div className={cn("flex items-center gap-3 px-2 py-1.5", PULSE)}>
      <div className={cn("size-11 shrink-0 rounded-md", BLOCK)} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className={cn("h-3.5 w-2/5 rounded", BLOCK)} />
        <div className={cn("h-3 w-1/4 rounded", BLOCK)} />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className={cn("w-full min-w-0", PULSE)}>
      <div className={cn("aspect-square w-full rounded-md", BLOCK)} />
      <div className="mt-2 space-y-2">
        <div className={cn("h-3.5 w-3/4 rounded", BLOCK)} />
        <div className={cn("h-3 w-1/2 rounded", BLOCK)} />
      </div>
    </div>
  );
}

function PlayerSkeleton() {
  return (
    <div className={cn("mx-auto flex w-full max-w-sm flex-col", PULSE)}>
      <div className={cn("aspect-square w-full rounded-lg", BLOCK)} />
      <div className="mt-6 space-y-2">
        <div className={cn("h-5 w-3/5 rounded", BLOCK)} />
        <div className={cn("h-4 w-2/5 rounded", BLOCK)} />
      </div>
      <div className={cn("mt-6 h-1 w-full rounded-full", BLOCK)} />
      <div className="mt-6 flex items-center justify-center gap-4">
        <div className={cn("size-10 rounded-full", BLOCK)} />
        <div className={cn("size-14 rounded-full", BLOCK)} />
        <div className={cn("size-10 rounded-full", BLOCK)} />
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  variant = "row",
  count = 1,
  className,
}: LoadingSkeletonProps) {
  const total = Math.min(50, Math.max(1, Math.floor(count)));
  const items = Array.from({ length: variant === "player" ? 1 : total }, (_, i) => i);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        variant === "row" && "flex flex-col gap-1",
        variant === "card" &&
          "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
        className,
      )}
    >
      <span className="sr-only">Loading</span>
      {items.map((item) =>
        variant === "row" ? (
          <RowSkeleton key={item} />
        ) : variant === "card" ? (
          <CardSkeleton key={item} />
        ) : (
          <PlayerSkeleton key={item} />
        ),
      )}
    </div>
  );
}
