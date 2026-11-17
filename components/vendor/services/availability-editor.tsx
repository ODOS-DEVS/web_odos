"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { CalendarOff, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/field";
import { Panel, PanelHeader } from "@/components/vendor/vendor-ui";
import { cn } from "@/libs/cn";
import {
  useAddAvailabilityException,
  useSaveAvailability,
  useServiceAvailability,
} from "@/hooks/use-services";
import { WEEKDAY_LABELS, type AvailabilityRule } from "@/types/services";

/** A sensible starting window for a day a provider has just switched on. */
const DEFAULT_WINDOW = { startTime: "09:00", endTime: "17:00" };

/**
 * The weekly availability pattern for one service.
 *
 * The API replaces the whole week on save rather than diffing rows — deliberately, so a
 * half-applied week can't leave a provider open on a day they closed. That means this editor
 * must always submit the complete picture, which is why it loads the existing rules first and
 * refuses to save before they arrive.
 */
export function AvailabilityEditor({ serviceId, title }: { serviceId: string; title: string }) {
  const existing = useServiceAvailability(serviceId);
  const save = useSaveAvailability();
  const addException = useAddAvailabilityException();

  // `null` means "untouched, show whatever loaded". Deriving the working week this way instead of
  // copying the query into state inside an effect avoids a cascading render, and means a slow
  // response can never overwrite edits the provider has already started making.
  const [edited, setEdited] = useState<AvailabilityRule[] | null>(null);
  const [closureDate, setClosureDate] = useState("");
  const [closureNote, setClosureNote] = useState("");

  const working = edited ?? existing.data ?? [];
  const loaded = edited !== null || existing.data !== undefined;

  /** Every edit works from the week currently on screen, loaded or not. */
  const setRules = useCallback(
    (update: (prev: AvailabilityRule[]) => AvailabilityRule[]) =>
      setEdited((prev) => update(prev ?? existing.data ?? [])),
    [existing.data],
  );
  const forDay = (weekday: number) => working.filter((r) => r.weekday === weekday);

  const setDayOpen = (weekday: number, open: boolean) =>
    setRules((prev) => {
      const base = prev;
      if (!open) return base.filter((r) => r.weekday !== weekday);
      if (base.some((r) => r.weekday === weekday)) return base;
      return [...base, { weekday, ...DEFAULT_WINDOW }];
    });

  const updateWindow = (weekday: number, index: number, patch: Partial<AvailabilityRule>) =>
    setRules((prev) => {
      const base = [...prev];
      const positions = base.map((r, i) => (r.weekday === weekday ? i : -1)).filter((i) => i >= 0);
      const target = positions[index];
      if (target === undefined) return base;
      base[target] = { ...base[target], ...patch };
      return base;
    });

  const addWindow = (weekday: number) =>
    setRules((prev) => [...prev, { weekday, ...DEFAULT_WINDOW }]);

  const removeWindow = (weekday: number, index: number) =>
    setRules((prev) => {
      const base = [...prev];
      const positions = base.map((r, i) => (r.weekday === weekday ? i : -1)).filter((i) => i >= 0);
      const target = positions[index];
      if (target === undefined) return base;
      base.splice(target, 1);
      return base;
    });

  const invalid = working.find((r) => r.startTime >= r.endTime);

  if (existing.isError) {
    return (
      <Panel>
        <PanelHeader title="Availability" />
        <p className="px-5 py-6 text-sm text-muted">
          We couldn&apos;t load this service&apos;s hours, so saving is disabled — writing now would replace a
          pattern we can&apos;t see.
        </p>
      </Panel>
    );
  }

  return (
    <Panel>
      <PanelHeader title={`Availability — ${title}`} />

      {!loaded ? (
        <p className="flex items-center gap-2 px-5 py-6 text-sm text-muted">
          <Loader2 className="size-4 animate-spin" aria-hidden />
          Loading your current hours…
        </p>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {WEEKDAY_LABELS.map((label, weekday) => {
              const windows = forDay(weekday);
              const open = windows.length > 0;
              return (
                <li key={label} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex w-36 shrink-0 items-center gap-2.5 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={open}
                        onChange={(event) => setDayOpen(weekday, event.target.checked)}
                        className="size-4 accent-[var(--accent)]"
                      />
                      {label}
                    </label>

                    {!open ? (
                      <span className="text-xs text-muted">Closed</span>
                    ) : (
                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        {windows.map((window, index) => (
                          <div key={index} className="flex flex-wrap items-center gap-2">
                            <input
                              type="time"
                              value={window.startTime}
                              aria-label={`${label} window ${index + 1} opens`}
                              onChange={(event) => updateWindow(weekday, index, { startTime: event.target.value })}
                              className={cn(inputClass, "h-9 w-28")}
                            />
                            <span className="text-xs text-muted">to</span>
                            <input
                              type="time"
                              value={window.endTime}
                              aria-label={`${label} window ${index + 1} closes`}
                              onChange={(event) => updateWindow(weekday, index, { endTime: event.target.value })}
                              className={cn(inputClass, "h-9 w-28")}
                            />
                            {window.startTime >= window.endTime && (
                              <span className="text-xs text-danger">End must be after start</span>
                            )}
                            {windows.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeWindow(weekday, index)}
                                aria-label={`Remove ${label} window ${index + 1}`}
                                className="press grid size-7 place-items-center rounded-full text-muted hover:bg-surface-muted"
                              >
                                <X className="size-3.5" aria-hidden />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => addWindow(weekday)}
                          className="press inline-flex w-fit items-center gap-1 text-xs font-medium text-accent"
                        >
                          <Plus className="size-3.5" aria-hidden />
                          Add another window
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
            <Button
              type="button"
              disabled={save.isPending || Boolean(invalid)}
              onClick={() =>
                save.mutate(
                  { serviceId, rules: working },
                  {
                    onSuccess: () => toast.success("Availability saved"),
                    onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't save your hours."),
                  },
                )
              }
            >
              {save.isPending ? "Saving…" : "Save the week"}
            </Button>
            {invalid && <p className="text-xs text-danger">Fix the highlighted times first.</p>}
            <p className="text-xs text-muted">
              Saving replaces the whole week, so what you see here is exactly what customers get offered.
            </p>
          </div>

          <div className="border-t border-line px-5 py-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarOff className="size-4 text-muted" aria-hidden />
              Close a specific date
            </h4>
            <p className="mt-1 text-xs text-muted">
              A holiday or a day off, without changing your normal week.
            </p>
            <form
              className="mt-3 flex flex-wrap items-end gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!closureDate) return;
                addException.mutate(
                  {
                    serviceId,
                    exception: { exceptionDate: closureDate, isAvailable: false, note: closureNote.trim() || null },
                  },
                  {
                    onSuccess: () => {
                      toast.success("Date closed");
                      setClosureDate("");
                      setClosureNote("");
                    },
                    onError: (e) => toast.error(e instanceof Error ? e.message : "We couldn't close that date."),
                  },
                );
              }}
            >
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">Date</span>
                <input
                  type="date"
                  value={closureDate}
                  onChange={(event) => setClosureDate(event.target.value)}
                  className={cn(inputClass, "h-9 w-40")}
                />
              </label>
              <label className="block min-w-0 flex-1">
                <span className="mb-1.5 block text-xs font-medium">Reason (optional)</span>
                <input
                  value={closureNote}
                  onChange={(event) => setClosureNote(event.target.value)}
                  maxLength={255}
                  placeholder="Public holiday"
                  className={cn(inputClass, "h-9")}
                />
              </label>
              <Button type="submit" variant="outline" disabled={!closureDate || addException.isPending}>
                {addException.isPending ? "Saving…" : "Close it"}
              </Button>
            </form>
          </div>
        </>
      )}
    </Panel>
  );
}
