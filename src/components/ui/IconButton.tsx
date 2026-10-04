import type { LucideIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils/cn";

export type IconButtonSize = "sm" | "md" | "lg";
export type IconButtonVariant = "ghost" | "solid";

interface IconButtonProps
  extends Omit<ComponentProps<"button">, "children" | "aria-label"> {
  icon: LucideIcon;
  /** Required accessible name: icon-only buttons have no visible text. */
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  /** For toggles (shuffle, repeat): sets aria-pressed and the accent color. */
  pressed?: boolean;
  /** Accent color only, without aria-pressed (for buttons whose label changes). */
  accent?: boolean;
  /** Fills the icon, e.g. a liked heart or a play triangle. */
  filled?: boolean;
}

const BUTTON_SIZES: Record<IconButtonSize, string> = {
  sm: "size-9",
  md: "size-11",
  lg: "size-14",
};

const ICON_SIZES: Record<IconButtonSize, string> = {
  sm: "size-4",
  md: "size-5",
  lg: "size-6",
};

export function IconButton({
  icon: Icon,
  label,
  size = "md",
  variant = "ghost",
  pressed,
  accent = false,
  filled = false,
  type = "button",
  className,
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors disabled:pointer-events-none disabled:opacity-40",
        BUTTON_SIZES[size],
        variant === "solid"
          ? "bg-foreground text-background hover:bg-foreground/90"
          : pressed || accent
            ? "text-accent hover:bg-surface-elevated"
            : "text-secondary hover:bg-surface-elevated hover:text-foreground",
        className,
      )}
      {...rest}
    >
      <Icon
        aria-hidden="true"
        className={ICON_SIZES[size]}
        fill={filled ? "currentColor" : "none"}
      />
    </button>
  );
}
