import { queryOne } from "@/lib/server/db";
import { signedUrl } from "@/lib/server/s3";
import { getUser } from "@/lib/server/users";
import { invoicePath } from "@/lib/server/invoice";

/** Opens the logged-in user's invoice: the PDF saved in S3, or the web invoice as a fallback. */
export async function GET(_req: Request, { params }: { params: Promise<{ order: string }> }) {
  const u = await getUser();
  if (!u) return new Response("Please log in", { status: 401 });
  const orderId = decodeURIComponent((await params).order);
  const p = await queryOne<{ invoice_key: string | null; status: string; id: number }>(
    "SELECT id, invoice_key, status FROM payments WHERE rzp_order_id=? AND user_id=?", [orderId, u.id]);
  if (!p || p.status !== "paid") return new Response("Not found", { status: 404 });
  const to = p.invoice_key ? await signedUrl(p.invoice_key, 300, `Vishnu-IT-invoice-${p.id}.pdf`) : invoicePath(orderId);
  return new Response(null, { status: 302, headers: { Location: to, "Cache-Control": "no-store" } });
}
