import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-display text-[8rem] leading-none font-black text-gradient md:text-[12rem]">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold md:text-3xl">This page wandered off</h1>
        <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">Go home</Link>
          <Link href="/contact" className="rounded-full border border-border px-6 py-3 text-sm font-semibold">Contact us</Link>
        </div>
      </div>
    </main>
  );
}
