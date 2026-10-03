import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/libs/cn";

export const inputClass =
  "h-12 w-full rounded-xl border border-line bg-surface px-4 text-base transition-colors sm:text-sm duration-150 placeholder:text-muted/70 hover:border-foreground/40 focus:border-foreground focus:outline-none disabled:opacity-50";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: ReactNode; id: string; error?: string };

/** A labelled input. Forwards its ref so `react-hook-form`'s `register(name)` can spread directly onto it. */
export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field({ label, hint, className, id, error, ...props }, ref) {
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {hint && <span className="text-xs">{hint}</span>}
      </div>
      <input
        id={id}
        name={props.name ?? id}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(inputClass, error && "border-danger focus:border-danger")}
        {...props}
      />
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
