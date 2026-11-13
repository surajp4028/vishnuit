import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PostCard } from "@/components/sections/blocks";
import { getPost, getPosts, getSettings } from "@/lib/server/content";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;

export async function generateStaticParams() {
  return (await getPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = await getPost((await params).slug);
  if (!p) return {};
  return { title: p.title, description: p.excerpt, openGraph: { type: "article", images: p.cover ? [p.cover] : [] }, alternates: { canonical: `/blog/${p.slug}` } };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p, posts, settings] = await Promise.all([getPost(slug), getPosts(), getSettings()]);
  if (!p) notFound();
  const words = p.content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  const more = posts.filter((x) => x.slug !== p.slug).slice(0, 3);
  const ld = { "@context": "https://schema.org", "@type": "BlogPosting", headline: p.title, datePublished: p.published_at, image: p.cover, author: { "@type": "Organization", name: settings.branding.siteName } };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <article className="pt-32 md:pt-40">
        <header className="container-x max-w-3xl text-center">
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground"><ArrowLeft className="size-4" /> Back to blog</Link>
          <p className="mt-8 text-xs font-semibold tracking-widest text-accent uppercase">{p.category}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight font-extrabold tracking-tight text-balance md:text-5xl">{p.title}</h1>
          <p className="mt-5 text-sm text-muted">{formatDate(p.published_at)} · {Math.max(1, Math.round(words / 220))} min read · {settings.branding.siteName}</p>
        </header>
        {p.cover && (
          <div className="container-x mt-10 max-w-5xl">
            <div className="relative aspect-[16/8] overflow-hidden rounded-[2rem] border border-border">
              <Image src={p.cover} alt={p.title} fill priority sizes="(max-width:1024px) 100vw, 1024px" className="object-cover" />
            </div>
          </div>
        )}
        <div className="container-x mt-12 max-w-3xl">
          <p className="mb-8 text-lg leading-relaxed font-medium text-foreground/85 md:text-xl">{p.excerpt}</p>
          <div className="prose-vit" dangerouslySetInnerHTML={{ __html: p.content }} />
        </div>
      </article>
      {more.length > 0 && (
        <section className="container-x py-20">
          <h2 className="mb-8 font-display text-2xl font-bold md:text-3xl">Keep reading</h2>
          <div className="grid gap-6 md:grid-cols-3">{more.map((m) => <PostCard key={m.slug} p={m} />)}</div>
        </section>
      )}
    </>
  );
}
