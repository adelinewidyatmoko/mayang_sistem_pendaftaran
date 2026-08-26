import { ReactNode } from "react";

export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground/80">
        {label}
        {required && <span className="text-gold"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-foreground/50">{hint}</p>
      ) : null}
    </div>
  );
}

export const formInputClassName =
  "mt-1.5 w-full border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground/40 transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20";
