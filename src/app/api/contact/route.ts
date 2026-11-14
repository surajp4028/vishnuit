import { headers } from "next/headers";
import { exec } from "@/lib/server/db";
import { sendMail, leadEmail } from "@/lib/server/mail";
import { rateLimit } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/content";
import { appendLead } from "@/lib/server/gsheet";

const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request) {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!rateLimit(`contact:${ip}`, 6, 10 * 60 * 1000)) {
    return Response.json({ error: "Too many requests. Please try again in a few minutes." }, { status: 429 });
  }
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
  if (clean(body.website)) return Response.json({ ok: true }); // honeypot

  const lead = {
    name: clean(body.name, 120),
    email: clean(body.email, 190).toLowerCase(),
    phone: clean(body.phone, 40),
    service: clean(body.service, 120),
    budget: clean(body.budget, 60),
    message: clean(body.message, 5000),
    source: clean(body.source, 60) || "contact",
    page: clean(body.page, 255),
  };
  if (lead.name.length < 2) return Response.json({ error: "Please enter your name." }, { status: 422 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lead.email)) return Response.json({ error: "Please enter a valid email." }, { status: 422 });
  if (lead.phone && !/^[+\d][\d\s-]{6,}$/.test(lead.phone)) return Response.json({ error: "Please enter a valid phone number." }, { status: 422 });
  if (lead.message.length < 5) return Response.json({ error: "Please tell us a bit about your project." }, { status: 422 });

  let id: number | null = null;
  try {
    const r = await exec(
      "INSERT INTO leads (name,email,phone,service,budget,message,source,page) VALUES (?,?,?,?,?,?,?,?)",
      [lead.name, lead.email, lead.phone, lead.service, lead.budget, lead.message, lead.source, lead.page],
    );
    id = r.insertId;
  } catch (e) {
    console.error("[contact] could not save lead:", (e as Error).message);
  }

  const settings = await getSettings();
  let emailed = false;
  if (settings.conversion.leadNotify !== false) {
    const to = process.env.CONTACT_TO_EMAIL || settings.contact.email;
    const { html, text } = leadEmail(lead);
    const res = await sendMail({ to, subject: `New enquiry: ${lead.name}${lead.service ? ` — ${lead.service}` : ""}`, html, text, replyTo: lead.email });
    emailed = res.ok;
    if (!res.ok) console.error("[contact] email failed:", res.error);
    if (id && emailed) await exec("UPDATE leads SET emailed=1 WHERE id=?", [id]).catch(() => {});
  }

  await appendLead("site", { id, ...lead });

  if (!id && !emailed) return Response.json({ error: "Something went wrong. Please WhatsApp or call us." }, { status: 500 });
  return Response.json({ ok: true });
}
