import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader, PostCard } from "@/components/sections/blocks";
import { getPosts, getSettings } from "@/lib/server/content";
import { formatDate } from "@/lib/utils";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Blog & News — Digital Marketing, SEO & Web Development Insights",
  description: "Guides, case studies and news on SEO, social media, paid ads, web development and e-commerce from the Vishnu IT team.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [posts, settings] = await Promise.all([getPosts(), getSettings()]);
  const [first, ...rest] = posts;
  return (
    <>
      <PageHeader eyebrow="Blog & news" title="Insights to help you" highlight="grow online" subtitle="Practical guides, case studies and the latest in SEO, marketing and web development." />
      <section className="container-x pb-10">
        {first && (
          <Link href={`/blog/${first.slug}`} className="group mb-12 grid overflow-hidden rounded-[2rem] border border-border bg-card md:grid-cols-2">
            <div className="relative aspect-[16/10] md:aspect-auto md:min-h-[360px]">
              {first.cover && <Image src={first.cover} alt={first.title} fill priority sizes="(max-width:768px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />}
            </div>
            <div className="flex flex-col justify-center p-7 md:p-12">
              <p className="text-xs font-semibold tracking-widest text-accent uppercase">Featured · {first.category}</p>
              <h2 className="mt-3 font-display text-2xl leading-tight font-bold group-hover:text-accent md:text-4xl">{first.title}</h2>
              <p className="mt-4 text-muted">{first.excerpt}</p>
              <p className="mt-6 flex items-center gap-4 text-sm text-muted">{formatDate(first.published_at)} <span className="inline-flex items-center gap-1 font-semibold text-accent">Read <ArrowRight className="size-4" /></span></p>
            </div>
          </Link>
        )}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{rest.map((p) => <PostCard key={p.slug} p={p} />)}</div>
      </section>
    </>
  );
}
