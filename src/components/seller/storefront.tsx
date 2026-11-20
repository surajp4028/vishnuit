"use client";
import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, BarChart3, BookOpen, Check, ChevronDown, Moon, Palette, Loader2, MapPin, Megaphone, Images, Plus, Settings2, Sparkles, Star, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { api, btnDark, card, Field, ImagePick, imgUrl, input, Toggle } from "@/components/store/ui";
import { HIGHLIGHT_ICON_MAP, type HighlightIconKey } from "@/components/catalog/highlight-icons";

type Banner = { id: string; key: string; title: string; subtitle: string; cta: string; link: string };
export type Front = {
  banners: Banner[]; interval: number;
  bar: { on: boolean; items: string[] };
  highlights: { icon: HighlightIconKey; title: string; sub: string; on: boolean }[];
  map: { on: boolean; query: string; zoom: number };
  about: { images: string[]; heading: string; home?: boolean };
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

type TabKey = "design" | "banners" | "offers" | "reviews" | "about" | "more";
export type Reviews = { on: boolean; items: { id: string; name: string; place: string; text: string; rating: number; on: boolean }[] };
const TABS: { k: TabKey; label: string; icon: typeof MapPin }[] = [
  { k: "banners", label: "Banners", icon: Images },
  { k: "offers", label: "Offers & highlights", icon: Megaphone },
  { k: "reviews", label: "Reviews", icon: Star },
  { k: "design", label: "Design", icon: Palette },
  { k: "about", label: "About & map", icon: BookOpen },
  { k: "more", label: "More", icon: Settings2 },
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
export function StorefrontEditor({ initial, address, handle, reviews, initialTab, about }: { initial: Front; address: string; handle: string; reviews: Reviews; initialTab?: string; about: string }) {
  const [story, setStory] = useState(about);
  const [f, setF] = useState<Front>(initial);
  const [rv, setRv] = useState<Reviews>(reviews);
  const [openReview, setOpenReview] = useState<string | null>(null);
  const setReview = (id: string, x: Partial<Reviews["items"][number]>) => setRv((p) => ({ ...p, items: p.items.map((t) => (t.id === id ? { ...t, ...x } : t)) }));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [tab, setTab] = useState<TabKey>("banners");
  const [openBanner, setOpenBanner] = useState<string | null>(null);
  // Remember the last tab (per browser) so coming back lands where you were.
  useEffect(() => {
    if (initialTab && TABS.some((x) => x.k === initialTab)) { setTab(initialTab as TabKey); return; }
    try { const t = localStorage.getItem("vit-storefront-tab") as TabKey | null; if (t && TABS.some((x) => x.k === t)) setTab(t); } catch {}
  }, [initialTab]);
  const pick = (t: TabKey) => { setTab(t); try { localStorage.setItem("vit-storefront-tab", t); } catch {} };
  const set = (x: Partial<Front>) => setF((p) => ({ ...p, ...x }));
  const setBanner = (id: string, x: Partial<Banner>) => set({ banners: f.banners.map((b) => (b.id === id ? { ...b, ...x } : b)) });
  const move = (i: number, d: number) => { const b = [...f.banners]; const j = i + d; if (j < 0 || j >= b.length) return; [b[i], b[j]] = [b[j], b[i]]; set({ banners: b }); };
  const mapQ = f.map.query || address;

  async function save() {
    setBusy(true); setMsg(null);
    const r = await api<{ store: { storefront: Front; testimonials?: Reviews; about?: string } }>("/api/store/settings", "PATCH", { storefront: f, testimonials: rv, about: story });
    setBusy(false);
    if (r.ok) { setF(r.data.store.storefront); if (r.data.store.testimonials) setRv(r.data.store.testimonials); if (typeof r.data.store.about === "string") setStory(r.data.store.about); setMsg({ ok: true, t: "Saved — your store is updated." }); } else setMsg({ ok: false, t: r.data.error || "Could not save." });
  }

  return (
    <div className="space-y-4">
      {/* One part at a time instead of a very long page. Everything still saves together. */}
      <nav className="sticky top-14 z-20 -mx-1 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card/95 p-1 backdrop-blur [scrollbar-width:none] md:top-[4.5rem]">
        {TABS.map((t) => (
          <button key={t.k} type="button" ref={(el) => { if (el && tab === t.k) el.scrollIntoView({ block: "nearest", inline: "nearest" }); }} onClick={() => pick(t.k)} className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-semibold transition", tab === t.k ? "bg-foreground text-background" : "text-muted hover:bg-foreground/5 hover:text-foreground")}>
            <t.icon className="size-4" />{t.label}{(t.k === "banners" ? f.banners.length : t.k === "reviews" ? rv.items.length : 0) > 0 && <span className={cn("rounded-full px-1.5 text-[10px]", tab === t.k ? "bg-background/20" : "bg-foreground/10")}>{t.k === "banners" ? f.banners.length : rv.items.length}</span>}
          </button>
        ))}
      </nav>
      {tab === "design" && (
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
      )}

      {tab === "design" && (
        <Section icon={Images} title="Browser tab icon (favicon)" sub="The small square icon in the browser tab and bookmarks. Empty = your logo is used.">
          <div className="w-28"><ImagePick value={f.favicon} onChange={(k) => set({ favicon: k })} kind="logo" label="Square icon, 512×512" /></div>
        </Section>
      )}

      {tab === "more" && (
        <Section icon={Moon} title="Store open / closed" sub="Going on a break? Close the store — shoppers can browse but not order.">
          <Toggle on={!f.closed.on} onChange={(v) => set({ closed: { ...f.closed, on: !v } })} label={f.closed.on ? "Store is CLOSED" : "Store is open for orders"} sub={f.closed.on ? "A notice shows on every page and checkout is paused" : "Shoppers can place orders"} />
          {f.closed.on && <input value={f.closed.message} maxLength={200} onChange={(e) => set({ closed: { ...f.closed, message: e.target.value } })} placeholder="e.g. We're on a short break till 25 Nov — orders open soon!" className={input} />}
        </Section>
      )}

      {tab === "more" && (
        <Section icon={BarChart3} title="Tracking pixels" sub="Run Instagram/Facebook ads or see visitors in Google Analytics. Paste only the ID.">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Meta Pixel ID" hint="15–16 digits from Events Manager"><input inputMode="numeric" value={f.pixels.meta} onChange={(e) => set({ pixels: { ...f.pixels, meta: e.target.value.replace(/\D/g, "") } })} placeholder="e.g. 1234567890123456" className={input} /></Field>
            <Field label="Google Analytics ID" hint="Looks like G-XXXXXXXXXX"><input value={f.pixels.ga} onChange={(e) => set({ pixels: { ...f.pixels, ga: e.target.value.toUpperCase().trim() } })} placeholder="G-XXXXXXXXXX" className={input} /></Field>
          </div>
        </Section>
      )}

      {tab === "offers" && (
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
      )}

      {tab === "banners" && (
        <Section icon={Images} title="Hero banners" sub="Up to 10 slides — they slide automatically on your home page. Tap a slide to edit it. Best size 2000 × 860.">
          {f.banners.map((b, i) => {
            const open = openBanner === b.id;
            return (
              <div key={b.id} className={cn("rounded-2xl border transition", open ? "border-foreground/30 shadow-sm" : "border-border")}>
                {/* compact row: thumbnail, slide no., heading, reorder, edit, delete */}
                <div className="flex items-center gap-3 p-2 sm:p-2.5">
                  <button type="button" onClick={() => setOpenBanner(open ? null : b.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl(b.key)!} alt="" className="aspect-[21/9] w-24 shrink-0 rounded-lg bg-foreground/5 object-cover sm:w-32" />
                    <span className="min-w-0">
                      <span className="block text-[10.5px] font-bold tracking-[2px] text-muted">SLIDE {i + 1}</span>
                      <span className="block truncate text-sm font-semibold">{b.title || <span className="font-normal text-muted">No heading</span>}</span>
                      <span className="block truncate text-xs text-muted">{b.cta ? `${b.cta} → ${b.link || "Shop"}` : "No button"}</span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="hidden size-8 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-25 sm:grid"><ArrowUp className="size-4" /></button>
                    <button type="button" onClick={() => move(i, 1)} disabled={i === f.banners.length - 1} aria-label="Move down" className="hidden size-8 place-items-center rounded-full hover:bg-foreground/5 disabled:opacity-25 sm:grid"><ArrowDown className="size-4" /></button>
                    <button type="button" onClick={() => setOpenBanner(open ? null : b.id)} aria-label={open ? "Close" : "Edit slide"} className="grid size-8 place-items-center rounded-full hover:bg-foreground/5"><ChevronDown className={cn("size-4 transition", open && "rotate-180")} /></button>
                  </div>
                </div>
                {open && (
                  <div className="space-y-3 border-t border-border p-3 sm:p-4">
                    <ImagePick value={b.key} onChange={(k) => k && setBanner(b.id, { key: k })} kind="banner" label="Image" aspect="aspect-[21/9]" />
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input value={b.title} onChange={(e) => setBanner(b.id, { title: e.target.value })} placeholder="Heading (optional)" className={input} />
                      <input value={b.subtitle} onChange={(e) => setBanner(b.id, { subtitle: e.target.value })} placeholder="Sub-heading (optional)" className={input} />
                      <input value={b.cta} onChange={(e) => setBanner(b.id, { cta: e.target.value })} placeholder="Button text e.g. Shop now" className={input} />
                      <input value={b.link} onChange={(e) => setBanner(b.id, { link: e.target.value })} placeholder={`Link e.g. /catalog/@${handle}/shop`} className={input} />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-30 sm:hidden"><ArrowUp className="size-3.5" />Move up</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === f.banners.length - 1} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-30 sm:hidden"><ArrowDown className="size-3.5" />Move down</button>
                      <button type="button" onClick={() => { if (confirm(`Delete slide ${i + 1}?`)) { set({ banners: f.banners.filter((x) => x.id !== b.id) }); setOpenBanner(null); } }} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10"><Trash2 className="size-3.5" />Delete slide</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {f.banners.length < 10 ? <NewBanner onAdd={(key) => { const id = `b${Date.now().toString(36)}`; set({ banners: [...f.banners, { id, key, title: "", subtitle: "", cta: "Shop now", link: "" }] }); setOpenBanner(id); }} /> : <p className="text-center text-xs text-muted">10 slides is the maximum — delete one to add another.</p>}
          {f.banners.length > 1 && (
            <Field label={`Change slide every ${f.interval} seconds`}><input type="range" min={2} max={15} value={f.interval} onChange={(e) => set({ interval: Number(e.target.value) })} className="w-full accent-foreground" /></Field>
          )}
        </Section>
      )}

      {tab === "offers" && (
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
      )}

      {tab === "about" && (
        <Section icon={BookOpen} title="About your store" sub="Headline, your story and 1–2 photos. Shown as “Our story” on your home page and on the About page.">
          <Toggle on={f.about.home !== false} onChange={(v) => set({ about: { ...f.about, home: v } })} label="Show “Our story” on my home page" sub={f.about.home !== false ? "On — shoppers see it near the bottom of your home page" : "Off — it stays only on your About page"} />
          <Field label="Headline (optional)"><input value={f.about.heading} maxLength={120} onChange={(e) => set({ about: { ...f.about, heading: e.target.value } })} placeholder="e.g. Made by hand, in small batches" className={input} /></Field>
          <Field label="Your story" hint="Who you are, what you make, why shoppers will love it. A blank line starts a new paragraph — the home page shows the first one.">
            <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={7} maxLength={8000} placeholder={"e.g. Pandey Fashion started in 2018 in Delhi with one small shop…\n\nToday we design festive and everyday wear…"} className={cn(input, "resize-y leading-relaxed")} />
            <span className="mt-1 block text-right text-[11px] text-muted">{story.length}/8000</span>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            {[0, 1].map((n) => (
              <ImagePick key={n} value={f.about.images[n] ?? null} kind="banner" label={n ? "Photo 2 (optional)" : "Photo 1"} aspect="aspect-[4/5]"
                onChange={(k) => { const imgs = [...f.about.images]; if (k) imgs[n] = k; else imgs.splice(n, 1); set({ about: { ...f.about, images: imgs.filter(Boolean).slice(0, 2) } }); }} />
            ))}
          </div>
        </Section>
      )}

      {tab === "about" && (
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
      )}

      {tab === "reviews" && (
        <Section icon={Star} title="Customer reviews" sub="Shown as scrolling cards on your home page. Turn single reviews on or off any time.">
          <Toggle on={rv.on} onChange={(v) => setRv((p) => ({ ...p, on: v }))} label="Show reviews on my store" sub={rv.on ? `${rv.items.filter((t) => t.on).length} visible on your home page` : "Off — the section is hidden from shoppers"} />
          {rv.items.map((t, i) => {
            const open = openReview === t.id;
            return (
              <div key={t.id} className={cn("rounded-2xl border transition", open ? "border-foreground/30 shadow-sm" : "border-border", !t.on && !open && "opacity-60")}>
                <div className="flex items-center gap-3 p-2.5 sm:p-3">
                  <button type="button" onClick={() => setOpenReview(open ? null : t.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-[12px] font-bold text-background">{(t.name || "?").split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{t.name || <span className="font-normal text-muted">Review {i + 1}</span>}{t.place && <span className="font-normal text-muted"> · {t.place}</span>}</span>
                      <span className="flex items-center gap-1.5"><span className="flex shrink-0">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={cn("size-3", n <= t.rating ? "fill-amber-400 text-amber-400" : "text-foreground/15")} />)}</span><span className="truncate text-xs text-muted">{t.text || "No text yet"}</span></span>
                    </span>
                  </button>
                  <button type="button" onClick={() => setReview(t.id, { on: !t.on })} className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold", t.on ? "bg-emerald-500/10 text-emerald-600" : "bg-foreground/5 text-muted")}>{t.on ? "Visible" : "Hidden"}</button>
                  <button type="button" onClick={() => setOpenReview(open ? null : t.id)} aria-label={open ? "Close" : "Edit review"} className="grid size-8 shrink-0 place-items-center rounded-full hover:bg-foreground/5"><ChevronDown className={cn("size-4 transition", open && "rotate-180")} /></button>
                </div>
                {open && (
                  <div className="space-y-3 border-t border-border p-3 sm:p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input value={t.name} onChange={(e) => setReview(t.id, { name: e.target.value })} placeholder="Customer name" className={input} />
                      <input value={t.place} onChange={(e) => setReview(t.id, { place: e.target.value })} placeholder="City (optional)" className={input} />
                    </div>
                    <textarea value={t.text} onChange={(e) => setReview(t.id, { text: e.target.value })} rows={3} placeholder="What did they say?" className={cn(input, "resize-y text-sm")} />
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex items-center">{[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} onClick={() => setReview(t.id, { rating: n })} aria-label={`${n} stars`} className="p-1"><Star className={cn("size-5", n <= t.rating ? "fill-amber-400 text-amber-400" : "text-foreground/20")} /></button>)}</span>
                      <button type="button" onClick={() => { if (confirm("Delete this review?")) { setRv((p) => ({ ...p, items: p.items.filter((x) => x.id !== t.id) })); setOpenReview(null); } }} className="ml-auto inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-500/10"><Trash2 className="size-3.5" />Delete</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {rv.items.length < 30 && (
            <button type="button" onClick={() => { const id = `t${Date.now().toString(36)}`; setRv((p) => ({ ...p, items: [...p.items, { id, name: "", place: "", text: "", rating: 5, on: true }] })); setOpenReview(id); }} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-3.5 text-sm font-semibold text-muted transition hover:border-foreground/30 hover:text-foreground"><Plus className="size-4" /> Add a review</button>
          )}
        </Section>
      )}

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
      <ImagePick value={null} onChange={(k) => k && onAdd(k)} kind="banner" label="Add a slide" aspect="aspect-[21/4]" />
    </div>
  );
}
