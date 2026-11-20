import { exec, query } from "@/lib/server/db";
import { sendMail } from "@/lib/server/mail";
import { getCatalogConfig, GRACE_DAYS, type PlanKey } from "@/lib/server/catalog";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Row = { id: number; name: string; handle: string; plan: PlanKey; plan_expires_at: string; reminder_sent_at: string | null; email: string | null; owner: string };

/**
 * Runs daily (vercel.json cron). Emails store owners:
 *  1) ~30 days before their plan ends (once), and
 *  2) the day it ends — the store keeps paid limits for 15 more days, then drops to Free.
 * Protected by CRON_SECRET (Vercel sends it as a Bearer token).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return new Response("Unauthorized", { status: 401 });
  const { plans } = await getCatalogConfig();
  const link = `${siteUrl()}/seller/billing`;
  const card = (title: string, body: string) =>
    `<div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:24px auto;border:1px solid #e6e8ef;border-radius:16px;overflow:hidden"><div style="background:#0a0f1f;color:#fff;padding:22px 26px;font-size:20px;font-weight:700">${title}</div><div style="padding:22px 26px;font-size:14px;color:#333;line-height:1.6">${body}<p style="margin:22px 0 4px"><a href="${link}" style="background:#0a0f1f;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:600">Renew my plan</a></p><p style="color:#667;font-size:12px">You can renew for 1, 2, 3 or 4 years at once.</p></div></div>`;

  const soon = await query<Row>(
    `SELECT s.id, s.name, s.handle, s.plan, s.plan_expires_at, s.reminder_sent_at, u.email, u.name owner FROM stores s JOIN users u ON u.id=s.user_id
     WHERE s.plan<>'free' AND s.plan_expires_at BETWEEN NOW() AND NOW() + INTERVAL 30 DAY AND s.reminder_sent_at IS NULL LIMIT 500`,
  );
  const ended = await query<Row>(
    `SELECT s.id, s.name, s.handle, s.plan, s.plan_expires_at, s.reminder_sent_at, u.email, u.name owner FROM stores s JOIN users u ON u.id=s.user_id
     WHERE s.plan<>'free' AND s.plan_expires_at < NOW() AND s.plan_expires_at > NOW() - INTERVAL ${GRACE_DAYS} DAY
       AND (s.reminder_sent_at IS NULL OR s.reminder_sent_at < s.plan_expires_at) LIMIT 500`,
  );
  let sent = 0;
  const fmt = (d: string | Date) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  for (const r of soon) {
    if (r.email) {
      const ok = await sendMail({
        to: r.email,
        subject: `Your ${plans[r.plan].name} plan for ${r.name} ends on ${fmt(r.plan_expires_at)}`,
        text: `Hi ${r.owner || "there"}, your ${plans[r.plan].name} plan for ${r.name} ends on ${fmt(r.plan_expires_at)}. Renew here: ${link}`,
        html: card("Your plan is ending soon", `<p>Hi ${r.owner || "there"},</p><p>Your <b>${plans[r.plan].name}</b> plan for <b>${r.name}</b> (vishnuit.co.in/catalog/@${r.handle}) ends on <b>${fmt(r.plan_expires_at)}</b>.</p><p>Renew now to keep your product limit and online payments without a break.</p>`),
      });
      if (ok.ok) sent++;
    }
    await exec("UPDATE stores SET reminder_sent_at=NOW() WHERE id=?", [r.id]);
  }
  for (const r of ended) {
    if (r.email) {
      const until = new Date(new Date(r.plan_expires_at).getTime() + GRACE_DAYS * 86400000);
      const ok = await sendMail({
        to: r.email,
        subject: `Your plan for ${r.name} has ended — renew within ${GRACE_DAYS} days`,
        text: `Your ${plans[r.plan].name} plan ended. Your store keeps working until ${fmt(until)}, then moves to the Free plan (${plans.free.limit} products). Renew: ${link}`,
        html: card("Your plan has ended", `<p>Hi ${r.owner || "there"},</p><p>Your <b>${plans[r.plan].name}</b> plan for <b>${r.name}</b> ended on ${fmt(r.plan_expires_at)}.</p><p>Your store keeps its current limits until <b>${fmt(until)}</b>. After that it moves to the Free plan (${plans.free.limit} products) and online payments switch off.</p>`),
      });
      if (ok.ok) sent++;
    }
    await exec("UPDATE stores SET reminder_sent_at=NOW() WHERE id=?", [r.id]);
  }
  return Response.json({ ok: true, endingSoon: soon.length, ended: ended.length, emailsSent: sent });
}
