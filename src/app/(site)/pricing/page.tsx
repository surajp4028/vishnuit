import type { Metadata } from "next";
import { Check, Minus } from "lucide-react";
import { PageHeader, PricingCards } from "@/components/sections/blocks";
import { SectionHeading } from "@/components/section-heading";
import { FaqAccordion } from "@/components/sections/interactive";
import { getFaqs, getPlans, getSettings } from "@/lib/server/content";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Pricing — Website & Digital Marketing Packages",
  description: "Transparent website and digital marketing pricing: Starter from ₹9,999, Growth from ₹19,999 and Premium from ₹39,999+.",
  alternates: { canonical: "/pricing" },
};

const MATRIX: [string, (boolean | string)[]][] = [
  ["Pages", ["Up to 5", "Up to 12", "Unlimited"]],
  ["Responsive premium design", [true, true, true]],
  ["Next.js / WordPress build", [true, true, true]],
  ["Admin dashboard / CMS", [false, true, true]],
  ["E-commerce & payment gateway", [false, true, true]],
  ["Custom web app / portal", [false, false, true]],
  ["On-page SEO", ["Basic", "Advanced", "Full SEO"]],
  ["Social media & ads setup", [false, true, true]],
  ["CRM / ERP / API integrations", [false, false, true]],
  ["Dedicated project manager", [false, false, true]],
  ["Free support", ["1 month", "3 months", "6 months"]],
];

export default async function PricingPage() {
  const [plans, faqs, settings] = await Promise.all([getPlans(), getFaqs(), getSettings()]);
  return (
    <>
      <PageHeader eyebrow="Pricing" title="Premium quality," highlight="honest pricing" subtitle="Pick a starting point — every project gets a custom proposal based on your goals and scope. GST extra." />
      <section className="container-x pb-20"><PricingCards plans={plans} /></section>
      <section className="container-x py-16">
        <SectionHeading eyebrow="Compare" title="What's in" highlight="each plan" />
        <div className="overflow-x-auto rounded-[1.75rem] border border-border bg-card">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-5 text-left font-medium text-muted">Feature</th>
                {plans.map((p) => <th key={p.id} className={`p-5 text-center font-display text-base font-bold ${p.highlighted ? "text-accent" : ""}`}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map(([f, vals]) => (
                <tr key={f} className="border-b border-border last:border-0">
                  <td className="p-5">{f}</td>
                  {vals.slice(0, plans.length).map((v, i) => (
                    <td key={i} className="p-5 text-center">
                      {v === true ? <Check className="mx-auto size-4 text-emerald-500" /> : v === false ? <Minus className="mx-auto size-4 text-muted/50" /> : <span className="font-medium">{v}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="container-x max-w-4xl py-16">
        <SectionHeading eyebrow="FAQ" title="Pricing" highlight="questions" />
        <FaqAccordion items={faqs} />
      </section>
    </>
  );
}
