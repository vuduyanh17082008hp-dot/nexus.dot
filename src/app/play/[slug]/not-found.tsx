import { Button } from "@/components/ui/button";

export default function GameNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-white">Game not found</h1>
      <p className="mt-2 text-zinc-400">This game doesn&apos;t exist in the NEXUS catalog.</p>
      <div className="mt-6 flex gap-3">
        <Button href="/games">Browse Games</Button>
        <Button href="/play/neon-survivor" variant="secondary">
          Play Neon Survivor
        </Button>
      </div>
    </div>
  );
}
