"use client";

import { ChevronDown } from "lucide-react";
import { FAQS } from "@/components/home/faq";
import { CONTACT_METHODS } from "@/components/layout/contact-drawer";
import { TogglePill } from "@/components/ui/toggle-pill";
import { useQueryParam } from "@/hooks/use-query-param";
import { cn } from "@/libs/cn";

type PolicyId = "terms" | "privacy" | "shipping";

const POLICIES: Record<PolicyId, { label: string; title: string; subtitle: string; clauses: string[] }> = {
  terms: {
    label: "Terms",
    title: "Terms of Service",
    subtitle: "How using the platform works.",
    clauses: [
      "ODOS is a marketplace connecting independent vendors with shoppers; vendors are responsible for the accuracy of their own listings, pricing, and stock.",
      "You must be at least 18, or shopping with a guardian's consent, and provide accurate account and delivery details so vendors and riders can fulfil your orders.",
      "We may suspend accounts that abuse vouchers, dispute legitimate charges, or interfere with other shoppers or vendors on the platform.",
    ],
  },
  privacy: {
    label: "Privacy",
    title: "Privacy Policy",
    subtitle: "How we handle your data.",
    clauses: [
      "We collect the details you give us at signup and checkout — name, contact info, delivery address — plus order history, to run the marketplace and process deliveries.",
      "Vendors only see what's needed to fulfil your order; we never sell your personal data to third parties.",
      "You can request a copy or deletion of your data at any time from the Preferences section of your account, subject to records we must keep for tax and dispute purposes.",
    ],
  },
  shipping: {
    label: "Shipping",
    title: "Shipping Policy",
    subtitle: "How orders get to you.",
    clauses: [
      "Each vendor ships its own items; a single order may arrive in separate packages with separate tracking.",
      "Delivery fees and timelines are set per vendor based on your region and the delivery speed you choose at checkout.",
      "If a package is lost, damaged, or significantly delayed, open a request from the Returns tab and we'll coordinate a resolution with the vendor.",
    ],
  },
};

const POLICY_IDS = Object.keys(POLICIES) as PolicyId[];
const LAST_UPDATED = "February 16, 2026";

function isPolicyId(value: string | null): value is PolicyId {
  return POLICY_IDS.some((id) => id === value);
}

function PolicyCenter() {
  // Kept in the URL (like the other account tabs) so refreshing doesn't drop back to "Terms".
  const [policyParam, setPolicyParam] = useQueryParam("policy");
  const policyId: PolicyId = isPolicyId(policyParam) ? policyParam : "terms";
  const policy = POLICIES[policyId];

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="text-lg font-semibold tracking-normal">Policy center</h2>
      <p className="mt-1 text-sm text-muted">Transparent policies for shopping, payments, privacy and delivery on ODOS.</p>

      <div className="mt-5 flex items-center gap-10">
        <div>
          <p className="text-3xl font-semibold tabular-nums">{POLICY_IDS.length}</p>
          <p className="mt-0.5 text-xs text-muted">Policies</p>
        </div>
        <div>
          <p className="text-3xl font-semibold">Feb 2026</p>
          <p className="mt-0.5 text-xs text-muted">Updated</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-line pb-5">
        {POLICY_IDS.map((id) => (
          <TogglePill key={id} selected={policyId === id} onClick={() => setPolicyParam(id === "terms" ? null : id)}>
            {POLICIES[id].label}
          </TogglePill>
        ))}
      </div>

      <div className="mt-5">
        <h3 className="text-base font-semibold">{policy.title}</h3>
        <p className="mt-1 text-sm text-muted">{policy.subtitle}</p>
        <ol className="mt-4 space-y-4">
          {policy.clauses.map((clause, index) => (
            <li key={clause} className="flex gap-3 text-sm leading-6 text-muted">
              <span className="font-medium text-foreground">{index + 1}.</span>
              {clause}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 border-t border-line pt-5 text-center">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Last update · {LAST_UPDATED}</p>
        <p className="mt-2 text-sm text-muted">For legal enquiries, contact our support or legal team</p>
        <a href="mailto:legal@odosapp.com" className="press text-sm font-semibold hover:underline">
          legal@odosapp.com
        </a>
      </div>
    </div>
  );
}

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
        <p className="mt-1 text-sm text-muted">Everything you need to know about Odos</p>
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

      <PolicyCenter />
    </div>
  );
}
