import { Check } from "lucide-react";
import type { FulfilmentStatus } from "@/types/order";
import { PROGRESS_STEPS, STATUS_LABEL, progressIndex } from "@/libs/orders";
import { cn } from "@/libs/cn";

/**
 * Horizontal progress for one package. A delayed package has left the happy
 * path, so it only shows the first step as reached and the rest as pending.
 */
export function StatusTimeline({ status }: { status: FulfilmentStatus }) {
  const delayed = status === "delayed";
  const reached = delayed ? 0 : progressIndex(status);

  return (
    <ol className="grid grid-cols-4 gap-2" aria-label="Package progress">
      {PROGRESS_STEPS.map((step, index) => {
        const done = index <= reached;
        const current = index === reached && !delayed;
        return (
          <li key={step} className="min-w-0" aria-current={current ? "step" : undefined}>
            <div className="flex items-center">
              <span
                className={cn(
                  "grid size-6 shrink-0 place-items-center rounded-full border-2 transition-colors duration-300",
                  done ? "border-success bg-success text-background" : "border-line bg-surface",
                  delayed && index === reached + 1 && "border-danger",
                )}
              >
                {done && <Check className="size-3.5" strokeWidth={3} aria-hidden />}
              </span>
              {index < PROGRESS_STEPS.length - 1 && (
                <span
                  className={cn("h-0.5 flex-1 transition-colors duration-300", index < reached ? "bg-success" : "bg-line")}
                  aria-hidden
                />
              )}
            </div>
            <p className={cn("mt-2 text-xs leading-tight", done ? "font-medium" : "text-muted")}>
              {STATUS_LABEL[step]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
