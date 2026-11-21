import type { Metadata } from "next";
import Image from "next/image";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { queryOne } from "@/lib/server/db";
import { effectivePlan, getCatalogConfig, getStoreForUser, imgUrl } from "@/lib/server/catalog";
import { getUser } from "@/lib/server/users";
import { storeOrigin } from "@/lib/server/domains";
import { fmtBytes, storageUsage } from "@/lib/server/storage";
import { fmtDate } from "@/lib/dates";
import { PlanPay } from "@/components/store/plan-pay";

export const metadata: Metadata = { title: "Plan payment", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/**
 * Plan renew / upgrade for stores that run on their own domain. Razorpay only accepts our registered
 * website, so the seller pays here (signed in by the one-time code from /api/account/jump), then goes
 * straight back to https://their-domain/seller/billing?payment=success|failed.
 */
export default async function PlanPayment({ params }: { params: Promise<{ code: string }> }) {
  const code = decodeURIComponent((await params).code).toUpperCase();
  const u = await getUser();
  const store = u ? await getStoreForUser(u.id) : null;
  const owner = !!store && store.code === code;
  // Where to send them back: their own domain if connected, else the normal seller panel.
  const target = owner ? store : await queryOne<{ domain: string | null; domain_ok: number }>("SELECT domain, domain_ok FROM stores WHERE code=?", [code]);
  const back = target?.domain && Number(target.domain_ok) ? `${storeOrigin(target.domain)}/seller/billing` : "/seller/billing";

  const shell = (children: React.ReactNode) => (
    <main className="min-h-dvh bg-[#f5f7fb] px-4 py-8 text-foreground sm:py-12 dark:bg-background">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <a href={back} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Back to dashboard</a>
          <span><Image src="/brand/vishnuit-vishnu-logo-black.png" alt="Vishnu IT Solutions" width={110} height={40} className="h-8 w-auto dark:hidden" /><Image src="/brand/vishnuit-vishnu-logo-white.png" alt="Vishnu IT Solutions" width={110} height={40} className="hidden h-8 w-auto dark:block" /></span>
        </div>
        {children}
        <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted"><Lock className="size-3.5" /> Secure payment by Razorpay · GST invoice from Vishnu IT Solutions</p>
      </div>
    </main>
  );

  if (!owner) {
    return shell(
      <div className="rounded-[2rem] border border-border bg-background p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-muted" />
        <h1 className="mt-4 font-display text-2xl font-extrabold">This payment link has expired</h1>
        <p className="mt-2 text-sm text-muted">For your security, please start again from your dashboard → Plan & billing → Renew or change plan.</p>
        <a href={back} className="mt-6 inline-block rounded-full bg-foreground px-6 py-3 text-sm font-bold text-background">Go to Plan & billing</a>
      </div>,
    );
  }

  const cfg = await getCatalogConfig();
  const eff = effectivePlan(store);
  const plan = cfg.plans[eff];
  const exp = store.plan_expires_at ? new Date(store.plan_expires_at) : null;
  const usage = await storageUsage(store);
  const logo = imgUrl(store.logo_key);
  return shell(
    <>
      <div className="mb-5 rounded-[2rem] bg-[#0a0f1f] p-6 text-white sm:p-7">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt="" className="size-12 rounded-2xl bg-white object-contain p-1" /> : <span className="grid size-12 place-items-center rounded-2xl bg-white/10 font-display font-extrabold">{store.name.slice(0, 2).toUpperCase()}</span>}
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-bold">{store.name}</p>
            <p className="truncate font-mono text-xs text-white/55">ID {store.code}{store.domain ? ` · ${store.domain}` : ""}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
          <div><p className="text-[11px] font-bold tracking-[2px] text-white/45">CURRENT PLAN</p><p className="mt-1 font-semibold">{plan.name}</p></div>
          <div><p className="text-[11px] font-bold tracking-[2px] text-white/45">VALID TILL</p><p className="mt-1 font-semibold">{exp ? fmtDate(exp) : "—"}</p></div>
          <div><p className="text-[11px] font-bold tracking-[2px] text-white/45">STORAGE</p><p className="mt-1 font-semibold">{fmtBytes(usage.used)} / {fmtBytes(usage.limit)}</p></div>
        </div>
      </div>
      <PlanPay plans={cfg.plans} current={eff} storePlan={store.plan} expiresAt={exp && exp.getTime() > Date.now() ? exp.toISOString() : null} returnUrl={back} />
    </>,
  );
}
