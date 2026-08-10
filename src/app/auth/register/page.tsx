import { Card, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { register } from "@/lib/auth/actions";
import { PageShell } from "@/components/layout/page-shell";

export default function RegisterPage() {
  return (
    <PageShell title="Create Account" description="Join NEXUS and start earning XP.">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <AuthForm
            action={register}
            submitLabel="Create Account"
            fields={[
              { name: "username", label: "Username", autoComplete: "username" },
              { name: "email", label: "Email", type: "email", autoComplete: "email" },
              { name: "password", label: "Password", type: "password", autoComplete: "new-password" },
            ]}
            alternate={{ href: "/auth/login", label: "Already have an account? Sign in" }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
