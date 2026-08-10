import Link from "next/link";
import { Container } from "@/components/layout/container";

const footerLinks = [
  { href: "/games", label: "Games" },
  { href: "/trending", label: "Trending" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface/50">
      <Container className="py-10 md:py-12">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-3">
            <Link href="/" className="font-display text-xl font-bold tracking-widest text-foreground">
              NEX<span className="text-primary">US</span>
            </Link>
            <p className="max-w-xs text-sm text-muted">
              Play instantly. Compete. Ascend. Premium browser gaming built for the next generation.
            </p>
          </div>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-secondary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} NEXUS. All rights reserved.</p>
          <p>Built for gamers, by gamers.</p>
        </div>
      </Container>
    </footer>
  );
}
