import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-surface-elevated text-muted">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      )}
      <p className="text-base font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-secondary">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
