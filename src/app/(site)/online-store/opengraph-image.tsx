import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSettings } from "@/lib/server/content";

export const alt = "Vishnu Stores — your own online store in 5 minutes";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** WhatsApp / Facebook preview for /online-store — about the store builder, not the agency. */
/** The site's heading font (bold); if it can't be fetched the card still renders in the default font. */
async function jakarta(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700&display=swap", { signal: AbortSignal.timeout(4000) }).then((r) => r.text());
    const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
    return url ? await fetch(url, { signal: AbortSignal.timeout(4000) }).then((r) => r.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const font = await jakarta();
  // "-white" logo files are the ones made for white backgrounds.
  const lp = (await getSettings().catch(() => null))?.branding.logoLight ?? "/brand/vishnuit-vishnu-logo-white.png";
  const logo = await readFile(path.join(process.cwd(), "public", path.normalize(lp).replace(/^(\.\.[/\\])+/, ""))).then((b) => `data:image/png;base64,${b.toString("base64")}`).catch(() => null);
  const ticks = ["Free plan", "0% commission", "COD & UPI", "GST invoices", "Your own domain"];
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", background: "linear-gradient(160deg,#ffffff 0%,#f4f7ff 60%,#fff8e6 100%)", color: "#0a0f1f", fontFamily: font ? "Jakarta" : "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {logo ? <img src={logo} alt="" style={{ height: 76 }} /> : <div style={{ display: "flex", fontSize: 30, fontWeight: 800 }}>Vishnu IT Solutions</div>}
          <div style={{ display: "flex", padding: "10px 22px", borderRadius: 999, background: "#1d4ed8", color: "#fff", fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>VISHNU STORES</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2 }}>Your own online store</div>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 800, lineHeight: 1.04, letterSpacing: -2, color: "#1d4ed8" }}>
            in 5 minutes<span style={{ color: "#d4a017" }}>.</span>
          </div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 30, color: "#475069" }}>Sell on Instagram & WhatsApp with a real store link.</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {ticks.map((t) => (
            <div key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 20px", borderRadius: 999, background: "#fff", border: "2px solid #e3e8f4", fontSize: 24, fontWeight: 600 }}>
              <svg width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#10b981" /><path d="M7 12.5l3.2 3.2L17 9" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>{t}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Jakarta", data: font, weight: 700, style: "normal" }] : undefined },
  );
}
