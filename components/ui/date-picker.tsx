"use client";

import { useState } from "react";
import { format, parseISO, isValid } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/libs/cn";
import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

/** Parses a "YYYY-MM-DD" value without timezone drift; `undefined` for anything else. */
const toDate = (value: string) => {
  if (!value) return undefined;
  const date = parseISO(value.slice(0, 10));
  return isValid(date) ? date : undefined;
};

/**
 * shadcn/ui date picker: an input-styled button that opens a Calendar in a Popover. The value is a
 * plain "YYYY-MM-DD" string, which is what the API's `date` fields take. Month/year dropdowns make it
 * quick to reach a birth year.
 */
export function DatePickerField({
  id,
  label,
  value,
  onChange,
  placeholder = "Pick a date",
  fromYear = 1920,
  toDate: maxDate = new Date(),
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fromYear?: number;
  toDate?: Date;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = toDate(value);

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        {selected && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-muted underline underline-offset-2 hover:text-foreground">
            Clear
          </button>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            className={cn(
              "flex h-12 w-full items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 text-left text-base outline-none transition-colors sm:text-sm",
              "hover:border-foreground/40 focus-visible:border-foreground data-[state=open]:border-foreground",
              !selected && "text-muted/70",
            )}
          >
            {selected ? format(selected, "d MMMM yyyy") : placeholder}
            <CalendarDays className="size-4 shrink-0 text-muted" aria-hidden />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected ?? new Date(maxDate.getFullYear() - 25, 0)}
            startMonth={new Date(fromYear, 0)}
            endMonth={maxDate}
            disabled={{ after: maxDate }}
            onSelect={(date) => {
              onChange(date ? format(date, "yyyy-MM-dd") : "");
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
