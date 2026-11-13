import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight, Calendar, Layers, User } from "lucide-react";
import { ProjectCard, ProjectCover } from "@/components/sections/blocks";
import { Gallery } from "@/components/sections/interactive";
import { getProject, getProjects, getSettings } from "@/lib/server/content";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getProjects()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getProject((await params).slug);
  if (!p) return {};
  return { title: `${p.title} — Case Study`, description: p.summary, openGraph: { images: p.cover ? [p.cover] : [] }, alternates: { canonical: `/portfolio/${p.slug}` } };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, all, settings] = await Promise.all([getProject(slug), getProjects(), getSettings()]);
  if (!p) notFound();
  const idx = all.findIndex((x) => x.slug === p.slug);
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
  const more = all.filter((x) => x.slug !== p.slug && x.category === p.category && x.cover).slice(0, 3);

  return (
    <>
      <section className="relative isolate overflow-hidden pt-32 md:pt-40">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,black,transparent)]" />
        <div className="container-x">
          <Link href="/portfolio" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" /> All projects</Link>
          <div className="mt-8 grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <span className="inline-flex rounded-full border border-accent/25 bg-accent/5 px-3 py-1 text-xs font-medium tracking-wide text-accent uppercase">{p.category}</span>
              <h1 className="mt-5 font-display text-4xl leading-[1.05] font-extrabold tracking-tight text-balance md:text-6xl">{p.title}</h1>
              <p className="mt-4 text-lg text-muted md:text-xl">{p.tagline}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
              {p.url && (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">
                  Visit live site <ArrowUpRight className="size-4" />
                </a>
              )}
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-full border border-border px-6 py-3 text-sm font-semibold hover:border-accent">Build something similar</Link>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border md:grid-cols-4">
            {[[User, "Client", p.client || "—"], [Calendar, "Year", p.year || "—"], [Layers, "Role", p.role || "—"], [Layers, "Category", p.category]].map(([I, k, v], i) => {
              const Ico = I as typeof User;
              return (
                <div key={i} className="bg-card p-5">
                  <p className="flex items-center gap-1.5 text-xs text-muted"><Ico className="size-3.5" /> {k as string}</p>
                  <p className="mt-1 text-sm font-semibold">{v as string}</p>
                </div>
              );
            })}
          </div>
          <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_40px_120px_-40px_rgba(0,0,0,0.45)]">
            <ProjectCover p={p} sizes="(max-width:1280px) 100vw, 1280px" priority className="group-hover:scale-100" />
          </div>
        </div>
      </section>

      <section className="container-x grid gap-12 py-16 md:py-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 className="font-display text-2xl font-bold md:text-3xl">Overview</h2>
          <div className="mt-5 space-y-4">
            {(p.overview.length ? p.overview : [p.summary]).map((para, i) => <p key={i} className="text-base leading-relaxed text-muted md:text-lg">{para}</p>)}
          </div>
        </div>
        <aside className="lg:col-span-5">
          {p.tools.length > 0 && (
            <div className="rounded-[1.75rem] border border-border bg-card p-6">
              <p className="text-sm font-semibold">Tech stack</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {p.tools.map((t) => <span key={t} className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium">{t}</span>)}
              </div>
            </div>
          )}
        </aside>
      </section>

      {p.highlights.length > 0 && (
        <section className="container-x pb-16">
          <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">Key highlights</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.highlights.map((h, i) => (
              <div key={h.title} className="rounded-3xl border border-border bg-card p-6">
                <span className="font-display text-3xl font-extrabold text-accent/30">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-3 font-display text-lg font-bold">{h.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{h.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {p.gallery.length > 0 && (
        <section className="container-x pb-16">
          <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">Screens & dashboards</h2>
          <Gallery images={p.gallery} title={p.title} />
        </section>
      )}

      <section className="container-x pb-10">
        <div className="grid gap-4 sm:grid-cols-2">
          {[["Previous", prev], ["Next", next]].map(([label, x]) => {
            const proj = x as typeof prev;
            return (
              <Link key={label as string} href={`/portfolio/${proj.slug}`} className={`group flex items-center gap-4 rounded-3xl border border-border bg-card p-5 transition hover:border-accent/50 ${label === "Next" ? "sm:flex-row-reverse sm:text-right" : ""}`}>
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-foreground/5">
                  {proj.cover && <Image src={proj.cover} alt="" fill sizes="64px" className="object-cover object-top" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted">{label as string} project</p>
                  <p className="truncate font-display font-bold group-hover:text-accent">{proj.title}</p>
                </div>
                {label === "Next" ? <ArrowRight className="size-5 text-muted sm:rotate-180" /> : <ArrowLeft className="size-5 text-muted" />}
              </Link>
            );
          })}
        </div>
      </section>

      {more.length > 0 && (
        <section className="container-x py-16">
          <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">More {p.category} work</h2>
          <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{more.map((m) => <ProjectCard key={m.slug} p={m} />)}</div>
        </section>
      )}
    </>
  );
}
