import "server-only";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

type MailOpts = { to: string; subject: string; html: string; text: string; replyTo?: string };

/** Sends with Resend; if Resend is missing or refuses (e.g. its test sender can't reach this address), falls back to ZeptoMail. */
export async function sendMail(opts: MailOpts): Promise<{ ok: boolean; error?: string }> {
  const r = await sendResend(opts);
  if (r.ok || !process.env.ZEPTO_MAIL || !process.env.ZEPTO_FROM_EMAIL) return r;
  const z = await sendZepto(opts);
  return z.ok ? z : { ok: false, error: `${r.error} | ${z.error}` };
}

async function sendZepto(opts: MailOpts) {
  const key = process.env.ZEPTO_MAIL!;
  try {
    const res = await fetch("https://api.zeptomail.in/v1.1/email", {
      method: "POST",
      headers: { Authorization: key.startsWith("Zoho-enczapikey") ? key : `Zoho-enczapikey ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        from: { address: process.env.ZEPTO_FROM_EMAIL, name: process.env.ZEPTO_FROM_NAME_VIT || "Vishnu IT Solutions" },
        to: [{ email_address: { address: opts.to } }],
        ...(opts.replyTo ? { reply_to: [{ address: opts.replyTo }] } : {}),
        subject: opts.subject,
        htmlbody: opts.html,
        textbody: opts.text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, error: `zepto ${res.status} ${(await res.text()).slice(0, 200)}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `zepto ${(e as Error).message}` };
  }
}

async function sendResend(opts: MailOpts): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY missing" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Vishnu IT Solutions <onboarding@resend.dev>",
        to: [opts.to],
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
        reply_to: opts.replyTo || undefined,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${await res.text()}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export function leadEmail(lead: Record<string, string | undefined>) {
  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Phone", lead.phone],
    ["Service", lead.service],
    ["Budget", lead.budget],
    ["Source", lead.source],
    ["Page", lead.page],
  ].filter(([, v]) => v);
  const html = `<!doctype html><html><body style="margin:0;background:#f5f3ef;font-family:Inter,Segoe UI,Arial,sans-serif">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
    <div style="background:linear-gradient(135deg,#0b0b0f,#3b2a17);padding:24px 28px;color:#fff">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d9b48a">New enquiry</div>
      <div style="font-size:22px;font-weight:700;margin-top:6px">${esc(lead.name)} wants to work with you</div>
    </div>
    <table style="width:100%;border-collapse:collapse;padding:8px 28px">
      ${rows.map(([k, v]) => `<tr><td style="padding:10px 28px;color:#888;font-size:13px;width:110px">${k}</td><td style="padding:10px 28px 10px 0;font-size:14px;color:#111">${esc(v)}</td></tr>`).join("")}
    </table>
    <div style="margin:8px 28px 28px;padding:16px;background:#faf8f5;border-radius:12px;font-size:14px;color:#222;white-space:pre-wrap">${esc(lead.message)}</div>
  </div></body></html>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n") + `\n\n${lead.message ?? ""}`;
  return { html, text };
}
