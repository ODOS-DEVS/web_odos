import { CreditCard, Store, Truck } from "lucide-react";
import { Container } from "@/components/ui/container";

const steps = [
  {
    icon: Store,
    title: "Shop many vendors at once",
    body: "Add items from as many stores as you like. Your cart keeps each vendor’s items together.",
  },
  {
    icon: CreditCard,
    title: "Check out once",
    body: "One address, one payment. We split your order into a package for each vendor behind the scenes.",
  },
  {
    icon: Truck,
    title: "Each vendor delivers",
    body: "Vendors pack and send their own part with their own riders, so you can follow every package on its own.",
  },
];

export function HowItWorks() {
  return (
    <section className="mt-24 border-y border-line bg-surface-muted/40 py-16 sm:py-20">
      <Container>
        <p className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-[0.65rem] font-bold tracking-[0.16em] text-accent uppercase">
          How it works
        </p>
        <h2 className="mt-3 max-w-2xl text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
          How one order reaches you from many vendors
        </h2>
        <ol className="mt-8 grid gap-4 sm:mt-10 md:grid-cols-3 md:gap-5">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="group rounded-[1.4rem] border border-line bg-surface p-6 shadow-[0_10px_26px_rgba(22,20,15,0.06)] transition-transform duration-200 ease-[var(--ease-snap)] hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none sm:p-7"
            >
              <span className="grid size-11 place-items-center rounded-full bg-accent-soft text-accent transition-transform duration-200 ease-[var(--ease-snap)] group-hover:-translate-y-0.5 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
                <step.icon className="size-5" strokeWidth={2.25} aria-hidden />
              </span>
              <p className="mt-6 text-[0.65rem] font-bold tracking-[0.14em] text-muted uppercase">
                Step {index + 1}
              </p>
              <h3 className="mt-1.5 text-base font-bold tracking-[-0.02em]">{step.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
