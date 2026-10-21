import React from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({
  label,
  name,
  error,
  hint,
  required,
  children,
  className,
  ...props
}: FormFieldProps) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className={cn("flex flex-col space-y-1.5 w-full", className)} {...props}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="font-label text-sm text-[var(--color-fg)]"
        >
          {label}
          {required && <span className="text-[var(--color-danger)] ml-0.5">*</span>}
        </label>
      </div>

      <div className="relative w-full">{children}</div>

      {error ? (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-danger)] mt-0.5">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-2xs text-[var(--color-fg-subtle)] mt-0.5">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, hasError, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full h-[var(--control-md)] px-3 py-1.5 rounded-[var(--radius-md)] border-2 bg-[var(--color-surface-raised)] text-base text-[var(--color-fg)] placeholder:text-[var(--color-fg-subtle)] outline-none transition-colors",
          hasError
            ? "border-[var(--color-danger)] focus:ring-2 focus:ring-[var(--color-danger)]"
            : "border-[var(--color-ink)] focus:border-[var(--color-violet)] focus:ring-2 focus:ring-[var(--color-violet)]",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
