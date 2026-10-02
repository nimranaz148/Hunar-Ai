"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService, ApiError } from "@/lib/api";
import { loginSchema } from "@/lib/schemas/auth";
import { FormField, Input } from "@/components/ui/FormField";
import { ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setServerError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);
    setIsLocked(false);

    // 1. Zod Validation
    const validation = loginSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // 2. Submit to Login API
    setIsLoading(true);
    try {
      const response = await AuthService.loginApiV1AuthLoginPost({
        requestBody: {
          email: formData.email.trim(),
          password: formData.password,
        },
      });

      // Role-based routing per PRD §14.2
      const role = response.user.role;
      if (response.user.force_password_change) {
        router.push("/change-password");
      } else if (role === "super_admin") {
        router.push("/admin");
      } else if (role === "mentor") {
        router.push("/mentor");
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 423 || (err.body && String(err.body).includes("locked"))) {
          setIsLocked(true);
          setServerError(
            "Account locked due to 5 consecutive failed attempts. Please wait 15 minutes."
          );
        } else if (err.status === 401) {
          setServerError("Invalid email or password.");
        } else if (err.body && typeof err.body === "object" && "detail" in err.body) {
          setServerError(String((err.body as { detail: string }).detail));
        } else {
          setServerError("Unable to sign in. Please verify your credentials.");
        }
      } else {
        setServerError("Connection error. Please check if the server is running.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-8">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] font-bold text-xl mb-3 shadow-[var(--shadow-sm)]">
          H
        </div>
        <h1 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
          Welcome back
        </h1>
        <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
          Sign in to access your business plan, content & mentoring
        </p>
      </div>

      {justRegistered && (
        <div className="mb-5 p-3 rounded-[var(--radius-sm)] bg-[var(--color-success-subtle)] border border-[var(--color-success-border)] text-[var(--text-xs)] text-[var(--color-success)] flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Account created successfully! Please sign in.
        </div>
      )}

      {serverError && (
        <div
          role="alert"
          className="mb-5 p-3 rounded-[var(--radius-sm)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] text-[var(--text-xs)] text-[var(--color-danger)] font-medium flex items-center gap-2"
        >
          {isLocked && <Lock className="w-4 h-4 flex-shrink-0" />}
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <FormField label="Email Address" name="email" required error={errors.email}>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            hasError={!!errors.email}
            disabled={isLoading}
          />
        </FormField>

        <FormField label="Password" name="password" required error={errors.password}>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={formData.password}
            onChange={handleChange}
            hasError={!!errors.password}
            disabled={isLoading}
          />
        </FormField>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 mt-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors shadow-[var(--shadow-sm)] cursor-pointer disabled:opacity-70"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-[var(--text-xs)] text-[var(--color-fg-muted)]">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-[var(--color-accent)] font-semibold hover:underline"
        >
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] p-4">
      <Suspense
        fallback={
          <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-8 text-center text-[var(--text-sm)] text-[var(--color-fg-muted)]">
            Loading sign in form...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
