import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/layout/container";

interface PageHeroProps {
  title: string;
  description?: string;
  eyebrow?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHero({ title, description, eyebrow, children, className }: PageHeroProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden border-b border-border bg-grid-fade bg-radial-glow noise-overlay",
        className,
      )}
    >
      <Container className="relative z-10 py-12 md:py-16">
        {eyebrow && (
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-secondary">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-3xl font-bold tracking-wide text-foreground md:text-4xl lg:text-5xl text-glow-primary">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">{description}</p>
        )}
        {children && <div className="mt-8">{children}</div>}
      </Container>
    </section>
  );
}
