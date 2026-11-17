import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { LpStickyBar } from "@/components/lp/chrome";
import { getServices, getSettings } from "@/lib/server/content";

export default async function LpLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSettings(), getServices()]);
  const c = settings.contact;
  const navServices = services.map(({ slug, title, category, icon, short }) => ({ slug, title, category, icon, short }));
  return (
    <>
      <Navbar logoLight={settings.branding.logoLight} logoDark={settings.branding.logoDark} name={settings.branding.siteName} services={navServices} payNow={{ desktop: settings.conversion.payNowOnDesktop, mobile: settings.conversion.payNowOnMobile }} ctaHref="/website-development#get-quote" ctaLabel="Free quote" />
      <main className="overflow-x-clip pb-20 lg:pb-0">{children}</main>
      <Footer settings={settings} services={services} />
      <LpStickyBar phone={c.phone} whatsapp={c.whatsapp} />
    </>
  );
}
