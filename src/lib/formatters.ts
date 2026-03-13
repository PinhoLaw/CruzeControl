/** Format number as USD currency, no decimals. e.g. $12,345 */
export function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Format number as percentage string. e.g. 25% */
export function formatPct(n: number): string {
  return `${n}%`;
}

/** Format ISO date string as "Mar 5, 2026". Returns "—" for null/empty. */
export function formatDate(s: string | null | undefined): string {
  if (!s) return "—";
  return new Date(s + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
