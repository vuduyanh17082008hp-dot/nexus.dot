import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="text-6xl font-bold nexus-gradient-text">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">Page not found</h1>
      <p className="mt-2 max-w-md text-zinc-400">
        This route doesn&apos;t exist in the NEXUS grid. Head back and keep playing.
      </p>
      <div className="mt-6 flex gap-3">
        <Button href="/">Home</Button>
        <Button href="/games" variant="secondary">
          Browse Games
        </Button>
      </div>
      <Link href="/play/neon-survivor" className="mt-4 text-sm text-cyan-400 hover:text-cyan-300">
        Or jump straight into Neon Survivor →
      </Link>
    </div>
  );
}
