import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/lib/auth/actions";
import { PageShell } from "@/components/layout/page-shell";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next, error } = await searchParams;

  return (
    <PageShell title="Sign In" description="Access your dashboard, library, and synced progress.">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          {error && (
            <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {decodeURIComponent(error)}
            </p>
          )}
          <AuthForm
            action={login}
            submitLabel="Sign In"
            next={next ?? "/dashboard"}
            fields={[
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
            ]}
            alternate={{ href: "/auth/register", label: "Create an account" }}
          />
          <p className="mt-4 text-center text-sm">
            <Link href="/auth/forgot-password" className="text-cyan-400 hover:text-cyan-300">
              Forgot password?
            </Link>
          </p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
