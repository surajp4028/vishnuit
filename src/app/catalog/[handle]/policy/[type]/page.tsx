import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PAGE_KEYS, PAGE_TITLES, getStoreByHandle, policyTemplate } from "@/lib/server/catalog";

export const revalidate = 120;
type K = (typeof PAGE_KEYS)[number];

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const t = (await params).type as K;
  return { title: PAGE_TITLES[t] ?? "Policy" };
}

export default async function Policy({ params }: { params: Promise<{ handle: string; type: string }> }) {
  const { handle, type } = await params;
  const s = await getStoreByHandle(handle);
  const k = type as K;
  if (!s || !PAGE_KEYS.includes(k) || !s.pages[k]?.on) notFound();
  return (
    <section className="mx-auto max-w-3xl px-5 pt-10 sm:pt-16">
      <p className="text-xs font-semibold tracking-[4px] text-muted">{s.name.toUpperCase()}</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight">{PAGE_TITLES[k]}</h1>
      <div className="mt-8 text-[16px] leading-relaxed whitespace-pre-line text-foreground/85">{s.pages[k].content || policyTemplate(k, s)}</div>
    </section>
  );
}
