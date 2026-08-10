import { Card, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { forgotPassword } from "@/lib/auth/actions";
import { PageShell } from "@/components/layout/page-shell";

export default function ForgotPasswordPage() {
  return (
    <PageShell title="Forgot Password" description="We'll send a reset link to your email.">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <AuthForm
            action={forgotPassword}
            submitLabel="Send Reset Link"
            fields={[{ name: "email", label: "Email", type: "email", autoComplete: "email" }]}
            alternate={{ href: "/auth/login", label: "Back to sign in" }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
