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
    <section className="mt-24 bg-surface-muted/60 py-16">
      <Container>
        <h2 className="max-w-md text-2xl font-semibold sm:text-3xl">
          How one order reaches you from many vendors
        </h2>
        <ol className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title}>
              <div className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-surface shadow-sm">
                  <step.icon className="size-5 text-accent" aria-hidden />
                </span>
                <span className="text-sm font-medium text-muted tabular-nums">0{index + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold tracking-normal">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
