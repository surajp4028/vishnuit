import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { FloatingActions } from "@/components/site/floating-actions";
import { getServices, getSettings } from "@/lib/server/content";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);
  const navServices = services.map(({ slug, title, category, icon, short }) => ({ slug, title, category, icon, short }));
  const org = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: settings.branding.siteName,
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.vishnuit.co.in",
    logo: settings.branding.logoLight,
    telephone: settings.contact.phone,
    email: settings.contact.email,
    address: { "@type": "PostalAddress", streetAddress: "East Azad Nagar", addressLocality: "Delhi", postalCode: "110051", addressCountry: "IN" },
    sameAs: Object.values(settings.social).filter(Boolean),
  };
  return (
    <>
      {/^#[0-9a-fA-F]{6}$/.test(settings.branding.accent) && <style>{`:root:not(.dark){--accent:${settings.branding.accent}}`}</style>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <Navbar logoLight={settings.branding.logoLight} logoDark={settings.branding.logoDark} name={settings.branding.siteName} services={navServices} />
      <main className="overflow-x-clip">{children}</main>
      <Footer settings={settings} services={services} />
      <FloatingActions whatsapp={settings.contact.whatsapp} show={settings.conversion.whatsappButton} />
    </>
  );
}
