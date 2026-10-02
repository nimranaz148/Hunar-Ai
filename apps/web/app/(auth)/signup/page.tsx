"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthService, ApiError, type RegisterRequest } from "@/lib/api";
import { signupSchema } from "@/lib/schemas/auth";
import { FormField, Input } from "@/components/ui/FormField";
import { ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    language: "roman_ur" as "ur" | "roman_ur" | "en",
    invite_code: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
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

    // 1. Client Zod Validation
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    // 2. Submit to Backend API
    setIsLoading(true);
    try {
      await AuthService.registerApiV1AuthRegisterPost({
        requestBody: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          language: formData.language as RegisterRequest["language"],
          invite_code: formData.invite_code.trim() || undefined,
        },
      });

      router.push("/login?registered=1");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setErrors({ email: "An account with this email already exists." });
        } else if (err.body && typeof err.body === "object" && "detail" in err.body) {
          setServerError(String((err.body as { detail: string }).detail));
        } else {
          setServerError("Unable to complete registration. Please try again.");
        }
      } else {
        setServerError("Connection error. Please verify the API is running.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] p-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] font-bold text-xl mb-3 shadow-[var(--shadow-sm)]">
            H
          </div>
          <h1 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
            Create your account
          </h1>
          <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
            Empowering Pakistani home-business women with AI tools
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="mb-5 p-3 rounded-[var(--radius-sm)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] text-[var(--text-xs)] text-[var(--color-danger)] font-medium"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField label="Full Name" name="name" required error={errors.name}>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Ayesha Khan"
              value={formData.name}
              onChange={handleChange}
              hasError={!!errors.name}
              disabled={isLoading}
            />
          </FormField>

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

          <FormField
            label="Password"
            name="password"
            required
            hint="Minimum 8 characters with 1 uppercase letter and 1 number"
            error={errors.password}
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              hasError={!!errors.password}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="Confirm Password"
            name="confirm_password"
            required
            error={errors.confirm_password}
          >
            <Input
              id="confirm_password"
              name="confirm_password"
              type="password"
              autoComplete="new-password"
              value={formData.confirm_password}
              onChange={handleChange}
              hasError={!!errors.confirm_password}
              disabled={isLoading}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Language" name="language" required>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full h-[var(--control-md)] px-2.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--text-sm)] text-[var(--color-fg)] outline-none focus:border-[var(--color-border-focus)]"
              >
                <option value="roman_ur">Roman Urdu</option>
                <option value="ur">اردو (Urdu)</option>
                <option value="en">English</option>
              </select>
            </FormField>

            <FormField label="Cohort Invite Code" name="invite_code" hint="Optional">
              <Input
                id="invite_code"
                name="invite_code"
                type="text"
                placeholder="e.g. LAHORE2026"
                value={formData.invite_code}
                onChange={handleChange}
                hasError={!!errors.invite_code}
                disabled={isLoading}
              />
            </FormField>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors shadow-[var(--shadow-sm)] cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-[var(--text-xs)] text-[var(--color-fg-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--color-accent)] font-semibold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
