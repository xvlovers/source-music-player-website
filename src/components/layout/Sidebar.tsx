"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { NAV_ITEMS, isActivePath } from "./nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-width)] flex-col overflow-y-auto border-r border-border bg-surface py-6 pr-3 pl-[max(0.75rem,env(safe-area-inset-left,0px))] md:flex">
      <Link
        href="/"
        className="mb-8 rounded-md px-3 text-lg font-semibold tracking-tight transition-colors hover:text-accent"
      >
        Music
      </Link>

      <nav aria-label="Primary navigation">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = isActivePath(pathname, href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-surface-elevated text-foreground"
                      : "text-secondary hover:bg-surface-elevated/60 hover:text-foreground active:bg-surface-elevated"
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
    </aside>
  );
}
