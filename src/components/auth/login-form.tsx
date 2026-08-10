"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { login, type AuthActionState } from "@/lib/auth/actions";
import { loginSchema, type LoginInput } from "@/lib/validation/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const initialState: AuthActionState = {};

interface LoginFormProps {
  next?: string;
}

export function LoginForm({ next = "/dashboard" }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(login, initialState);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit((data) => {
    const fd = new FormData();
    fd.append("email", data.email);
    fd.append("password", data.password);
    fd.append("next", next);
    formAction(fd);
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>Enter the NEXUS. Your games await.</CardDescription>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-xs text-secondary hover:underline">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={!!errors.password}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-xs text-danger">{errors.password.message}</p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-danger" role="alert">{state.error}</p>
          )}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? <Spinner size="sm" /> : "Sign In"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          No account?{" "}
          <Link href="/auth/register" className="text-secondary hover:underline font-medium">
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
