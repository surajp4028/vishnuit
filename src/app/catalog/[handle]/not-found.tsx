"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/** Shown inside the store's own header/footer when a product or page doesn't exist. */
export default function StoreNotFound() {
  const base = (usePathname() ?? "").split("/").slice(0, 3).join("/");
  return (
    <section className="mx-auto max-w-xl px-5 py-20 text-center sm:py-28">
      <p className="font-display text-[7rem] leading-none font-extrabold tracking-tighter text-foreground/10">404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight">This page isn&apos;t here</h1>
      <p className="mt-3 text-muted">The product may be sold out or the link is old. Have a look at what&apos;s new instead.</p>
      <Link href={`${base}/shop`} className="mt-8 inline-block rounded-pill bg-foreground px-7 py-3.5 text-[13px] font-bold tracking-wide text-background uppercase">Browse the shop</Link>
    </section>
  );
}
