import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Joins class names and resolves Tailwind conflicts, so an override like `hidden` beats a base `inline-flex`. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
