import { getStoreByHandle, quoteOrder } from "@/lib/server/catalog";
import { priceCart } from "@/lib/server/cart-pricing";
import { GST_STATES } from "@/lib/gst-states";

/**
 * Live checkout total from the server: today's prices from the database, stock, delivery and GST —
 * exactly what the order will charge, so the UPI amount and the bill always match.
 */
export async function POST(req: Request, { params }: { params: Promise<{ handle: string }> }) {
  const store = await getStoreByHandle((await params).handle);
  if (!store) return Response.json({ error: "Store not found." }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as { items?: unknown; state?: unknown; method?: unknown };
  const priced = await priceCart(store, b.items);
  if ("error" in priced) return Response.json({ error: priced.error }, { status: priced.status });
  const state = GST_STATES.some(([c]) => c === b.state) ? String(b.state) : null;
  const method = b.method === "upi" || b.method === "razorpay" ? b.method : "cod";
  const quote = quoteOrder(priced.items, store, state, method);
  return Response.json({ quote, prices: priced.items.map((i) => ({ id: i.id, variant: i.variant, price: i.price, gst: i.gst_rate })) }, { headers: { "Cache-Control": "no-store" } });
}
