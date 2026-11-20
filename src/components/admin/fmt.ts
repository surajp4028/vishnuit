/**
 * Admin date format: "20 Nov 2027". DB values come back as UTC strings ("2027-11-20 18:29:59"),
 * so parse them as UTC and show the day in India time — same output on server and browser.
 */
export function adminDate(v: string | Date | null | undefined, empty = "—") {
  if (!v) return empty;
  const d = v instanceof Date ? v : new Date(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(v) ? `${v.replace(" ", "T")}Z` : v);
  if (Number.isNaN(d.getTime())) return empty;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

export const adminINR = (n: number | string | null | undefined) =>
  `₹${Number(n ?? 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
