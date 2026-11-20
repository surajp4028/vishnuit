import { consumeToken, findOrCreateUser, normEmail, normPhone, publicUser, startSession } from "@/lib/server/users";

/** Verifies the code sent by SMS or email; signs in (creating the account if this number/email is new). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const raw = String(b.id ?? b.phone ?? b.email ?? "").trim();
  const email = normEmail(raw);
  const phone = email ? null : normPhone(raw);
  const code = String(b.code ?? "").replace(/\D/g, "");
  if ((!email && !phone) || code.length !== 6) return Response.json({ error: "Enter the 6-digit code." }, { status: 422 });
  const t = await consumeToken("otp", (email ?? phone)!, code);
  if (!t) return Response.json({ error: "Wrong or expired code. Please try again." }, { status: 401 });
  const u = await findOrCreateUser(email ? { email, source: "otp" } : { phone, source: "otp" });
  await startSession(u);
  return Response.json({ ok: true, user: publicUser(u) });
}
