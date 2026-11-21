/**
 * A "return to" path that is guaranteed to stay on this site.
 * Rejects absolute URLs, protocol-relative "//x", backslashes and control characters
 * ("/\t/evil.com" is read by browsers as "//evil.com"), then double-checks by resolving it.
 */
export function safeNextPath(raw: unknown, fallback = "/"): string {
  if (typeof raw !== "string" || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  if (/[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  try {
    const u = new URL(raw, "https://same.invalid");
    if (u.origin !== "https://same.invalid") return fallback;
    return u.pathname + u.search + u.hash;
  } catch {
    return fallback;
  }
}
