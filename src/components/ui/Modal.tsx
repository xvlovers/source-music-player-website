"use client";

import { X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { useIsClient } from "@/hooks/useIsClient";
import { cn } from "@/lib/utils/cn";

import { IconButton } from "./IconButton";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** Accessible name of the dialog, also shown as its heading. */
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Whether clicking the dimmed area closes the dialog. Default true. */
  closeOnBackdrop?: boolean;
  /** "full" fills the viewport on mobile and is a taller centered dialog on desktop. */
  size?: "default" | "full";
  className?: string;
}

const PANEL_CLASSES: Record<"default" | "full", string> = {
  default:
    "max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-2xl border border-border bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] focus:outline-none md:rounded-2xl md:pb-5",
  full: "h-dvh w-full max-w-none overflow-y-auto bg-surface px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] focus:outline-none md:h-auto md:max-h-[92dvh] md:max-w-md md:rounded-2xl md:border md:border-border md:py-5",
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let lockCount = 0;
let restoreBody: (() => void) | null = null;

/**
 * Reference-counted body scroll lock: nested modals and Strict Mode's
 * mount/unmount/mount cycle always end with the original styles restored.
 */
function lockBodyScroll(): () => void {
  if (lockCount === 0) {
    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;

    restoreBody = () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
    };
  }

  lockCount += 1;
  let released = false;

  return () => {
    if (released) return;
    released = true;
    lockCount -= 1;

    if (lockCount === 0) {
      restoreBody?.();
      restoreBody = null;
    }
  };
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  closeOnBackdrop = true,
  size = "default",
  className,
}: ModalProps) {
  const isClient = useIsClient();
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open || !isClient) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const unlock = lockBodyScroll();

    // Focus an element marked data-autofocus, otherwise the dialog itself.
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>("[data-autofocus]") ?? panel)?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !event.defaultPrevented) {
        onCloseRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      unlock();
      if (previouslyFocused?.isConnected) previouslyFocused.focus();
    };
  }, [open, isClient]);

  function handlePanelKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;

    const panel = panelRef.current;
    if (!panel) return;

    const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first === undefined || last === undefined) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === panel)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function handleBackdropClick(event: ReactMouseEvent<HTMLDivElement>) {
    if (closeOnBackdrop && event.target === event.currentTarget) onClose();
  }

  if (!open || !isClient) return null;

  return createPortal(
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 md:items-center md:p-4"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        onKeyDown={handlePanelKeyDown}
        className={cn(PANEL_CLASSES[size], className)}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-secondary">
                {description}
              </p>
            )}
          </div>
          <IconButton
            icon={X}
            label="Close dialog"
            size="sm"
            className="-mr-2 -mt-1"
            onClick={onClose}
          />
        </div>

        {children !== undefined && <div className="mt-4">{children}</div>}
        {footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
