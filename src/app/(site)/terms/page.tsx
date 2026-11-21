import type { Metadata } from "next";
import { PageHeader } from "@/components/sections/blocks";
import { getSettings } from "@/lib/server/content";

export const metadata: Metadata = { title: "Terms & Conditions", alternates: { canonical: "/terms" } };

export default async function Terms() {
  const { branding, contact } = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Legal" title="Terms &" highlight="Conditions" subtitle="Last updated: November 2026" />
      <div className="container-x prose-vit max-w-3xl pb-20">
        <p>By using this website or engaging {branding.siteName} for services, you agree to these terms.</p>
        <h2>Services & proposals</h2>
        <p>Scope, deliverables, timelines and fees for each project are defined in a written proposal. Prices shown on this site are starting prices and exclude GST.</p>
        <h2>Payments</h2>
        <p>Unless agreed otherwise, projects require an advance payment before work begins, with the balance due before go-live.</p>
        <h2>Intellectual property</h2>
        <p>On full payment, ownership of final deliverables transfers to the client. We may showcase completed work in our portfolio unless agreed otherwise.</p>
        <h2>Limitation of liability</h2>
        <p>We are not liable for indirect or consequential losses. Our total liability is limited to the fees paid for the relevant project.</p>
        <h2>Vishnu Stores (seller marketplace)</h2>
        <p>Stores at vishnuit.co.in/catalog/@store-name, or on a seller&apos;s own domain, are run by independent sellers. The seller is responsible for their products, prices, GST invoices, delivery, returns and refunds, and their legal name, address and grievance contact are shown in each store&apos;s footer. {branding.siteName} provides the technology platform. If a seller doesn&apos;t resolve your complaint, contact our <a href="/privacy-policy#grievance">Grievance Officer</a>.</p>
        <h2>Privacy</h2>
        <p>How we handle personal data is explained in our <a href="/privacy-policy">Privacy Policy</a>.</p>
        <h2>Contact</h2>
        <p>Questions? Email <a href={`mailto:${contact.email}`}>{contact.email}</a> or call {contact.phone}.</p>
      </div>
    </>
  );
}
