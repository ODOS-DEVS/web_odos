import CONFIG from "@/utils/config";

const { CURRENCY, LOCALE } = CONFIG;

const money = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const moneyWhole = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatMoney(value: number) {
  return money.format(value);
}

/** Drops the decimals when the amount is a whole number ("GH₵40" not "GH₵40.00"). */
export function formatMoneyCompact(value: number) {
  return Number.isInteger(value) ? moneyWhole.format(value) : money.format(value);
}

// Fixed time zone keeps server and client output identical (no hydration drift).
const date = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

const dateTime = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

export function formatDate(iso: string) {
  return date.format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return dateTime.format(new Date(iso));
}

export function formatCount(value: number) {
  return new Intl.NumberFormat(LOCALE, { notation: "compact" }).format(value);
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
