import { consumeToken, findOrCreateUser, normPhone, publicUser, startSession } from "@/lib/server/users";

/** Verifies the SMS code; signs in (creating the account if this number is new). */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as Record<string, string>;
  const phone = normPhone(b.phone);
  const code = String(b.code ?? "").replace(/\D/g, "");
  if (!phone || code.length !== 6) return Response.json({ error: "Enter the 6-digit code." }, { status: 422 });
  const t = await consumeToken("otp", phone, code);
  if (!t) return Response.json({ error: "Wrong or expired code. Please try again." }, { status: 401 });
  const u = await findOrCreateUser({ phone, source: "otp" });
  await startSession(u);
  return Response.json({ ok: true, user: publicUser(u) });
}
