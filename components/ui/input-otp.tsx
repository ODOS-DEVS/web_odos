"use client";

import * as React from "react";
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { Minus } from "lucide-react";
import { cn } from "@/libs/cn";

const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center justify-center gap-2 has-disabled:opacity-50",
      containerClassName,
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
));
InputOTP.displayName = "InputOTP";

const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
));
InputOTPGroup.displayName = "InputOTPGroup";

const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {};

  return (
    <div
      ref={ref}
      data-slot="input-otp-slot"
      className={cn(
        "relative flex size-11 sm:size-12 items-center justify-center border-y border-r border-line bg-surface text-base font-semibold transition-colors duration-150 first:rounded-l-xl first:border-l last:rounded-r-xl",
        isActive && "z-10 ring-2 ring-foreground/20 border-foreground outline-none",
        className,
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="animate-caret-blink h-4 w-px bg-foreground duration-1000" />
        </div>
      )}
    </div>
  );
});
InputOTPSlot.displayName = "InputOTPSlot";

const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} role="separator" className={cn("text-muted px-1", className)} {...props}>
    <Minus className="size-4" />
  </div>
));
InputOTPSeparator.displayName = "InputOTPSeparator";

export interface InputOTPAlphanumericProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof OTPInput>,
    "children" | "render" | "maxLength"
  > {
  maxLength?: number;
}

export function InputOTPAlphanumeric({
  maxLength = 6,
  pattern = REGEXP_ONLY_DIGITS_AND_CHARS,
  ...props
}: InputOTPAlphanumericProps = {}) {
  return (
    <InputOTP maxLength={maxLength} pattern={pattern} {...props}>
      <InputOTPGroup>
        <InputOTPSlot index={0} />
        <InputOTPSlot index={1} />
        <InputOTPSlot index={2} />
      </InputOTPGroup>
      <InputOTPSeparator />
      <InputOTPGroup>
        <InputOTPSlot index={3} />
        <InputOTPSlot index={4} />
        <InputOTPSlot index={5} />
      </InputOTPGroup>
    </InputOTP>
  );
}

export {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
  REGEXP_ONLY_DIGITS_AND_CHARS,
};
