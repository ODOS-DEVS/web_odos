import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/container";
import { cn } from "@/libs/cn";

const FAQS = [
  {
    q: "How do I update my profile details?",
    a: "Open the account menu in the header and choose your profile. You can update your name, phone number and delivery address at any time.",
  },
  {
    q: "Do I need an account to shop on ODOS?",
    a: "You can browse and build a cart as a guest, but you’ll need to log in or create an account before checkout so we can confirm your order and let you track it.",
  },
  {
    q: "How do I track my order?",
    a: "Each vendor in your order ships separately. Open Orders from the header to see live status for every package.",
  },
  {
    q: "Can I cancel an order?",
    a: "You can cancel from the order details page while it’s still being prepared. Once a vendor has handed a package to a rider, contact support instead.",
  },
  {
    q: "What delivery options does ODOS offer?",
    a: "Every vendor offers at least a standard delivery speed, and many offer an express option — you’ll see what’s available for your address at checkout.",
  },
  {
    q: "How is my delivery fee calculated?",
    a: "Each vendor sets their own rate based on your region and the delivery speed you choose, so a multi-vendor cart can include more than one delivery fee.",
  },
  {
    q: "Why can’t I check out with my card?",
    a: "Double-check the card details and that it supports online payments in Ghana. If it still fails, try mobile money or contact your bank.",
  },
  {
    q: "Are there extra fees for card payment?",
    a: "No — ODOS doesn’t add a surcharge for paying by card. Any fee shown at checkout is your bank’s own processing fee, if applicable.",
  },
];

export function Faq() {
  return (
    <section className="mt-24 py-16">
      <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-center">
        <div>
          <h2 className="text-2xl font-semibold sm:text-3xl">Frequently Asked Questions</h2>
          <p className="mt-2 text-muted">Everything you need to know about Odos</p>
        </div>

        <div className="rounded-3xl bg-surface px-5 sm:px-6">
          {FAQS.map((item, index) => (
            <details key={item.q} className={cn("group py-1", index !== 0 && "border-t border-dashed border-line")}>
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <p className="pb-4 text-sm leading-6 text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}
