import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";

export default function UnauthorizedPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-md py-16 text-center">
        <ShieldOff className="mx-auto h-16 w-16 text-red-400/60" />
        <h1 className="mt-6 text-2xl font-bold text-white">Unauthorized</h1>
        <p className="mt-2 text-zinc-400">
          You don&apos;t have permission to access this page. Sign in or contact an admin.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button href="/auth/login">Sign In</Button>
          <Button href="/" variant="secondary">
            Home
          </Button>
        </div>
        <Link href="/games" className="mt-4 inline-block text-sm text-cyan-400 hover:text-cyan-300">
          Browse games without signing in →
        </Link>
      </div>
    </PageShell>
  );
}
