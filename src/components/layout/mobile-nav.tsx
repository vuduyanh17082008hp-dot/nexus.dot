"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Gamepad2, Search, Library, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/search", label: "Search", icon: Search, isSearch: true },
  { href: "/library", label: "Library", icon: Library },
  { href: "/profile", label: "Profile", icon: User },
];

interface MobileNavProps {
  onSearchOpen?: () => void;
}

export function MobileNav({ onSearchOpen }: MobileNavProps) {
  const pathname = usePathname();

  if (pathname.startsWith("/play/")) return null;

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden glass-strong border-t border-border safe-area-bottom"
    >
      <ul className="flex items-center justify-around h-16 px-2">
        {navItems.map(({ href, label, icon: Icon, isSearch }) => {
          const active = !isSearch && (pathname === href || (href !== "/" && pathname.startsWith(href)));

          if (isSearch) {
            return (
              <li key={href}>
                <button
                  type="button"
                  onClick={onSearchOpen}
                  className="flex flex-col items-center gap-0.5 px-3 py-1 text-muted transition-colors hover:text-secondary"
                  aria-label="Open search"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{label}</span>
                </button>
              </li>
            );
          }

          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors",
                  active ? "text-primary" : "text-muted hover:text-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
