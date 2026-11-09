"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Bike, Clock, MapPin, Navigation, Package, PackageCheck, Star, Store, User } from "lucide-react";
import { toast } from "sonner";
import { RequireLogin } from "@/components/auth/require-login";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Field } from "@/components/ui/field";
import { QueryError } from "@/components/ui/query-error";
import { SelectField } from "@/components/ui/select";
import {
  useActiveDelivery,
  useClaimOffer,
  useCourierOnline,
  useCourierProfile,
  useCreateCourierProfile,
  useDeliveryDetail,
  useDeliveryHistory,
  useDeliveryPool,
  useDeliveryStep,
  useLocationSharing,
} from "@/hooks/use-courier";
import { cn } from "@/libs/cn";
import { formatDate, formatDateTime } from "@/libs/format";
import type { CourierProfile, Delivery, DeliveryStep } from "@/types/courier";

const VEHICLES = ["Motorbike", "Bicycle", "Car", "Van", "On foot"] as const;
const FAIL_REASONS = ["Customer unreachable", "Wrong address", "Customer refused", "Item damaged", "Other"] as const;

const humanise = (value: string) => value.replace(/[_-]+/g, " ").replace(/^\w/, (c) => c.toUpperCase());

type Action = { step: DeliveryStep; label: string; tone?: "primary" | "danger" };

/**
 * The next step(s) for a delivery. The API's statuses are free text, so match on stems and fall back
 * to the timestamps; the server still validates every step and explains anything out of order.
 */
function nextActions(d: Delivery): { primary: Action | null; waiting: string | null; extra: Action[] } {
  const s = d.status.toLowerCase();
  const done = /deliver(ed)?$|completed|returned|released|cancel/.test(s) && !/verification/.test(s);
  if (done) return { primary: null, waiting: null, extra: [] };

  if (/return/.test(s)) return { primary: null, waiting: "Bring the order back to the store.", extra: [] };
  if (/fail/.test(s)) return { primary: { step: "start-return", label: "Return to store" }, waiting: null, extra: [] };
  if (/unavailable|no[_ ]?show/.test(s)) {
    return {
      primary: { step: "begin-delivery-verification", label: "Customer reached — hand over" },
      waiting: null,
      extra: [{ step: "fail-delivery", label: "Mark delivery failed", tone: "danger" }],
    };
  }
  if (/delivery[_ ]verification/.test(s)) {
    return {
      primary: null,
      waiting: "Ask the customer for their delivery code — they confirm receipt in their ODOS app.",
      extra: [{ step: "fail-delivery", label: "Couldn’t complete", tone: "danger" }],
    };
  }
  if (/at[_ ]customer|arrived[_ ]at[_ ]customer/.test(s) || (d.arrivedAtCustomerAt && !d.deliveredAt)) {
    return {
      primary: { step: "begin-delivery-verification", label: "Hand over to customer" },
      waiting: null,
      extra: [
        { step: "report-customer-unavailable", label: "Customer not available" },
        { step: "fail-delivery", label: "Couldn’t complete", tone: "danger" },
      ],
    };
  }
  if (/dropoff|to[_ ]customer|out[_ ]for|in[_ ]transit|picked[_ ]?up/.test(s) || d.pickedUpAt) {
    return /picked[_ ]?up$/.test(s)
      ? { primary: { step: "start-dropoff", label: "Head to customer" }, waiting: null, extra: [] }
      : { primary: { step: "arrive-at-customer", label: "I’ve arrived at the customer" }, waiting: null, extra: [] };
  }
  if (/pickup[_ ]verification/.test(s)) {
    return { primary: null, waiting: "Waiting for the store to confirm the handover.", extra: [{ step: "release", label: "Give job back", tone: "danger" }] };
  }
  if (/at[_ ]pickup|arrived[_ ]at[_ ]pickup/.test(s) || d.arrivedAtPickupAt) {
    return {
      primary: { step: "begin-pickup-verification", label: "Collect from store" },
      waiting: null,
      extra: [{ step: "release", label: "Give job back", tone: "danger" }],
    };
  }
  if (/to[_ ]pickup|heading|en[_ ]route/.test(s)) {
    return {
      primary: { step: "arrive-at-pickup", label: "I’ve arrived at the store" },
      waiting: null,
      extra: [{ step: "release", label: "Give job back", tone: "danger" }],
    };
  }
  return {
    primary: { step: "start-pickup", label: "Head to the store" },
    waiting: null,
    extra: [{ step: "release", label: "Give job back", tone: "danger" }],
  };
}

function statusTone(status: string): BadgeTone {
  const s = status.toLowerCase();
  if (/fail|cancel|unavailable/.test(s)) return "danger";
  if (/deliver(ed)?$|completed/.test(s)) return "success";
  if (/return|verification/.test(s)) return "warning";
  return "accent";
}

const mapsLink = (lat: number | null, lng: number | null, address: string | null) =>
  lat !== null && lng !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
      : null;

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-normal">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/* ---------------- Profile ---------------- */

function SetupProfile() {
  const create = useCreateCourierProfile();
  const [vehicle, setVehicle] = useState<string>("Motorbike");
  const [plate, setPlate] = useState("");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    create.mutate(
      { vehicleType: vehicle, plateNumber: plate },
      { onSuccess: () => toast.success("You’re set up as a courier"), onError: (e) => toast.error(e.message) },
    );
  };

  return (
    <Card title="Become an ODOS courier">
      <p className="-mt-2 mb-5 text-sm text-muted">Tell us how you ride, then go online to see delivery jobs near you.</p>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField id="vehicle" label="Vehicle" value={vehicle} onValueChange={setVehicle} options={VEHICLES} />
        <Field id="plate" label="Plate number" hint="Optional" value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="e.g. GW 1234-24" />
        <Button type="submit" size="lg" className="sm:col-span-2" disabled={create.isPending}>
          {create.isPending ? "Setting up…" : "Start delivering"}
        </Button>
      </form>
    </Card>
  );
}

function ProfileCard({ profile }: { profile: CourierProfile }) {
  const toggle = useCourierOnline();
  const online = profile.isOnline;

  return (
    <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <span className="grid size-14 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
        <Bike className="size-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {profile.vehicleType}
          {profile.plateNumber && <span className="ml-2 text-sm font-normal text-muted">{profile.plateNumber}</span>}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <Star className="size-3.5 fill-current text-warning" aria-hidden />
            {profile.rating ? profile.rating.toFixed(1) : "New"}
          </span>
          <span>{profile.totalDeliveries} deliveries</span>
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={online}
        disabled={toggle.isPending}
        onClick={() =>
          toggle.mutate(!online, {
            onSuccess: (p) => toast.success(p.isOnline ? "You’re online — new jobs will appear below" : "You’re offline"),
            onError: (e) => toast.error(e.message),
          })
        }
        className={cn(
          "press inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60",
          online ? "bg-success text-white" : "bg-surface-muted text-foreground",
        )}
      >
        <span className={cn("size-2.5 rounded-full", online ? "bg-white" : "bg-muted")} aria-hidden />
        {online ? "Online" : "Go online"}
      </button>
    </section>
  );
}

/* ---------------- Active delivery ---------------- */

function Stop({ icon, label, title, address, href }: { icon: ReactNode; label: string; title: string | null; address: string | null; href: string | null }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-surface-muted text-muted">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted">{label}</p>
        <p className="font-medium">{title ?? "—"}</p>
        {address && <p className="text-sm text-muted">{address}</p>}
      </div>
      {href && (
        <a href={href} target="_blank" rel="noopener noreferrer" className="press inline-flex shrink-0 items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs font-medium hover:border-foreground">
          <Navigation className="size-3.5" aria-hidden /> Directions
        </a>
      )}
    </div>
  );
}

function ActiveDelivery({ delivery }: { delivery: Delivery }) {
  const step = useDeliveryStep(delivery.id);
  const detail = useDeliveryDetail(delivery.id);
  const [failOpen, setFailOpen] = useState<DeliveryStep | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const { primary, waiting, extra } = nextActions(delivery);

  const run = (action: Action, input: { reason?: string; note?: string } = {}) =>
    step.mutate(
      { step: action.step, ...input },
      {
        onSuccess: (d) => {
          toast.success(`${action.label} — ${humanise(d.status).toLowerCase()}`);
          setFailOpen(null);
          setReason("");
          setNote("");
        },
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Card title={`Order ${delivery.orderNumber}`} action={<Badge tone={statusTone(delivery.status)}>{humanise(delivery.status)}</Badge>}>
      <div className="space-y-4">
        <Stop
          icon={<Store className="size-4" aria-hidden />}
          label="Pick up from"
          title={delivery.pickup.name}
          address={delivery.pickup.address}
          href={mapsLink(delivery.pickup.lat, delivery.pickup.lng, delivery.pickup.address)}
        />
        <Stop
          icon={<User className="size-4" aria-hidden />}
          label="Deliver to"
          title={delivery.customerName ?? delivery.dropoff.area}
          address={delivery.dropoff.address ?? delivery.dropoff.area}
          href={mapsLink(delivery.dropoff.lat, delivery.dropoff.lng, delivery.dropoff.address)}
        />
        <p className="flex items-center gap-2 text-sm text-muted">
          <Package className="size-4" aria-hidden /> {delivery.itemCount} {delivery.itemCount === 1 ? "item" : "items"}
          {delivery.attemptCount > 1 && <span>· attempt {delivery.attemptCount}</span>}
        </p>
        {delivery.instructions && <p className="rounded-xl bg-surface-muted p-3 text-sm">“{delivery.instructions}”</p>}
        {delivery.failureReason && <p className="rounded-xl bg-danger-soft p-3 text-sm text-danger">{delivery.failureReason}</p>}
      </div>

      <div className="mt-5 space-y-3 border-t border-line pt-5">
        {waiting && <p className="flex items-center gap-2 text-sm text-muted"><Clock className="size-4" aria-hidden /> {waiting}</p>}
        <div className="flex flex-wrap gap-2">
          {primary && (
            <Button size="lg" variant="accent" className="flex-1 sm:flex-none" disabled={step.isPending} onClick={() => run(primary)}>
              {step.isPending ? "Updating…" : primary.label}
            </Button>
          )}
          {extra.map((action) => (
            <Button
              key={action.step}
              variant="outline"
              className={action.tone === "danger" ? "border-danger/30 text-danger hover:border-danger" : undefined}
              disabled={step.isPending}
              onClick={() => (action.step === "fail-delivery" || action.step === "release" ? setFailOpen(action.step) : run(action))}
            >
              {action.label}
            </Button>
          ))}
        </div>

        {failOpen && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const action = extra.find((a) => a.step === failOpen)!;
              run(action, { reason: reason || undefined, note: note.trim() || undefined });
            }}
            className="space-y-3 rounded-xl bg-surface-muted/60 p-4"
          >
            {failOpen === "fail-delivery" && (
              <SelectField id="fail-reason" label="What happened?" value={reason} onValueChange={setReason} options={FAIL_REASONS} placeholder="Choose a reason" />
            )}
            <Field id="fail-note" label="Note" hint="Optional" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={step.isPending || (failOpen === "fail-delivery" && !reason)}>
                Confirm
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setFailOpen(null)}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </div>

      {detail.data && detail.data.events.length > 0 && (
        <ol className="mt-5 space-y-3 border-t border-line pt-5">
          {[...detail.data.events].reverse().map((event, i) => (
            <li key={`${event.at}-${i}`} className="flex items-baseline justify-between gap-3 text-sm">
              <span>{humanise(event.toStatus ?? event.event)}</span>
              <time dateTime={event.at} className="shrink-0 text-xs text-muted">{formatDateTime(event.at)}</time>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

/* ---------------- Pool & history ---------------- */

function Pool({ online }: { online: boolean }) {
  const pool = useDeliveryPool(online);
  const claim = useClaimOffer();

  if (!online) {
    return (
      <Card title="Delivery jobs">
        <p className="text-sm text-muted">Go online to see jobs waiting for a courier.</p>
      </Card>
    );
  }

  return (
    <Card title="Delivery jobs" action={pool.data && <span className="text-xs text-muted">{pool.data.length} open</span>}>
      {pool.isPending ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-surface-muted" />)}
        </div>
      ) : pool.isError ? (
        <QueryError error={pool.error} onRetry={() => pool.refetch()} title="We couldn’t load jobs" />
      ) : pool.data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No jobs right now — this list refreshes on its own.</p>
      ) : (
        <ul className="space-y-3">
          {pool.data.map((offer) => (
            <li key={offer.id} className="flex flex-wrap items-center gap-4 rounded-xl border border-line p-4">
              <div className="min-w-0 flex-1 space-y-1 text-sm">
                <p className="font-semibold">Order {offer.orderNumber}</p>
                <p className="flex items-center gap-1.5 text-muted"><Store className="size-3.5" aria-hidden /> {offer.pickupName ?? "Store"}{offer.pickupArea && ` · ${offer.pickupArea}`}</p>
                <p className="flex items-center gap-1.5 text-muted"><MapPin className="size-3.5" aria-hidden /> {offer.dropoffArea ?? "Customer"}</p>
                <p className="text-xs text-muted">{offer.itemCount} items · deliver by {formatDateTime(offer.slaDeadline)}</p>
              </div>
              <Button
                variant="accent"
                disabled={claim.isPending}
                onClick={() =>
                  claim.mutate(offer.id, {
                    onSuccess: () => toast.success(`Order ${offer.orderNumber} is yours`),
                    onError: (e) => toast.error(e.message),
                  })
                }
              >
                Accept job
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function History() {
  const history = useDeliveryHistory(true);
  if (!history.data || history.data.length === 0) return null;
  return (
    <Card title="Recent deliveries">
      <ul className="divide-y divide-line">
        {history.data.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <div className="min-w-0">
              <p className="font-medium">Order {d.orderNumber}</p>
              <p className="truncate text-xs text-muted">{d.pickup.name ?? "Store"} → {d.dropoff.area ?? "Customer"} · {formatDate(d.deliveredAt ?? d.createdAt)}</p>
            </div>
            <Badge tone={statusTone(d.status)}>{humanise(d.status)}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  );
}

/* ---------------- Page ---------------- */

function CourierDashboard() {
  const profile = useCourierProfile();
  const hasProfile = Boolean(profile.data);
  const active = useActiveDelivery(hasProfile);
  useLocationSharing(Boolean(profile.data?.isOnline));

  if (profile.isPending) {
    return (
      <div className="space-y-5" aria-busy="true" aria-label="Loading courier dashboard">
        <div className="h-24 animate-pulse rounded-2xl bg-surface-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-surface-muted" />
      </div>
    );
  }
  if (profile.isError) return <QueryError error={profile.error} onRetry={() => profile.refetch()} title="We couldn’t load your courier profile" />;
  if (!profile.data) return <SetupProfile />;

  return (
    <div className="space-y-5">
      <ProfileCard profile={profile.data} />
      {active.data ? (
        <ActiveDelivery delivery={active.data} />
      ) : active.isPending ? (
        <div className="h-48 animate-pulse rounded-2xl bg-surface-muted" aria-busy="true" />
      ) : (
        <Pool online={profile.data.isOnline} />
      )}
      <History />
    </div>
  );
}

export function CourierView() {
  return (
    <Container className="max-w-3xl py-8 sm:py-12">
      <h1 className="mb-8 flex items-center gap-2 text-3xl font-semibold sm:text-4xl">
        <PackageCheck className="size-8 text-accent" aria-hidden /> Courier
      </h1>
      <RequireLogin next="/courier" message="Log in to see delivery jobs and manage your deliveries.">
        <CourierDashboard />
      </RequireLogin>
    </Container>
  );
}

