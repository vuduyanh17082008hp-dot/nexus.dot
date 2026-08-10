"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPassword, type AuthActionState } from "@/lib/auth/actions";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const initialState: AuthActionState = {};

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(forgotPassword, initialState);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.append("email", data.email);
    formAction(fd);
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Reset Password</CardTitle>
        <CardDescription>We&apos;ll send you a link to reset your password.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              error={!!errors.email}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-danger">{errors.email.message}</p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-danger" role="alert">{state.error}</p>
          )}
          {state.success && (
            <p className="text-sm text-success" role="status">{state.success}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Spinner size="sm" /> : "Send Reset Link"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Remember your password?{" "}
          <Link href="/auth/login" className="text-secondary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
