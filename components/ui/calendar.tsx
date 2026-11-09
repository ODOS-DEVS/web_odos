"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/libs/cn";

/** shadcn/ui Calendar (react-day-picker v9), styled with the ODOS tokens. */
export function Calendar({ className, classNames, showOutsideDays = true, ...props }: React.ComponentProps<typeof DayPicker>) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-1", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: "relative flex flex-col gap-4",
        month: "flex w-full flex-col gap-3",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous:
          "press grid size-8 place-items-center rounded-full hover:bg-surface-muted aria-disabled:opacity-40",
        button_next: "press grid size-8 place-items-center rounded-full hover:bg-surface-muted aria-disabled:opacity-40",
        month_caption: "flex h-8 items-center justify-center px-10",
        dropdowns: "flex items-center gap-1.5 text-sm font-medium",
        dropdown_root: "relative rounded-lg border border-line px-2 py-1 hover:border-foreground/40",
        dropdown: "absolute inset-0 cursor-pointer opacity-0",
        caption_label: "flex items-center gap-1 text-sm font-medium [&>svg]:size-3.5 [&>svg]:text-muted",
        weekdays: "flex",
        weekday: "w-9 text-center text-xs font-normal text-muted",
        week: "mt-1 flex w-full",
        day: "size-9 p-0 text-center text-sm",
        day_button:
          "press grid size-9 place-items-center rounded-full hover:bg-surface-muted aria-selected:bg-accent aria-selected:text-accent-foreground",
        selected: "",
        today: "font-semibold text-accent",
        outside: "text-muted/60",
        disabled: "pointer-events-none opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClass }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("size-4", chevronClass)} aria-hidden />
          ) : orientation === "right" ? (
            <ChevronRight className={cn("size-4", chevronClass)} aria-hidden />
          ) : (
            <ChevronRight className={cn("size-4 rotate-90", chevronClass)} aria-hidden />
          ),
      }}
      {...props}
    />
  );
}
