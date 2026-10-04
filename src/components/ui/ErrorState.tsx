import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface ErrorStateProps {
  title: string;
  message: string;
  action?: ReactNode;
  /**
   * Optional machine-readable code. It is not shown to the user; it is only
   * exposed as a data attribute for debugging and tests.
   */
  code?: string;
  className?: string;
}

/** Presentational only: the parent decides the text for each error code. */
export function ErrorState({
  title,
  message,
  action,
  code,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      data-error-code={code}
      className={cn(
        "flex flex-col items-center px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-danger/15 text-danger">
        <TriangleAlert aria-hidden="true" className="size-6" />
      </span>
      <p className="text-base font-medium text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-secondary">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
