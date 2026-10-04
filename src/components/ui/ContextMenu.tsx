"use client";

import { Ellipsis, type LucideIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils/cn";

import { IconButton, type IconButtonSize } from "./IconButton";

export interface ContextMenuItem {
  key: string;
  label: string;
  icon?: LucideIcon;
  tone?: "default" | "danger";
  /** Called after the menu closes. The menu itself holds no business logic. */
  onSelect?: () => void;
  /** Renders the item as an external link (opens in a new tab). */
  href?: string;
}

interface ContextMenuProps {
  items: readonly ContextMenuItem[];
  /** Accessible name of the trigger button and of the menu. */
  label?: string;
  align?: "start" | "end";
  size?: IconButtonSize;
  className?: string;
}

interface Position {
  top: number;
  left: number;
}

const VIEWPORT_MARGIN = 8;
const TRIGGER_GAP = 4;

const ITEM_CLASS =
  "flex h-11 w-full items-center gap-3 px-3 text-left text-sm focus-visible:bg-border focus-visible:outline-none hover:bg-border";

/**
 * Dropdown menu opened from a "more" button. Rendered in a portal with fixed
 * positioning so scroll containers never clip it; it flips above the button
 * when there is no room below and stays inside the viewport.
 * Listeners exist only while the menu is open.
 */
export function ContextMenu({
  items,
  label = "More options",
  align = "end",
  size = "md",
  className,
}: ContextMenuProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = useCallback((restoreFocus: boolean) => {
    setOpen(false);
    setPosition(null);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  // Measure after the first render, place the menu, then focus its first item.
  useLayoutEffect(() => {
    if (!open) return;

    const trigger = triggerRef.current;
    const menu = menuRef.current;
    if (!trigger || !menu) return;

    const anchor = trigger.getBoundingClientRect();
    const box = menu.getBoundingClientRect();

    const maxLeft = Math.max(
      VIEWPORT_MARGIN,
      window.innerWidth - box.width - VIEWPORT_MARGIN,
    );
    const wantedLeft = align === "end" ? anchor.right - box.width : anchor.left;
    const left = Math.min(Math.max(wantedLeft, VIEWPORT_MARGIN), maxLeft);

    let top = anchor.bottom + TRIGGER_GAP;
    if (top + box.height > window.innerHeight - VIEWPORT_MARGIN) {
      top = Math.max(VIEWPORT_MARGIN, anchor.top - box.height - TRIGGER_GAP);
    }

    setPosition({ top, left });
    menu
      .querySelector<HTMLElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;

      // Capture phase + stopPropagation: an enclosing Modal must not also close.
      event.stopPropagation();
      event.preventDefault();
      close(true);
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;

      close(false);
    }

    function handleDismiss() {
      close(false);
    }

    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("resize", handleDismiss);
    window.addEventListener("scroll", handleDismiss, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("resize", handleDismiss);
      window.removeEventListener("scroll", handleDismiss, true);
    };
  }, [open, close]);

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Tab") {
      // Hand focus back to the trigger so Tab continues from there.
      close(true);
      return;
    }

    const elements = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (elements.length === 0) return;

    const current = elements.findIndex((el) => el === document.activeElement);
    let next: number;

    if (event.key === "ArrowDown") next = (current + 1) % elements.length;
    else if (event.key === "ArrowUp") {
      next = (current - 1 + elements.length) % elements.length;
    } else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = elements.length - 1;
    else return;

    event.preventDefault();
    elements[next]?.focus();
  }

  function handleSelect(item: ContextMenuItem) {
    if (item.href !== undefined) {
      // Closing in the same tick would remove the link before the browser follows it.
      window.setTimeout(() => close(true), 0);
    } else {
      close(true);
    }

    item.onSelect?.();
  }

  if (items.length === 0) return null;

  return (
    <>
      <IconButton
        ref={triggerRef}
        icon={Ellipsis}
        label={label}
        size={size}
        className={className}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => (open ? close(true) : setOpen(true))}
      />

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={label}
            onKeyDown={handleMenuKeyDown}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              opacity: position === null ? 0 : 1,
            }}
            className="fixed z-[60] min-w-48 max-w-[calc(100vw-1rem)] overflow-hidden rounded-lg border border-border bg-surface-elevated py-1 shadow-md"
          >
            {items.map((item) => {
              const Icon = item.icon;
              const classes = cn(
                ITEM_CLASS,
                item.tone === "danger" ? "text-danger" : "text-foreground",
              );
              const content = (
                <>
                  {Icon && (
                    <Icon aria-hidden="true" className="size-4 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                </>
              );

              return item.href !== undefined ? (
                <a
                  key={item.key}
                  role="menuitem"
                  tabIndex={-1}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={classes}
                  onClick={() => handleSelect(item)}
                >
                  {content}
                </a>
              ) : (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  className={classes}
                  onClick={() => handleSelect(item)}
                >
                  {content}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
