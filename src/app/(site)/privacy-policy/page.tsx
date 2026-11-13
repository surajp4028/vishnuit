import type { Metadata } from "next";
import { PageHeader } from "@/components/sections/blocks";
import { getSettings } from "@/lib/server/content";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };

export default async function Privacy() {
  const { branding, contact } = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy" highlight="Policy" subtitle="Last updated: November 2026" />
      <div className="container-x prose-vit max-w-3xl pb-20">
        <p>{branding.siteName} (&quot;we&quot;, &quot;us&quot;) respects your privacy. This policy explains what information we collect through this website and how we use it.</p>
        <h2>Information we collect</h2>
        <p>When you submit an enquiry we collect your name, email, phone number, the service you are interested in, your budget and your message. We also collect basic, anonymous analytics such as pages visited.</p>
        <h2>How we use it</h2>
        <p>We use your details only to respond to your enquiry, prepare proposals and provide our services. We never sell or rent your personal data.</p>
        <h2>Storage & security</h2>
        <p>Enquiries are stored in a secure database and delivered to our inbox by our email provider. Access is restricted to authorised staff.</p>
        <h2>Your rights</h2>
        <p>You may request access to, correction of, or deletion of your data at any time by emailing <a href={`mailto:${contact.email}`}>{contact.email}</a>.</p>
        <h2>Contact</h2>
        <p>{branding.siteName}, {contact.address}. Phone: {contact.phone}.</p>
      </div>
    </>
  );
}
