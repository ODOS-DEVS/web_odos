"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/libs/cn";

export type NotificationBadgeProps = {
  children?: ReactNode;
  className?: string;
  count?: number;
  max?: number;
  ping?: boolean;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  showZero?: boolean;
  status?: "online" | "offline" | "busy" | "away";
  variant?: "dot" | "count" | "status";
};

const statusColors = {
  away: "bg-warning",
  busy: "bg-danger",
  offline: "bg-muted",
  online: "bg-success",
};

const positionClasses = {
  "bottom-left": "-bottom-1 -left-1",
  "bottom-right": "-bottom-1 -right-1",
  "top-left": "-top-1 -left-1",
  "top-right": "-top-1 -right-1",
};

function AnimatedCount({ value, max, shouldReduceMotion }: { value: number; max: number; shouldReduceMotion: boolean | null }) {
  const displayValue = value > max ? `${max}+` : value.toString();

  // Derives the animation direction from the previous render's value without reading a ref during render.
  const [previous, setPrevious] = useState({ value, direction: 1 });
  if (previous.value !== value) {
    setPrevious({ value, direction: value > previous.value ? 1 : -1 });
  }
  const direction = previous.direction;

  if (shouldReduceMotion) {
    return <span className="leading-none font-semibold">{displayValue}</span>;
  }

  return (
    <span className="relative overflow-hidden leading-none font-semibold">
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          className="inline-block"
          initial={{ opacity: 0, y: direction * 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: direction * -12 }}
          transition={{ type: "spring", duration: 0.3, bounce: 0.1 }}
        >
          {displayValue}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** A dot, numbered count, or presence-status badge pinned to a corner of its child (or standalone without one). */
export function NotificationBadge({
  variant = "dot",
  count = 0,
  max = 99,
  status = "online",
  showZero = false,
  ping = false,
  position = "top-right",
  children,
  className,
}: NotificationBadgeProps) {
  const shouldReduceMotion = useReducedMotion();
  const isVisible = variant === "dot" || variant === "status" || (variant === "count" && (count > 0 || showZero));

  const getBadgeClasses = () => {
    if (variant === "dot") return "size-2.5";
    if (variant === "status") return "size-3";
    const displayValue = count > max ? `${max}+` : count.toString();
    if (displayValue.length === 1) return "size-4 text-[9px] min-[320px]:size-5 min-[320px]:text-[11px]";
    return "h-4 min-w-4 px-1 text-[9px] min-[320px]:h-5 min-[320px]:min-w-5 min-[320px]:text-[11px]";
  };

  const backgroundColor = variant === "status" ? statusColors[status] : "bg-accent";

  const badgeElement = (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.span
          className={cn(
            "absolute grid place-items-center rounded-full text-accent-foreground",
            backgroundColor,
            getBadgeClasses(),
            positionClasses[position],
            variant === "status" && "ring-2 ring-background",
            className,
          )}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0, transition: { duration: 0.15 } }}
          transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", duration: 0.25, bounce: 0.2 }}
        >
          {variant === "count" && <AnimatedCount value={count} max={max} shouldReduceMotion={shouldReduceMotion} />}
          {ping && !shouldReduceMotion && <span aria-hidden className={cn("absolute inset-0 animate-ping rounded-full opacity-75", backgroundColor)} />}
        </motion.span>
      )}
    </AnimatePresence>
  );

  if (!children) {
    return (
      <span className="relative inline-flex">
        <span className="size-4" />
        {badgeElement}
      </span>
    );
  }

  return (
    <span className="relative inline-flex">
      {children}
      {badgeElement}
    </span>
  );
}
