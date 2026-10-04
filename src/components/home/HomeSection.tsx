import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface HomeSectionProps {
  id: string;
  title: string;
  /** Optional "See all" destination. Rendered only when provided. */
  href?: string;
  hrefLabel?: string;
  children: ReactNode;
  className?: string;
}

/** Titled block used by every Home section. Presentational only. */
export function HomeSection({
  id,
  title,
  href,
  hrefLabel = "See all",
  children,
  className,
}: HomeSectionProps) {
  const headingId = `home-${id}`;

  return (
    <section aria-labelledby={headingId} className={cn("min-w-0", className)}>
      <div className="mb-3 flex items-baseline justify-between gap-3">
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
      </div>
      {children}
    </section>
  );
}
