"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { AuthService, ApiError } from "@/lib/api";
import { FormField, Input } from "@/components/ui/FormField";
import { z } from "zod";

// ─── Validation Schema ────────────────────────────────────────────────────────

const mentorApplySchema = z
  .object({
    name: z.string().min(2, "Full name is required"),
    email: z.string().email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one digit"),
    confirm_password: z.string(),
    city: z.string().min(2, "City is required"),
    bio: z
      .string()
      .min(10, "Bio must be at least 10 characters")
      .max(2000, "Bio cannot exceed 2000 characters"),
    niches: z.array(z.string()).min(1, "Select at least one niche"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormErrors = Partial<Record<keyof FormData, string>>;

// ─── Available Options ─────────────────────────────────────────────────────────

const AVAILABLE_NICHES = [
  "Embroidery",
  "Baking",
  "Tailoring",
  "Candle Making",
  "Jewelry Making",
  "Digital Marketing",
  "Social Media",
  "Handicrafts",
  "Food Business",
  "Textile",
  "Graphic Design",
  "Photography",
];

const AVAILABLE_LANGUAGES = ["Urdu", "English", "Punjabi", "Sindhi", "Pashto"];

// ─── Form Data Type ───────────────────────────────────────────────────────────

interface FormData {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  city: string;
  bio: string;
  niches: string[];
  languages: string[];
  avatar_url: string;
}

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MentorApplyPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    city: "",
    bio: "",
    niches: [],
    languages: ["Urdu", "English"],
    avatar_url: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // ── Field change handler ──────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // ── Niche toggle ──────────────────────────────────────────────────────────
  const toggleNiche = (niche: string) => {
    setFormData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : [...prev.niches, niche],
    }));
    if (errors.niches) {
      setErrors((prev) => ({ ...prev, niches: undefined }));
    }
  };

  // ── Language toggle ───────────────────────────────────────────────────────
  const toggleLanguage = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter((l) => l !== lang)
        : [...prev.languages, lang],
    }));
  };

  // ── Form submit ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    const result = mentorApplySchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.issues.forEach((err) => {
        const key = err.path[0] as keyof FormData;
        if (!fieldErrors[key]) fieldErrors[key] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setServerError(null);

    AuthService.mentorApplyApiV1AuthMentorApplyPost({
      requestBody: {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        city: formData.city.trim(),
        bio: formData.bio.trim(),
        niches: formData.niches,
        languages: formData.languages.length > 0 ? formData.languages : ["Urdu", "English"],
        avatar_url: formData.avatar_url.trim() || undefined,
      },
    })
      .then(() => {
        setIsSuccess(true);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError) {
          if (err.status === 409) {
            setErrors({ email: "An account with this email already exists." });
          } else if (
            err.body &&
            typeof err.body === "object" &&
            "detail" in err.body
          ) {
            setServerError(String((err.body as { detail: string }).detail));
          } else {
            setServerError(
              "Unable to submit application. Please try again."
            );
          }
        } else {
          setServerError("Connection error. Please verify the API is running.");
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] p-4">
        <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-14 h-14 text-[var(--color-success)]" />
          </div>
          <h1 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)] mb-2">
            Application Submitted!
          </h1>
          <p className="text-[var(--text-sm)] text-[var(--color-fg-muted)] mb-6">
            Thank you for applying as a mentor on Hunar. Our team will review
            your application and contact you at <strong>{formData.email}</strong>.
            This usually takes 2–3 business days.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[var(--text-sm)] font-semibold text-[var(--color-accent)] hover:underline"
          >
            Sign in once you&apos;re approved
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-canvas)] p-4">
      <div className="w-full max-w-lg bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-md)] p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] font-bold text-xl mb-3 shadow-[var(--shadow-sm)]">
            H
          </div>
          <h1 className="text-[var(--text-lg)] font-bold text-[var(--color-fg)]">
            Apply as a Mentor
          </h1>
          <p className="text-[var(--text-xs)] text-[var(--color-fg-muted)] mt-1">
            Share your expertise with home-based women entrepreneurs
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
          {/* Full Name */}
          <FormField label="Full Name" name="name" required error={errors.name}>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="e.g. Nadia Malik"
              value={formData.name}
              onChange={handleChange}
              hasError={!!errors.name}
              disabled={isLoading}
            />
          </FormField>

          {/* Email */}
          <FormField label="Email Address" name="email" required error={errors.email}>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              hasError={!!errors.email}
              disabled={isLoading}
            />
          </FormField>

          {/* Password */}
          <FormField
            label="Password"
            name="password"
            required
            error={errors.password}
            hint="Min. 8 chars, one uppercase, one digit"
          >
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              hasError={!!errors.password}
              disabled={isLoading}
            />
          </FormField>

          {/* Confirm Password */}
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
              placeholder="••••••••"
              value={formData.confirm_password}
              onChange={handleChange}
              hasError={!!errors.confirm_password}
              disabled={isLoading}
            />
          </FormField>

          {/* City */}
          <FormField label="City" name="city" required error={errors.city}>
            <Input
              id="city"
              name="city"
              type="text"
              placeholder="e.g. Lahore"
              value={formData.city}
              onChange={handleChange}
              hasError={!!errors.city}
              disabled={isLoading}
            />
          </FormField>

          {/* Bio */}
          <FormField
            label="Bio"
            name="bio"
            required
            error={errors.bio}
            hint="Describe your expertise and experience (min. 10 characters)"
          >
            <textarea
              id="bio"
              name="bio"
              rows={4}
              placeholder="Tell us about your business background, skills, and how you plan to help entrepreneurs..."
              value={formData.bio}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 rounded-[var(--radius-sm)] border bg-[var(--color-surface)] text-[var(--text-sm)] text-[var(--color-fg)] outline-none resize-none placeholder:text-[var(--color-fg-subtle)] transition-colors focus:border-[var(--color-border-focus)] ${
                errors.bio
                  ? "border-[var(--color-danger)]"
                  : "border-[var(--color-border)]"
              }`}
            />
          </FormField>

          {/* Niches */}
          <div>
            <p className="text-[var(--text-sm)] font-medium text-[var(--color-fg)] mb-2">
              Areas of Expertise <span className="text-[var(--color-danger)]">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_NICHES.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => toggleNiche(niche)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-full text-[var(--text-xs)] font-medium border transition-colors ${
                    formData.niches.includes(niche)
                      ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] border-[var(--color-accent)]"
                      : "bg-[var(--color-canvas)] text-[var(--color-fg-muted)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
            {errors.niches && (
              <p className="mt-1.5 text-[var(--text-xs)] text-[var(--color-danger)]">
                {errors.niches}
              </p>
            )}
          </div>

          {/* Languages */}
          <div>
            <p className="text-[var(--text-sm)] font-medium text-[var(--color-fg)] mb-2">
              Languages You Teach In
            </p>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LANGUAGES.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  disabled={isLoading}
                  className={`px-3 py-1.5 rounded-full text-[var(--text-xs)] font-medium border transition-colors ${
                    formData.languages.includes(lang)
                      ? "bg-[var(--color-accent)] text-[var(--color-fg-inverse)] border-[var(--color-accent)]"
                      : "bg-[var(--color-canvas)] text-[var(--color-fg-muted)] border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 mt-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] text-[var(--color-fg-inverse)] text-[var(--text-sm)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--color-accent-hover)] transition-colors shadow-[var(--shadow-sm)] cursor-pointer disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting application...
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2 text-[var(--text-xs)] text-[var(--color-fg-muted)]">
          <div>
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              Sign in
            </Link>
          </div>
          <div>
            Want to join as an entrepreneur?{" "}
            <Link
              href="/signup"
              className="text-[var(--color-accent)] font-semibold hover:underline"
            >
              Sign up here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
