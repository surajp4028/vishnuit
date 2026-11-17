import "server-only";
import { createHash } from "node:crypto";
import { getIntegrations } from "./integrations";

const sha = (v?: string) => (v ? createHash("sha256").update(v.trim().toLowerCase()).digest("hex") : undefined);

/** Send a server-side "Lead" event to Meta Conversions API (deduplicated with the browser Pixel via event_id). */
export async function sendMetaLead(opts: {
  eventId: string; url: string; email?: string; phone?: string; name?: string; city?: string;
  ip?: string; ua?: string; fbp?: string; fbc?: string; service?: string;
  /** Landing page slug, sent as content_category so custom conversions can filter per LP. */
  lp?: string;
  /** Per-landing-page pixel; when set, its own token is used (the common token belongs to the common pixel). */
  pixel?: { pixelId: string; capiToken: string; own: boolean };
}) {
  const c = await getIntegrations();
  const pixel = opts.pixel?.pixelId || c.metaPixelId;
  const token = opts.pixel ? opts.pixel.capiToken : c.metaCapiToken;
  if (!pixel || !token) return;
  const phone = opts.phone?.replace(/\D/g, "");
  const [fn, ...ln] = (opts.name ?? "").trim().split(/\s+/);
  const body = {
    data: [{
      event_name: "Lead",
      event_time: Math.floor(Date.now() / 1000),
      event_id: opts.eventId,
      action_source: "website",
      event_source_url: opts.url,
      user_data: {
        em: sha(opts.email) ? [sha(opts.email)] : undefined,
        ph: phone ? [sha(phone.length === 10 ? `91${phone}` : phone)] : undefined,
        fn: sha(fn) ? [sha(fn)] : undefined,
        ln: ln.length ? [sha(ln.join(" "))] : undefined,
        ct: sha(opts.city?.replace(/\s/g, "")) ? [sha(opts.city?.replace(/\s/g, ""))] : undefined,
        country: [sha("in")],
        client_ip_address: opts.ip,
        client_user_agent: opts.ua,
        fbp: opts.fbp,
        fbc: opts.fbc,
      },
      custom_data: { content_name: opts.service || "Website enquiry", content_category: opts.lp || undefined, currency: "INR" },
    }],
    ...(c.metaTestEventCode ? { test_event_code: c.metaTestEventCode } : {}),
  };
  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("[meta-capi]", res.status, (await res.text()).slice(0, 200));
  } catch (e) {
    console.error("[meta-capi]", (e as Error).message);
  }
}
