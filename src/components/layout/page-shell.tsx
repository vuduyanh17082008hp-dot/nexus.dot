import { cn } from "@/lib/utils/cn";

interface PageShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
  wide?: boolean;
}

export function PageShell({ children, title, description, className, wide }: PageShellProps) {
  return (
    <div className={cn("mx-auto px-4 py-8", wide ? "max-w-[1600px]" : "max-w-7xl", className)}>
      {(title || description) && (
        <header className="mb-8">
          {title && <h1 className="text-3xl font-bold text-white md:text-4xl">{title}</h1>}
          {description && <p className="mt-2 max-w-2xl text-zinc-400">{description}</p>}
        </header>
      )}
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  href,
  linkLabel = "View all",
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      {href && (
        <a href={href} className="text-sm text-cyan-400 hover:text-cyan-300">
          {linkLabel} →
        </a>
      )}
    </div>
  );
}
