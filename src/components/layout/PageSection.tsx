import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface PageSectionProps {
  id: string;
  title: string;
  /** Optional "See all" destination. Rendered only when provided. */
  href?: string;
  hrefLabel?: string;
  /** Optional control shown at the end of the heading row (e.g. a button). */
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Titled block used by page sections (Home, Library, Playlists). Presentational only. */
export function PageSection({
  id,
  title,
  href,
  hrefLabel = "See all",
  action,
  children,
  className,
}: PageSectionProps) {
  const headingId = `section-${id}`;

  return (
    <section aria-labelledby={headingId} className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          id={headingId}
          className="text-lg font-semibold tracking-tight md:text-xl"
        >
          {title}
        </h2>
        {href && (
          <Link
            href={href}
            className="shrink-0 rounded-md text-sm text-secondary transition-colors hover:text-foreground"
          >
            {hrefLabel}
            <span className="sr-only"> {title}</span>
          </Link>
        )}
        {action}
      </div>
      {children}
    </section>
  );
}
