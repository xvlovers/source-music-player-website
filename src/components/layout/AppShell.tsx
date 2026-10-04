import type { ReactNode } from "react";

import { BottomNavigation } from "./BottomNavigation";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
  player: ReactNode;
}

export function AppShell({ children, player }: AppShellProps) {
  return (
    <div className="app-shell">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-surface-elevated focus:px-3 focus:py-2 focus:text-sm"
      >
        Skip to content
      </a>

      <Sidebar />

      <main
        id="main"
        tabIndex={-1}
        className="min-h-dvh min-w-0 focus:outline-none md:ml-[var(--sidebar-width)]"
      >
        <div className="shell-content safe-x mx-auto w-full max-w-6xl pt-6 md:pt-10">
          {children}
        </div>
      </main>

      <BottomNavigation />
      {player}
    </div>
  );
}
