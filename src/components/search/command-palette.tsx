"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Gamepad2, Search, Tag, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { GAME_CATALOG, CATEGORIES, searchGames } from "@/lib/game/catalog";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";

const RECENT_KEY = "nexus-recent-searches";
const MAX_RECENT = 8;

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const trimmed = query.trim();
  if (!trimmed) return;
  const prev = loadRecent().filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
  const next = [trimmed, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

type ResultItem =
  | { type: "game"; id: string; label: string; sublabel: string; href: string }
  | { type: "category"; id: string; label: string; sublabel: string; href: string }
  | { type: "recent"; id: string; label: string; sublabel: string; href: string };

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebounce(query, 200);

  useEffect(() => {
    if (open) {
      setRecent(loadRecent());
      setQuery("");
      setActiveIndex(0);
      window.setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const results = useMemo((): ResultItem[] => {
    const q = debouncedQuery.trim().toLowerCase();

    if (!q) {
      const recentItems: ResultItem[] = recent.map((r) => ({
        type: "recent",
        id: `recent-${r}`,
        label: r,
        sublabel: "Recent search",
        href: `/search?q=${encodeURIComponent(r)}`,
      }));

      const popularGames: ResultItem[] = GAME_CATALOG.filter((g) => g.is_featured).map((g) => ({
        type: "game",
        id: g.id,
        label: g.title,
        sublabel: g.genre,
        href: `/games/${g.slug}`,
      }));

      const cats: ResultItem[] = CATEGORIES.slice(0, 4).map((c) => ({
        type: "category",
        id: c.slug,
        label: c.title,
        sublabel: c.description,
        href: `/games?genre=${c.slug}`,
      }));

      return [...recentItems, ...popularGames, ...cats];
    }

    const games = searchGames(q).map((g) => ({
      type: "game" as const,
      id: g.id,
      label: g.title,
      sublabel: g.genre,
      href: `/games/${g.slug}`,
    }));

    const cats = CATEGORIES.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.slug.includes(q),
    ).map((c) => ({
      type: "category" as const,
      id: c.slug,
      label: c.title,
      sublabel: c.description,
      href: `/games?genre=${c.slug}`,
    }));

    return [...games, ...cats];
  }, [debouncedQuery, recent]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results.length, debouncedQuery]);

  const navigate = useCallback(
    (item: ResultItem) => {
      if (item.type === "recent" || debouncedQuery.trim()) {
        saveRecent(item.type === "recent" ? item.label : debouncedQuery.trim() || item.label);
      }
      onClose();
      router.push(item.href);
    },
    [debouncedQuery, onClose, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIndex]) {
      e.preventDefault();
      navigate(results[activeIndex]);
    }
  };

  const iconFor = (type: ResultItem["type"]) => {
    switch (type) {
      case "game":
        return Gamepad2;
      case "category":
        return Tag;
      case "recent":
        return Clock;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18 }}
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative z-10 w-full max-w-xl glass-strong rounded-xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center gap-3 border-b border-border px-4">
              <Search className="h-5 w-5 text-muted shrink-0" aria-hidden="true" />
              <Input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search games, genres..."
                className="border-0 bg-transparent focus:ring-0 h-14 text-base"
                aria-label="Search query"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-muted hover:text-foreground hover:bg-surface-raised"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="max-h-80 overflow-y-auto py-2" role="listbox">
              {results.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-muted">No results found.</li>
              ) : (
                results.map((item, index) => {
                  const Icon = iconFor(item.type);
                  const active = index === activeIndex;
                  return (
                    <li key={item.id} role="option" aria-selected={active}>
                      <button
                        type="button"
                        onClick={() => navigate(item)}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                          active ? "bg-primary/15 text-foreground" : "text-muted hover:bg-surface-raised",
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-secondary" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.label}</p>
                          <p className="text-xs truncate capitalize">{item.sublabel}</p>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          {item.type}
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[10px] text-muted-foreground">
              <span>
                <kbd className="rounded bg-surface-raised px-1.5 py-0.5 border border-border">↑↓</kbd> navigate
              </span>
              <span>
                <kbd className="rounded bg-surface-raised px-1.5 py-0.5 border border-border">↵</kbd> select
              </span>
              <span>
                <kbd className="rounded bg-surface-raised px-1.5 py-0.5 border border-border">esc</kbd> close
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function useSearchCommand() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return {
    open,
    openSearch: () => setOpen(true),
    closeSearch: () => setOpen(false),
    toggleSearch: () => setOpen((v) => !v),
  };
}
