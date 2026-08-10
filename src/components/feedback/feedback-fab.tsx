"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquarePlus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function FeedbackFab() {
  const pathname = usePathname();

  if (pathname.startsWith("/feedback") || pathname.startsWith("/play/")) {
    return null;
  }

  const href = pathname.startsWith("/play/")
    ? `/feedback?route=${encodeURIComponent(pathname)}`
    : "/feedback";

  return (
    <Link
      href={href}
      className={cn(
        "fixed bottom-20 right-4 z-40 md:bottom-6",
        "flex h-12 w-12 items-center justify-center rounded-full",
        "border border-violet-500/40 bg-violet-600/90 text-white shadow-lg shadow-violet-500/25",
        "transition hover:bg-violet-500 hover:scale-105",
      )}
      aria-label="Send feedback"
    >
      <MessageSquarePlus className="h-5 w-5" />
    </Link>
  );
}
