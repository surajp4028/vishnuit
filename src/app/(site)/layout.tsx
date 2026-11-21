import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { FloatingActions } from "@/components/site/floating-actions";
import { getServices, getSettings } from "@/lib/server/content";
import { siteUrl } from "@/lib/site";
import { MetaPixel } from "@/components/lp/meta-pixel";
import { ConsentBanner } from "@/components/consent-banner";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);
  const navServices = services.map(({ slug, title, category, icon, short }) => ({ slug, title, category, icon, short }));
  const org = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: settings.branding.siteName,
    url: siteUrl(),
    logo: settings.branding.logoLight,
    telephone: settings.contact.phone,
    email: settings.contact.email,
    address: { "@type": "PostalAddress", streetAddress: "Gandhi Nagar", addressLocality: "Delhi", postalCode: "110031", addressCountry: "IN" },
    sameAs: Object.values(settings.social).filter(Boolean),
  };
  return (
    <>
      {/^#[0-9a-fA-F]{6}$/.test(settings.branding.accent) && <style>{`:root:not(.dark){--accent:${settings.branding.accent}}`}</style>}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <Navbar logoLight={settings.branding.logoLight} logoDark={settings.branding.logoDark} name={settings.branding.siteName} services={navServices} payNow={{ desktop: settings.conversion.payNowOnDesktop, mobile: settings.conversion.payNowOnMobile }} />
      <main className="overflow-x-clip">{children}</main>
      <Footer settings={settings} services={services} />
      <FloatingActions whatsapp={settings.contact.whatsapp} show={settings.conversion.whatsappButton} />
      <MetaPixel />
      <ConsentBanner policyHref="/privacy-policy" />
    </>
  );
}
