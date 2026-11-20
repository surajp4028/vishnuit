import { ImageResponse } from "next/og";
import { queryOne } from "@/lib/server/db";
import { getStoreByHandle, hydrateProduct } from "@/lib/server/catalog";
import { pngDataUrl } from "@/lib/server/og";

export const alt = "Product";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const inr = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

/** Product preview card for WhatsApp etc.: photo + name + price + % off. */
export default async function Image({ params }: { params: Promise<{ handle: string; slug: string }> }) {
  const { handle, slug } = await params;
  const s = await getStoreByHandle(handle);
  const r = s ? await queryOne<Record<string, unknown>>("SELECT * FROM store_products WHERE store_id=? AND slug=? AND status='active'", [s.id, decodeURIComponent(slug)]) : null;
  const p = r ? hydrateProduct(r) : null;
  const photo = await pngDataUrl(p?.images[0], 700);
  const off = p?.compare_price && p.compare_price > p.price ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#fff", color: "#0b0d12", fontFamily: "sans-serif" }}>
        {photo ? <img src={photo} alt="" style={{ width: 500, height: 630, objectFit: "cover" }} /> : <div style={{ display: "flex", width: 500, height: 630, background: "#f1f1f4" }} />}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "60px 56px", width: 700 }}>
          <div style={{ display: "flex", fontSize: 24, letterSpacing: 6, color: "#6b7280" }}>{(s?.name ?? "").toUpperCase()}</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: (p?.name.length ?? 0) > 30 ? 52 : 64, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>{p?.name ?? "Product"}</div>
            {p && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 26 }}>
                <div style={{ display: "flex", fontSize: 60, fontWeight: 800 }}>{inr(p.price)}</div>
                {off > 0 && <div style={{ display: "flex", fontSize: 32, color: "#9ca3af", textDecoration: "line-through" }}>{inr(p.compare_price!)}</div>}
                {off > 0 && <div style={{ display: "flex", fontSize: 32, fontWeight: 800, color: "#ff3f6c" }}>{off}% OFF</div>}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", background: "#0b0d12", color: "#fff", padding: "14px 30px", fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>BUY NOW →</div>
            {s?.payments.cod && <div style={{ display: "flex", fontSize: 22, color: "#6b7280" }}>COD available</div>}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
