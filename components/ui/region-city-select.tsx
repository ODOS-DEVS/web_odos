"use client";

import { useId, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { inputClass } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GHANA_REGIONS, getCitiesForRegion, matchGhanaRegion } from "@/libs/ghana-locations";
import { cn } from "@/libs/cn";

function SearchableSelect({
  id,
  name,
  value,
  options,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  disabled = false,
  required = false,
  onChange,
}: {
  id: string;
  name: string;
  value: string;
  options: readonly string[];
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  disabled?: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const listId = `${id}-options`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-required={required}
          disabled={disabled}
          className={cn(inputClass, "flex items-center justify-between gap-3 text-left")}
        >
          <span className={cn("truncate", !value && "text-muted/70")}>{value || placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList id={listId}>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 size-4 shrink-0", value === option ? "opacity-100" : "opacity-0")} aria-hidden />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
      <input type="hidden" name={name} value={value} />
    </Popover>
  );
}

/**
 * Region, and the towns inside it — the same pair of dropdowns the mobile app uses, from the same
 * dataset. Picking a region narrows the towns; a town saved earlier that is not in the list (an
 * older free-text value, or one typed on another client) is kept as an option so editing a profile
 * never silently drops it.
 */
export function RegionCitySelect({
  region,
  city,
  onRegionChange,
  onCityChange,
  required = false,
  cityLabel = "Town / city",
  idPrefix,
}: {
  region: string;
  city: string;
  onRegionChange: (region: string) => void;
  onCityChange: (city: string) => void;
  required?: boolean;
  cityLabel?: string;
  /** Set when two of these can appear on one page, so the label/input ids stay unique. */
  idPrefix?: string;
}) {
  const generatedId = useId();
  const prefix = idPrefix ?? generatedId;
  const regionId = `${prefix}-region`;
  const cityId = `${prefix}-city`;

  const towns = getCitiesForRegion(region, city);

  const onRegion = (next: string) => {
    onRegionChange(next);
    // The towns list changes with the region, so a town from the old one would be wrong.
    if (city && !getCitiesForRegion(next).includes(city)) onCityChange("");
  };

  return (
    <>
      <div>
        <label htmlFor={regionId} className="mb-1.5 block text-sm font-medium">
          Region
        </label>
        <SearchableSelect
          id={regionId}
          name="region"
          required={required}
          value={matchGhanaRegion(region) ?? ""}
          options={GHANA_REGIONS}
          placeholder="Select a region"
          searchPlaceholder="Search regions..."
          emptyMessage="No region found."
          onChange={onRegion}
        />
      </div>

      <div>
        <label htmlFor={cityId} className="mb-1.5 block text-sm font-medium">
          {cityLabel}
        </label>
        <SearchableSelect
          id={cityId}
          name="city"
          required={required}
          value={city}
          disabled={towns.length === 0}
          options={towns}
          placeholder={towns.length === 0 ? "Pick a region first" : `Select a ${cityLabel.toLowerCase()}`}
          searchPlaceholder={`Search ${cityLabel.toLowerCase()}...`}
          emptyMessage={`No ${cityLabel.toLowerCase()} found.`}
          onChange={onCityChange}
        />
      </div>
    </>
  );
}
