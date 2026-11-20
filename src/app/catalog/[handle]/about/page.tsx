import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreByHandle, imgUrl } from "@/lib/server/catalog";

export const metadata: Metadata = { title: "About" };
export const revalidate = 120;

export default async function About({ params }: { params: Promise<{ handle: string }> }) {
  const s = await getStoreByHandle((await params).handle);
  if (!s) notFound();
  const banner = imgUrl(s.banner_key);
  return (
    <section className="mx-auto max-w-3xl px-5 pt-10 sm:pt-16">
      <p className="text-xs font-semibold tracking-[4px] text-muted">ABOUT US</p>
      <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{s.name}</h1>
      {s.tagline && <p className="mt-4 text-lg text-muted">{s.tagline}</p>}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {banner && <img src={banner} alt="" className="mt-10 aspect-[16/9] w-full rounded-[1.6rem] object-cover" />}
      <div className="mt-10 text-[17px] leading-relaxed whitespace-pre-line text-foreground/85">{s.about || "We're getting our story ready. Meanwhile, explore our collection!"}</div>
    </section>
  );
}
