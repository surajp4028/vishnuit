"use client";
import { useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, BookOpen, Check, Moon, Palette, Loader2, MapPin, Megaphone, Images, Plus, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, btnDark, card, Field, ImagePick, input, Toggle } from "@/components/store/ui";
import { HIGHLIGHT_ICON_MAP, type HighlightIconKey } from "@/components/catalog/highlight-icons";

type Banner = { id: string; key: string; title: string; subtitle: string; cta: string; link: string };
export type Front = {
  banners: Banner[]; interval: number;
  bar: { on: boolean; items: string[] };
  highlights: { icon: HighlightIconKey; title: string; sub: string; on: boolean }[];
  map: { on: boolean; query: string; zoom: number };
  about: { images: string[]; heading: string };
  look: "sharp" | "minimal" | "soft";
  shipping: { cod: number; upi: number; razorpay: number; freeAbove: number; minOrder: number };
  closed: { on: boolean; message: string };
  pixels: { meta: string; ga: string };
  favicon: string | null;
};


const LOOKS: { k: Front["look"]; name: string; like: string; r: string; pill: string }[] = [
  { k: "sharp", name: "Sharp", like: "Bold & editorial — like Snitch, Zara", r: "0px", pill: "0px" },
  { k: "minimal", name: "Minimal", like: "Clean & familiar — like Myntra", r: "4px", pill: "4px" },
  { k: "soft", name: "Soft", like: "Friendly & rounded — gifts, plants, bakery", r: "18px", pill: "999px" },
];

function Section({ icon: Icon, title, sub, children }: { icon: typeof MapPin; title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className={cn(card, "p-4 sm:p-6")}>
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-accent/10 text-accent"><Icon className="size-5" /></span>
        <div><h2 className="font-display text-lg font-bold">{title}</h2><p className="text-[13px] text-muted">{sub}</p></div>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

/** Seller → Storefront: hero banners, announcement bar, 4 highlights and the contact map. */
export function StorefrontEditor({ initial, address, handle }: { initial: Front; address: string; handle: string }) {
  const [f, setF] = useState<Front>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const set = (x: Partial<Front>) => setF((p) => ({ ...p, ...x }));
  const setBanner = (id: string, x: Partial<Banner>) => set({ banners: f.banners.map((b) => (b.id === id ? { ...b, ...x } : b)) });
  const move = (i: number, d: number) => { const b = [...f.banners]; const j = i + d; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; set({ banners: b }); };
  const mapQ = f.map.query || address;

  async function save() {
    setBusy(true); setMsg(null);
    const r = await api<{ store: { storefront: Front } }>("/api/store/settings", "PATCH", { storefront: f });
    setBusy(false);
    if (r.ok) { setF(r.data.store.storefront); setMsg({ ok: true, t: "Saved — your store is updated." }); } else setMsg({ ok: false, t: r.data.error || "Could not save." });
  }

  return (
    <div className="space-y-4">
      <Section icon={Palette} title="Design style" sub="Changes the shape of every image, card and button on your store in one click.">
        <div className="grid gap-3 sm:grid-cols-3">
          {LOOKS.map((l) => (
            <button key={l.k} type="button" onClick={() => set({ look: l.k })} className={cn("relative rounded-2xl border-2 p-3 text-left transition", f.look === l.k ? "border-foreground" : "border-border hover:border-foreground/30")}>
              {f.look === l.k && <span className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full bg-foreground text-background"><Check className="size-3.5" /></span>}
              <div className="flex gap-2 rounded-xl bg-foreground/[.04] p-3">
                <div className="h-20 flex-1 bg-gradient-to-br from-amber-200 to-rose-300" style={{ borderRadius: l.r }} />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="h-2 w-4/5 rounded-full bg-foreground/30" /><div className="h-2 w-1/2 rounded-full bg-foreground/15" />
                  <div className="grid h-6 place-items-center bg-foreground text-[8px] font-bold tracking-wider text-background" style={{ borderRadius: l.pill }}>ADD TO BAG</div>
                </div>
              </div>
              <p className="mt-3 font-display font-bold">{l.name}{l.k === "sharp" && <span className="ml-2 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-700">RECOMMENDED</span>}</p>
              <p className="text-xs text-muted">{l.like}</p>
            </button>
          ))}
        </div>
      </Section>

      <Section icon={Images} title="Browser tab icon (favicon)" sub="The small square icon in the browser tab and bookmarks. Empty = your logo is used.">
        <div className="w-28"><ImagePick value={f.favicon} onChange={(k) => set({ favicon: k })} kind="logo" label="Square icon, 512×512" /></div>
      </Section>

      <Section icon={Moon} title="Store open / closed" sub="Going on a break? Close the store — shoppers can browse but not order.">
        <Toggle on={!f.closed.on} onChange={(v) => set({ closed: { ...f.closed, on: !v } })} label={f.closed.on ? "Store is CLOSED" : "Store is open for orders"} sub={f.closed.on ? "A notice shows on every page and checkout is paused" : "Shoppers can place orders"} />
        {f.closed.on && <input value={f.closed.message} maxLength={200} onChange={(e) => set({ closed: { ...f.closed, message: e.target.value } })} placeholder="e.g. We're on a short break till 25 Nov — orders open soon!" className={input} />}
      </Section>

      <Section icon={BarChart3} title="Tracking pixels" sub="Run Instagram/Facebook ads or see visitors in Google Analytics. Paste only the ID.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Meta Pixel ID" hint="15–16 digits from Events Manager"><input inputMode="numeric" value={f.pixels.meta} onChange={(e) => set({ pixels: { ...f.pixels, meta: e.target.value.replace(/\D/g, "") } })} placeholder="e.g. 1234567890123456" className={input} /></Field>
          <Field label="Google Analytics ID" hint="Looks like G-XXXXXXXXXX"><input value={f.pixels.ga} onChange={(e) => set({ pixels: { ...f.pixels, ga: e.target.value.toUpperCase().trim() } })} placeholder="G-XXXXXXXXXX" className={input} /></Field>
        </div>
      </Section>

      <Section icon={Megaphone} title="Announcement bar" sub="Black strip on top of your store that scrolls your offers — like “Free delivery above ₹999”.">
        <Toggle on={f.bar.on} onChange={(v) => set({ bar: { ...f.bar, on: v } })} label="Show announcement bar" sub={f.bar.on ? "Visible on every page" : "Hidden"} />
        {f.bar.items.map((t, i) => (
          <div key={i} className="flex gap-2">
            <input value={t} maxLength={120} onChange={(e) => set({ bar: { ...f.bar, items: f.bar.items.map((x, j) => (j === i ? e.target.value : x)) } })} placeholder={["Free delivery on orders above ₹999", "Use code FIRST10 for 10% off", "COD available across India"][i % 3]} className={input} />
            <button type="button" onClick={() => set({ bar: { ...f.bar, items: f.bar.items.filter((_, j) => j !== i) } })} aria-label="Remove message" className="grid size-12 shrink-0 place-items-center rounded-2xl text-red-500 hover:bg-red-500/10"><Trash2 className="size-4" /></button>
          </div>
        ))}
        {f.bar.items.length < 6 && <button type="button" onClick={() => set({ bar: { on: true, items: [...f.bar.items, ""] } })} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3 text-sm font-semibold text-muted hover:text-foreground"><Plus className="size-4" /> Add message</button>}
        <p className="text-xs text-muted">Tip: only mention coupon codes that you actually honour for your customers.</p>
      </Section>

      <Section icon={Images} title="Hero banners" sub="Add up to 6 banners — they slide automatically on your home page. Best size 2000 × 860.">
        {f.banners.map((b, i) => (
          <div key={b.id} className="rounded-2xl border border-border p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold tracking-[2px] text-muted">SLIDE {i + 1}</p>
              <div className="flex gap-1">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="grid size-8 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-30"><ArrowUp className="size-4" /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === f.banners.length - 1} aria-label="Move down" className="grid size-8 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-30"><ArrowDown className="size-4" /></button>
                <button type="button" onClick={() => set({ banners: f.banners.filter((x) => x.id !== b.id) })} aria-label="Delete slide" className="grid size-8 place-items-center rounded-full text-red-500 hover:bg-red-500/10"><Trash2 className="size-4" /></button>
              </div>
            </div>
            <ImagePick value={b.key} onChange={(k) => k && setBanner(b.id, { key: k })} kind="banner" label="Image" aspect="aspect-[21/9]" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input value={b.title} onChange={(e) => setBanner(b.id, { title: e.target.value })} placeholder="Heading (optional)" className={input} />
              <input value={b.subtitle} onChange={(e) => setBanner(b.id, { subtitle: e.target.value })} placeholder="Sub-heading (optional)" className={input} />
              <input value={b.cta} onChange={(e) => setBanner(b.id, { cta: e.target.value })} placeholder="Button text e.g. Shop now" className={input} />
              <input value={b.link} onChange={(e) => setBanner(b.id, { link: e.target.value })} placeholder={`Link e.g. /catalog/@${handle}/shop`} className={input} />
            </div>
          </div>
        ))}
        {f.banners.length < 6 && <NewBanner onAdd={(key) => set({ banners: [...f.banners, { id: `b${Date.now().toString(36)}`, key, title: "", subtitle: "", cta: "Shop now", link: "" }] })} />}
        {f.banners.length > 1 && (
          <Field label={`Change slide every ${f.interval} seconds`}><input type="range" min={2} max={15} value={f.interval} onChange={(e) => set({ interval: Number(e.target.value) })} className="w-full accent-foreground" /></Field>
        )}
      </Section>

      <Section icon={Sparkles} title="Store highlights" sub="The 4 promise cards under your banner. Pick an icon and write your own words.">
        <div className="grid gap-3 sm:grid-cols-2">
          {f.highlights.map((h, i) => {
            const upd = (x: Partial<Front["highlights"][number]>) => set({ highlights: f.highlights.map((y, j) => (j === i ? { ...y, ...x } : y)) });
            return (
              <div key={i} className={cn("space-y-2.5 rounded-2xl border border-border p-3", !h.on && "opacity-60")}>
                <div className="flex items-center justify-between"><p className="text-xs font-bold tracking-[2px] text-muted">CARD {i + 1}</p><button type="button" onClick={() => upd({ on: !h.on })} className={cn("rounded-full px-3 py-1 text-xs font-bold", h.on ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground/5 text-muted")}>{h.on ? "Visible" : "Hidden"}</button></div>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(HIGHLIGHT_ICON_MAP) as HighlightIconKey[]).map((k) => { const I = HIGHLIGHT_ICON_MAP[k]; return <button type="button" key={k} onClick={() => upd({ icon: k })} aria-label={k} className={cn("grid size-8 place-items-center rounded-lg border", h.icon === k ? "border-foreground bg-foreground text-background" : "border-border text-muted")}><I className="size-4" /></button>; })}
                </div>
                <input value={h.title} maxLength={40} onChange={(e) => upd({ title: e.target.value })} placeholder="Title" className={cn(input, "py-2.5")} />
                <input value={h.sub} maxLength={60} onChange={(e) => upd({ sub: e.target.value })} placeholder="Short line" className={cn(input, "py-2.5")} />
              </div>
            );
          })}
        </div>
      </Section>

      <Section icon={BookOpen} title="About page" sub="Add 1–2 photos of you, your workshop or your products — the layout adjusts automatically. Your story text is in Settings → Profile.">
        <Field label="Headline (optional)"><input value={f.about.heading} maxLength={120} onChange={(e) => set({ about: { ...f.about, heading: e.target.value } })} placeholder="e.g. Made by hand, in small batches" className={input} /></Field>
        <div className="grid grid-cols-2 gap-3">
          {[0, 1].map((n) => (
            <ImagePick key={n} value={f.about.images[n] ?? null} kind="banner" label={n ? "Photo 2 (optional)" : "Photo 1"} aspect="aspect-[4/5]"
              onChange={(k) => { const imgs = [...f.about.images]; if (k) imgs[n] = k; else imgs.splice(n, 1); set({ about: { ...f.about, images: imgs.filter(Boolean).slice(0, 2) } }); }} />
          ))}
        </div>
      </Section>

      <Section icon={MapPin} title="Map on contact page" sub="Shows your shop location with a zoomable Google map.">
        <Toggle on={f.map.on} onChange={(v) => set({ map: { ...f.map, on: v } })} label="Show map" />
        {f.map.on && (
          <>
            <Field label="Location to pin" hint={address ? "Leave empty to use the address from Settings → Profile" : "Add your shop address, area or a Google Maps place name"}><input value={f.map.query} onChange={(e) => set({ map: { ...f.map, query: e.target.value } })} placeholder={address || "e.g. Gandhi Nagar, Delhi 110031"} className={input} /></Field>
            <Field label={`Zoom: ${f.map.zoom}`} hint="Higher = closer"><input type="range" min={5} max={19} value={f.map.zoom} onChange={(e) => set({ map: { ...f.map, zoom: Number(e.target.value) } })} className="w-full accent-foreground" /></Field>
            {mapQ ? <iframe title="Map preview" src={`https://maps.google.com/maps?q=${encodeURIComponent(mapQ)}&z=${f.map.zoom}&output=embed`} className="aspect-[16/9] w-full rounded-2xl border border-border" loading="lazy" /> : <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-700">Add a location to show the map.</p>}
          </>
        )}
      </Section>

      <div className="sticky bottom-20 z-20 sm:bottom-4">
        {msg && <p className={cn("mb-2 rounded-2xl px-4 py-2.5 text-sm font-medium", msg.ok ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-500")}>{msg.t}</p>}
        <button onClick={save} disabled={busy} className={cn(btnDark, "w-full py-3.5 shadow-xl")}>{busy ? <Loader2 className="size-4 animate-spin" /> : "Save storefront"}</button>
      </div>
    </div>
  );
}

function NewBanner({ onAdd }: { onAdd: (key: string) => void }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-3">
      <ImagePick value={null} onChange={(k) => k && onAdd(k)} kind="banner" label="Add a slide" aspect="aspect-[21/7]" />
    </div>
  );
}
