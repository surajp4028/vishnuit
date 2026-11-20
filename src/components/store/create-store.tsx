"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Store } from "lucide-react";
import { api, btnDark, card, Field, input } from "./ui";

/** Enroll screen: pick a store name and link vishnuit.co.in/catalog/@handle */
export function CreateStore({ suggested }: { suggested: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [handle, setHandle] = useState(suggested);
  const [check, setCheck] = useState<{ ok: boolean; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (handle.length < 3) { setCheck(null); return; }
    const t = setTimeout(async () => setCheck((await api<{ ok: boolean; error?: string }>(`/api/store/handle?h=${encodeURIComponent(handle)}`, "GET")).data), 350);
    return () => clearTimeout(t);
  }, [handle]);

  async function create(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const r = await api("/api/store/create", "POST", { name, handle });
    setBusy(false);
    if (r.ok) window.location.href = "/seller"; else setErr(r.data.error || "Could not create store.");
  }

  return (
    <section className="px-4 pt-28 pb-24 md:pt-36">
      <form onSubmit={create} className={`${card} mx-auto max-w-lg p-6 sm:p-9`}>
        <span className="grid size-14 place-items-center rounded-2xl bg-foreground text-background"><Store className="size-6" /></span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight">Create your online store</h1>
        <p className="mt-2 text-sm text-muted">Free for up to 15 products. Your own store link, product pages, WhatsApp/UPI/COD orders — all managed from your phone.</p>
        <div className="mt-7 space-y-5">
          <Field label="Store name"><input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Manish Fashion House" className={input} /></Field>
          <Field label="Store link" hint={check?.ok ? undefined : check?.error}>
            <div className="flex items-center overflow-hidden rounded-2xl border border-border bg-background focus-within:border-foreground/40">
              <span className="shrink-0 pl-4 text-sm text-muted">vishnuit.co.in/catalog/@</span>
              <input value={handle} onChange={(e) => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30))} required className="min-w-0 flex-1 bg-transparent py-3 pr-3 text-[15px] font-semibold outline-none" />
              {check?.ok && <Check className="mr-3 size-4 shrink-0 text-emerald-500" />}
            </div>
          </Field>
        </div>
        {err && <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-2.5 text-sm text-red-500">{err}</p>}
        <button disabled={busy || !check?.ok || name.trim().length < 2} className={`${btnDark} mt-7 w-full py-3.5`}>{busy ? <Loader2 className="size-4 animate-spin" /> : <>Create my store <ArrowRight className="size-4" /></>}</button>
      </form>
    </section>
  );
}
