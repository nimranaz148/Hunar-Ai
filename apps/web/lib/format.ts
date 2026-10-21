/**
 * Display formatters. Dates render in Asia/Karachi so server and client output match,
 * and so a date-only value never shifts a day for the people this product serves.
 */
const TZ = "Asia/Karachi";

export function formatPKR(amount: number): string {
  const value = Number.isFinite(amount) ? amount : 0;
  return `PKR ${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatQuantity(value: number): string {
  return (Number.isFinite(value) ? value : 0).toLocaleString("en-US");
}

/** `value` is a ratio-as-percent already (e.g. 42.5 means 42.5%). */
export function formatPercentage(value: number, fractionDigits = 1): string {
  const v = Number.isFinite(value) ? value : 0;
  return `${v.toFixed(fractionDigits).replace(/\.0+$/, "")}%`;
}

export function formatDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
}

export function formatDateTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });
}
