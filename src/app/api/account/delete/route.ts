import { mainSiteOnly } from "@/lib/server/hosts";
import { exec, queryOne } from "@/lib/server/db";
import { deleteObject, payeePath, s3Configured } from "@/lib/server/s3";
import { endSession, getUser } from "@/lib/server/users";

const OPEN = "status NOT IN ('delivered','cancelled','returned')";

/**
 * Delete my account (DPDP Act 2023 — right to erasure).
 * The person is anonymised, not hard-deleted: invoices, payments and order rows stay for legal/tax retention
 * (GST & Income-tax law), but no longer link to a name, email, phone, photo or login.
 */
export async function POST(req: Request) {
  const notHere = await mainSiteOnly();
  if (notHere) return notHere;
  const u = await getUser();
  if (!u) return Response.json({ error: "Please log in." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as { confirm?: unknown };
  if (b.confirm !== "DELETE") return Response.json({ error: 'Type DELETE to confirm.' }, { status: 422 });

  // Things that must be settled first.
  const store = await queryOne<{ id: number; name: string; plan: string; paid_left: number }>(
    "SELECT id, name, plan, (plan<>'free' AND plan_expires_at IS NOT NULL AND plan_expires_at>NOW()) paid_left FROM stores WHERE user_id=?",
    [u.id],
  );
  if (store && Number(store.paid_left)) {
    return Response.json({ error: `Your store "${store.name}" still has paid plan time left. Please contact us to close the store (and discuss any refund) before deleting your account.` }, { status: 409 });
  }
  if (store) {
    const sold = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM store_orders WHERE store_id=? AND created_at>DATE_SUB(NOW(), INTERVAL 30 DAY) AND ${OPEN}`, [store.id]);
    if (Number(sold?.n)) return Response.json({ error: `Your store has ${sold!.n} order(s) from the last 30 days that aren't delivered or cancelled yet. Please complete or cancel them first.` }, { status: 409 });
  }
  const bought = await queryOne<{ n: number }>(`SELECT COUNT(*) n FROM store_orders WHERE customer_id=? AND created_at>DATE_SUB(NOW(), INTERVAL 30 DAY) AND ${OPEN}`, [u.id]);
  if (Number(bought?.n)) return Response.json({ error: `You have ${bought!.n} order(s) from the last 30 days that aren't delivered or cancelled yet. Please wait for them to be delivered (or cancel them with the seller) first.` }, { status: 409 });

  // Anonymise. status='deleted' also makes every existing session invalid (getUser only accepts 'active').
  await exec(
    "UPDATE users SET name='Deleted user', email=NULL, phone=NULL, password_hash=NULL, google_sub=NULL, avatar_key=NULL, company=NULL, status='deleted', session_ver=session_ver+1 WHERE id=?",
    [u.id],
  );
  await exec("UPDATE user_tokens SET used_at=NOW() WHERE user_id=? AND used_at IS NULL", [u.id]).catch(() => {});
  // A free / expired store with no owner left is hidden (not deleted: its past orders and invoices are kept).
  if (store) await exec("UPDATE stores SET status='suspended' WHERE id=?", [store.id]).catch(() => {});
  if (s3Configured() && u.avatar_key?.startsWith(payeePath(u.uid, "avatar-"))) await deleteObject(u.avatar_key).catch(() => {});

  await endSession();
  return Response.json({ ok: true });
}
