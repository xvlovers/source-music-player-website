"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isActivePath } from "./nav-items";

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pr-[env(safe-area-inset-right,0px)] pb-[env(safe-area-inset-bottom,0px)] pl-[env(safe-area-inset-left,0px)] md:hidden"
    >
      <ul className="flex h-[var(--bottom-nav-height)] items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors active:bg-surface-elevated ${
                  active ? "text-foreground" : "text-secondary"
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`size-5 ${active ? "text-accent" : ""}`}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
