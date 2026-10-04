import { House, Library, ListMusic, Search, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/playlists", label: "Playlists", icon: ListMusic },
];

export function isActivePath(pathname: string | null, href: string): boolean {
  if (pathname === null) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
