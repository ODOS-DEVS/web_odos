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

const chatClockTime = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: "UTC" });
const chatWeekday = new Intl.DateTimeFormat(LOCALE, { weekday: "short", timeZone: "UTC" });
const chatShortDate = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" });

function utcStartOfDay(d: Date) {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/** Always a clock time ("9:49 AM") — for the timestamp inside a single chat bubble. */
export function formatChatTime(iso: string) {
  return chatClockTime.format(new Date(iso));
}

/** WhatsApp/iMessage-style relative stamp for a chat thread list: time today, "Yesterday", weekday within a week, else a short date. */
export function formatChatListTime(iso: string) {
  const target = new Date(iso);
  const diffDays = Math.round((utcStartOfDay(new Date()) - utcStartOfDay(target)) / 86_400_000);
  if (diffDays <= 0) return chatClockTime.format(target);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return chatWeekday.format(target);
  return chatShortDate.format(target);
}

/** The sticky day divider ("Today" / "Yesterday" / "13 Oct") shown between message groups in a thread. */
export function formatChatDayDivider(iso: string) {
  const target = new Date(iso);
  const diffDays = Math.round((utcStartOfDay(new Date()) - utcStartOfDay(target)) / 86_400_000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return chatShortDate.format(target);
}

export function formatCount(value: number) {
  return new Intl.NumberFormat(LOCALE, { notation: "compact" }).format(value);
}

export function discountPercent(price: number, compareAt?: number | null) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
