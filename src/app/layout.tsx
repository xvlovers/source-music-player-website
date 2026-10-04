import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { FullPlayer } from "@/components/player/FullPlayer";
import { MiniPlayer } from "@/components/player/MiniPlayer";
import { PlayerBootstrap } from "@/components/player/PlayerBootstrap";

import "./globals.css";

export const metadata: Metadata = {
  title: "Music",
  description: "A simple modern music player.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0e0e0f",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AppShell
          player={
            <>
              <MiniPlayer />
              <FullPlayer />
            </>
          }
        >
          {children}
        </AppShell>
        <PlayerBootstrap />
      </body>
    </html>
  );
}
