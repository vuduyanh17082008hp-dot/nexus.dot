"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Search,
  Bell,
  Gamepad2,
  TrendingUp,
  Trophy,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useUser } from "@/hooks/use-user";

const navLinks = [
  { href: "/", label: "Discover", icon: Compass },
  { href: "/games", label: "Games", icon: Gamepad2 },
  { href: "/trending", label: "Trending", icon: TrendingUp },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
];

interface SiteHeaderProps {
  onSearchOpen?: () => void;
}

export function SiteHeader({ onSearchOpen }: SiteHeaderProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, profile, loading } = useUser();

  const isPlayRoute = pathname.startsWith("/play/");
  if (isPlayRoute) return null;

  const profileHref = user ? "/dashboard" : "/auth/login";

  return (
    <header className="sticky top-0 z-50 glass-strong border-b border-border">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          <Link
            href="/"
            className="font-display text-xl font-bold tracking-[0.15em] text-foreground shrink-0"
            aria-label="NEXUS home"
          >
            NEX<span className="text-primary">US</span>
          </Link>

          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-muted hover:text-foreground hover:bg-surface-raised",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchOpen}
              aria-label="Open search (Ctrl+K)"
              className="hidden sm:inline-flex"
            >
              <Search className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifications"
              href="/notifications"
              className="hidden sm:inline-flex relative"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
            </Button>

            <Link href={profileHref} className="hidden sm:block" aria-label={user ? "Go to profile" : "Sign in"}>
              {!loading && (
                <Avatar
                  src={profile?.avatar_url}
                  alt={profile?.display_name ?? profile?.username ?? "Profile"}
                  fallback={profile?.username?.slice(0, 2)}
                  size="sm"
                />
              )}
            </Link>

            <Button href="/games" size="sm" className="hidden lg:inline-flex">
              Play Now
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setDrawerOpen(!drawerOpen)}
              aria-label={drawerOpen ? "Close menu" : "Open menu"}
              aria-expanded={drawerOpen}
            >
              {drawerOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </Container>

      {drawerOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <Container className="py-4 space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    active ? "bg-primary/15 text-primary" : "text-muted hover:bg-surface-raised",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDrawerOpen(false);
                  onSearchOpen?.();
                }}
                className="w-full justify-start gap-2"
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button href="/games" className="w-full">
                Play Now
              </Button>
            </div>
          </Container>
        </div>
      )}
    </header>
  );
}
