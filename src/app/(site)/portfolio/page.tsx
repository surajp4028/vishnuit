import type { Metadata } from "next";
import { PageHeader } from "@/components/sections/blocks";
import { PortfolioGrid } from "@/components/sections/interactive";
import { getProjects, getSettings } from "@/lib/server/content";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Portfolio — Websites, Web Apps & Brand Design",
  description: "Explore Vishnu IT's portfolio: fintech platforms, travel booking apps, astrology products, e-commerce stores, business websites and brand design.",
  alternates: { canonical: "/portfolio" },
};

export default async function PortfolioPage() {
  const [projects, settings] = await Promise.all([getProjects(), getSettings()]);
  return (
    <>
      <PageHeader eyebrow="Web folio" title="Selected work &" highlight="case studies" subtitle={`${projects.length} projects across fintech, travel, e-commerce, spiritual, immigration and brand design — each built for performance, clarity and growth.`} />
      <section className="container-x pb-10">
        <PortfolioGrid projects={projects} />
      </section>
    </>
  );
}
