import type { HTMLAttributes } from "react";
import { cn } from "@/libs/cn";

export function Container({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 min-[1800px]:max-w-[90rem]", className)} {...props} />;
}
