import { ImageResponse } from "next/og";
import { getStoreByHandle } from "@/lib/server/catalog";
import { pngDataUrl } from "@/lib/server/og";

export const alt = "Store";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

/** WhatsApp / Instagram / Facebook preview card for a store link. */
export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  const name = s?.name ?? "Online store";
  const reviews = s?.testimonials.on ? s.testimonials.items.filter((t) => t.on) : [];
  const avg = reviews.length ? reviews.reduce((a, t) => a + t.rating, 0) / reviews.length : 0;
  const [logo, cover] = await Promise.all([pngDataUrl(s?.logo_key, 400), pngDataUrl(s?.storefront.banners[0]?.key ?? s?.banner_key, 700)]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0b0d12", color: "#fff", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 56px", width: cover ? 680 : 1200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {logo ? <img src={logo} alt="" style={{ height: 72, maxWidth: 220, objectFit: "contain", background: "#fff", borderRadius: 12, padding: 8 }} /> : <div style={{ display: "flex", width: 72, height: 72, borderRadius: 999, background: "#d4a017", color: "#0b0d12", fontSize: 40, fontWeight: 800, alignItems: "center", justifyContent: "center" }}>{name[0]}</div>}
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 6, color: "rgba(255,255,255,.55)" }}>SHOP ONLINE</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", fontSize: name.length > 18 ? 64 : 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>{name}</div>
            {s?.tagline && <div style={{ display: "flex", marginTop: 18, fontSize: 30, color: "rgba(255,255,255,.75)", lineHeight: 1.3 }}>{s.tagline.slice(0, 90)}</div>}
            {avg > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 28 }}>
                <div style={{ display: "flex", gap: 6 }}>{[1, 2, 3, 4, 5].map((k) => <svg key={k} width="40" height="40" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill={k <= Math.round(avg) ? "#fbbf24" : "rgba(255,255,255,.18)"} /></svg>)}</div>
                <div style={{ display: "flex", fontSize: 28, fontWeight: 700 }}>{avg.toFixed(1)}</div>
                <div style={{ display: "flex", fontSize: 24, color: "rgba(255,255,255,.6)" }}>· {reviews.length} reviews</div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", background: "#fff", color: "#0b0d12", padding: "14px 30px", fontSize: 24, fontWeight: 800, letterSpacing: 2 }}>SHOP NOW →</div>
            {s?.payments.cod && <div style={{ display: "flex", fontSize: 22, color: "rgba(255,255,255,.6)" }}>Cash on delivery available</div>}
          </div>
        </div>
        {cover && <img src={cover} alt="" style={{ width: 520, height: 630, objectFit: "cover" }} />}
      </div>
    ),
    size,
  );
}
