import { Card, CardContent } from "@/components/ui/card";
import { AuthForm } from "@/components/auth/auth-form";
import { resetPassword } from "@/lib/auth/actions";
import { PageShell } from "@/components/layout/page-shell";

export default function ResetPasswordPage() {
  return (
    <PageShell title="Reset Password" description="Choose a new password for your account.">
      <Card className="mx-auto max-w-md">
        <CardContent className="pt-6">
          <AuthForm
            action={resetPassword}
            submitLabel="Update Password"
            fields={[
              { name: "password", label: "New Password", type: "password", autoComplete: "new-password" },
            ]}
            alternate={{ href: "/auth/login", label: "Back to sign in" }}
          />
        </CardContent>
      </Card>
    </PageShell>
  );
}
