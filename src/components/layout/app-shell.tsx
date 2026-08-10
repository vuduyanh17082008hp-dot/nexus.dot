"use client";

import { type ReactNode } from "react";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { CommandPalette, useSearchCommand } from "@/components/search/command-palette";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { open, openSearch, closeSearch } = useSearchCommand();

  return (
    <>
      <SiteHeader onSearchOpen={openSearch} />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <SiteFooter />
      <MobileNav onSearchOpen={openSearch} />
      <CommandPalette open={open} onClose={closeSearch} />
    </>
  );
}
