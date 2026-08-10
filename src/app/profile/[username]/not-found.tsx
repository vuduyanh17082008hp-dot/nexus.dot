import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProfileNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-white">Player not found</h1>
      <p className="mt-2 text-zinc-400">No profile exists for this username.</p>
      <div className="mt-6 flex gap-3">
        <Button href="/leaderboard">Leaderboard</Button>
        <Button href="/" variant="secondary">
          Home
        </Button>
      </div>
      <Link href="/profile/neon_ace" className="mt-4 text-sm text-cyan-400 hover:text-cyan-300">
        View demo profile: neon_ace →
      </Link>
    </div>
  );
}
