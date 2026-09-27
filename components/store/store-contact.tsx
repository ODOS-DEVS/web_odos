import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";
import type { Store } from "@/types/catalog";

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <span className="min-w-0 break-words">{children}</span>
    </li>
  );
}

const linkClass = "underline underline-offset-2 hover:text-foreground";

/** About + how to reach the vendor. Only rows the vendor actually filled in are shown. */
export function StoreContact({ store }: { store: Store }) {
  const hasContact = store.address || store.phone || store.whatsappUrl || store.email;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="about-heading">
      <h2 id="about-heading" className="text-sm font-semibold tracking-normal">
        About {store.name}
      </h2>
      {store.description && <p className="mt-3 text-sm leading-6 text-muted">{store.description}</p>}

      {hasContact && (
        <ul className="mt-5 space-y-3 border-t border-line pt-5 text-sm text-muted">
          {store.address && <Row icon={<MapPin className="size-4" aria-hidden />}>{store.address}</Row>}
          {store.phone && (
            <Row icon={<Phone className="size-4" aria-hidden />}>
              <a href={`tel:${store.phone}`} className={linkClass}>
                {store.phone}
              </a>
            </Row>
          )}
          {store.whatsappUrl && (
            <Row icon={<MessageCircle className="size-4" aria-hidden />}>
              <a href={store.whatsappUrl} target="_blank" rel="noopener noreferrer" className={linkClass}>
                Chat on WhatsApp
              </a>
            </Row>
          )}
          {store.email && (
            <Row icon={<Mail className="size-4" aria-hidden />}>
              <a href={`mailto:${store.email}`} className={linkClass}>
                {store.email}
              </a>
            </Row>
          )}
        </ul>
      )}
    </section>
  );
}
