import { headers } from "next/headers";
import { after } from "next/server";
import { exec } from "@/lib/server/db";
import { rateLimit } from "@/lib/server/auth";
import { sendMail, leadEmail } from "@/lib/server/mail";
import { appendLead } from "@/lib/server/gsheet";
import { sendMetaLead } from "@/lib/server/meta-capi";
import { getSettings } from "@/lib/server/content";
import { resolveLpPixel } from "@/lib/server/lp-pixels";

const clean = (v: unknown, max = 255) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const UTM = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "referrer"] as const;

export async function POST(req: Request) {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
  if (!rateLimit(`lp:${ip || "local"}`, 6, 10 * 60 * 1000)) return Response.json({ error: "Too many requests. Please try again shortly." }, { status: 429 });

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (clean(b.website)) return Response.json({ ok: true, id: 0 }); // honeypot

  const phoneDigits = clean(b.phone, 20).replace(/[^\d+]/g, "");
  const lead = {
    name: clean(b.name, 120),
    phone: phoneDigits,
    email: clean(b.email, 190).toLowerCase(),
    service: clean(b.service, 120),
    budget: clean(b.budget, 60),
    city: clean(b.city, 80),
    message: clean(b.message, 2000),
    page: clean(b.page, 255),
  };
  const utm = Object.fromEntries(UTM.map((k) => [k, clean(b[k], 300)]));

  if (lead.name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 422 });
  if (!/^(\+?91)?[6-9]\d{9}$/.test(lead.phone.replace(/^\+/, "+")) && !/^\+\d{8,15}$/.test(lead.phone))
    return Response.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 422 });
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return Response.json({ error: "Please enter a valid email." }, { status: 422 });

  let id: number | null = null;
  try {
    const r = await exec(
      "INSERT INTO leads (name,email,phone,service,budget,city,message,source,page,utm) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [lead.name, lead.email || "-", lead.phone, lead.service, lead.budget, lead.city, lead.message, `lp:${lead.page.replace(/^\//, "") || "landing"}`, lead.page, JSON.stringify(utm)],
    );
    id = r.insertId;
  } catch (e) {
    console.error("[lp-lead] db:", (e as Error).message);
  }

  const eventId = `lead_${id ?? Date.now()}`;
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  const cookies = Object.fromEntries((h.get("cookie") ?? "").split(/;\s*/).map((c) => c.split("=")));

  // Sheets, email and Meta CAPI run after the response so the visitor sees "thank you" instantly.
  after(async () => {
    const s = await getSettings();
    const sheet = await appendLead("lp", { id, ...lead, ...utm });
    const { html, text } = leadEmail({ ...lead, source: `Landing page ${lead.page}${utm.utm_campaign ? ` · ${utm.utm_campaign}` : ""}` });
    const mail = await sendMail({ to: process.env.CONTACT_TO_EMAIL || s.contact.email, subject: `🔥 New ad lead: ${lead.name} (${lead.phone})`, html, text, replyTo: lead.email || undefined });
    if (id) await exec("UPDATE leads SET emailed=?, notes=? WHERE id=?", [mail.ok ? 1 : 0, sheet.ok ? "Synced to Google Sheet" : `Sheet sync failed: ${sheet.error ?? ""}`.slice(0, 500), id]).catch(() => {});
    const pixel = await resolveLpPixel(lead.page.replace(/^\//, "").split(/[?#]/)[0] || null);
    await sendMetaLead({ pixel, eventId, url: `https://${host}${lead.page}`, email: lead.email, phone: lead.phone, name: lead.name, city: lead.city, ip, ua: h.get("user-agent") ?? undefined, fbp: cookies._fbp, fbc: cookies._fbc, service: lead.service });
  });

  return Response.json({ ok: true, id, eventId });
}
