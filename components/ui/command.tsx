"use client";

import type { ComponentProps } from "react";
import { Search } from "lucide-react";
import { Command as CommandPrimitive } from "cmdk";
import { cn } from "@/libs/cn";

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      className={cn("flex size-full flex-col overflow-hidden rounded-xl bg-surface text-foreground", className)}
      {...props}
    />
  );
}

export function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2 border-b border-line px-3" data-slot="command-input-wrapper">
      <Search className="size-4 shrink-0 text-muted" aria-hidden />
      <CommandPrimitive.Input
        className={cn(
          "h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn("max-h-72 overflow-x-hidden overflow-y-auto p-1", className)} {...props} />;
}

export function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className={cn("py-8 text-center text-sm text-muted", className)} {...props} />;
}

export function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return <CommandPrimitive.Group className={cn("overflow-hidden", className)} {...props} />;
}

export function CommandItem({ className, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "relative flex cursor-default items-center rounded-lg px-3 py-2 text-sm outline-none select-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-surface-muted data-[disabled=true]:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
