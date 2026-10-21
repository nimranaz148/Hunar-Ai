"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { FormField, Input } from "@/components/ui/FormField";
import { AuthService, ApiError } from "@/lib/api";
import { changePasswordSchema } from "@/lib/schemas/auth";
import { CheckCircle2, KeyRound, Loader2 } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
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

    const validation = changePasswordSchema.safeParse(formData);
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

    setIsLoading(true);
    try {
      await AuthService.changePasswordApiV1AuthChangePasswordPost({
        requestBody: {
          current_password: formData.current_password,
          new_password: formData.new_password,
        },
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErrors({ current_password: "Current password does not match" });
        } else if (err.body && typeof err.body === "object" && "detail" in err.body) {
          setServerError(String((err.body as { detail: string }).detail));
        } else {
          setServerError("Failed to change password. Please check your inputs.");
        }
      } else {
        setServerError("Connection error. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell
      role="entrepreneur"
      userName="Ayesha Khan"
      pageTitle="Change Password (F-039)"
    >
      <div className="max-w-md mx-auto p-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 rounded-[var(--radius-md)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--color-fg)]">
              Update Password
            </h2>
            <p className="text-xs text-[var(--color-fg-muted)]">
              Enter your current password and choose a secure new one.
            </p>
          </div>
        </div>

        {success ? (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-success-subtle)] border border-[var(--color-success-border)] text-sm text-[var(--color-success)] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            Password changed successfully! Redirecting to dashboard...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div
                role="alert"
                className="p-3 rounded-[var(--radius-sm)] bg-[var(--color-danger-subtle)] border border-[var(--color-danger-border)] text-xs text-[var(--color-danger)] font-medium"
              >
                {serverError}
              </div>
            )}

            <FormField
              label="Current Password"
              name="current_password"
              required
              error={errors.current_password}
            >
              <Input
                type="password"
                name="current_password"
                value={formData.current_password}
                onChange={handleChange}
                hasError={!!errors.current_password}
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="New Password"
              name="new_password"
              hint="Minimum 8 characters with 1 uppercase letter and 1 number"
              required
              error={errors.new_password}
            >
              <Input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                hasError={!!errors.new_password}
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="Confirm New Password"
              name="confirm_password"
              required
              error={errors.confirm_password}
            >
              <Input
                type="password"
                name="confirm_password"
                value={formData.confirm_password}
                onChange={handleChange}
                hasError={!!errors.confirm_password}
                disabled={isLoading}
              />
            </FormField>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 mt-3 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors shadow-[var(--shadow-sm)] cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating password...
                </>
              ) : (
                "Change Password"
              )}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
