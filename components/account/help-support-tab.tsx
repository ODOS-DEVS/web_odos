import { ChevronDown } from "lucide-react";
import { CONTACT_METHODS } from "@/components/layout/contact-drawer";
import { cn } from "@/libs/cn";

const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I track my order?",
    a: "Open Profile → your orders, or the Orders page from the main menu. Each order shows live status from confirmed through to delivered.",
  },
  {
    q: "How do returns, exchanges, and refunds work?",
    a: "Once an item is delivered, start a request from the Returns tab here in your account. Pick refund, exchange, or return, add a reason and optional photos, and we'll route it to the vendor.",
  },
  {
    q: "How do I use a wallet balance or voucher?",
    a: "Top up your ODOS Wallet from the Wallet tab, and redeem voucher codes from the Vouchers tab. Both apply automatically at checkout when eligible.",
  },
  {
    q: "Which regions do you deliver to?",
    a: "We deliver across all 16 regions of Ghana. Delivery speed and fees vary by region and vendor, shown at checkout before you pay.",
  },
  {
    q: "Is my payment information secure?",
    a: "Yes. Cards and mobile money are processed by our payment partner — ODOS never stores full card numbers or MoMo PINs.",
  },
  {
    q: "How do I become a vendor on ODOS?",
    a: "Use \"Request to be a vendor\" in your account to apply. We'll review your application and follow up by email.",
  },
];

export function HelpSupportTab() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {CONTACT_METHODS.map(({ icon: Icon, tone, title, subtitle, href, external }) => (
          <a
            key={title}
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="press group flex flex-col items-start gap-3 rounded-2xl border border-line bg-surface p-5 hover:border-foreground"
          >
            <span className={cn("grid size-10 shrink-0 place-items-center rounded-full", tone)}>
              <Icon className="size-4" aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="mt-0.5 block text-xs text-muted">{subtitle}</span>
            </span>
          </a>
        ))}
      </div>

      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold tracking-normal">Frequently asked questions</h2>
        <div className="mt-2 divide-y divide-line">
          {FAQS.map(({ q, a }) => (
            <details key={q} className="group py-4 first:pt-0 last:pb-0">
              <summary className="press flex cursor-pointer list-none items-center justify-between gap-4 marker:hidden [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-medium">{q}</span>
                <ChevronDown className="size-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-2.5 text-sm leading-6 text-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
