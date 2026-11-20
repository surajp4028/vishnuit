/** "20 Nov 2027" — the one date style used across seller and admin pages (India time). */
export function fmtDate(d: string | number | Date | null | undefined) {
  if (d == null || d === "") return "";
  const t = new Date(d);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
