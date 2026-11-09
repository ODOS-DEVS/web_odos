"use client";

import type { ComponentProps } from "react";
import { useContext } from "react";
import { Minus } from "lucide-react";
import { OTPInput, OTPInputContext } from "input-otp";
import { cn } from "@/libs/cn";

export function InputOTP({ className, containerClassName, ...props }: ComponentProps<typeof OTPInput>) {
  return (
    <OTPInput
      containerClassName={cn("flex items-center gap-2 has-disabled:opacity-50", containerClassName)}
      className={cn("disabled:cursor-not-allowed", className)}
      {...props}
    />
  );
}

export function InputOTPGroup({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("flex items-center", className)} {...props} />;
}

export function InputOTPSlot({ index, className, ...props }: ComponentProps<"div"> & { index: number }) {
  const context = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = context?.slots[index] ?? {};

  return (
    <div
      className={cn(
        "relative flex size-11 items-center justify-center border-y border-r border-line bg-surface text-base font-semibold first:rounded-l-xl first:border-l last:rounded-r-xl",
        isActive && "z-10 border-accent ring-2 ring-accent/25",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="h-4 w-px animate-pulse bg-foreground" />
        </span>
      )}
    </div>
  );
}

export function InputOTPSeparator(props: ComponentProps<"div">) {
  return (
    <div role="separator" {...props}>
      <Minus className="size-4 text-muted" aria-hidden />
    </div>
  );
}
