import * as React from "react";
import { cn } from "@/libs/cn";

/** shadcn/ui Input, styled with the ODOS tokens (surface, line, foreground). */
export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(function Input(
  { className, type, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type={type}
      data-slot="input"
      className={cn(
        "flex h-12 w-full min-w-0 rounded-xl border border-line bg-surface px-4 text-base transition-colors duration-150 outline-none sm:text-sm",
        "placeholder:text-muted/70 hover:border-foreground/40 focus-visible:border-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-danger aria-invalid:focus-visible:border-danger",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  );
});
