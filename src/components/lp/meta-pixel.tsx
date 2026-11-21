import Script from "next/script";
import { getIntegrations } from "@/lib/server/integrations";
import { ConsentBanner, ConsentGate } from "@/components/consent-banner";

/**
 * Meta Pixel base code. Uses the given pixel id (per landing page) or the common Pixel ID from Settings → Integrations.
 * Loads only after the visitor accepts the cookie banner (shown here too, so landing pages ask for consent as well).
 * No <noscript> image fallback: without JS a visitor can't give consent, so nothing is sent.
 */
export async function MetaPixel({ pixelId }: { pixelId?: string } = {}) {
  const id = pixelId || (await getIntegrations()).metaPixelId;
  if (!id || !/^\d+$/.test(id)) return null;
  return (
    <>
      <ConsentBanner policyHref="/privacy-policy" />
      <ConsentGate>
        <Script id={`meta-pixel-${id}`} strategy="afterInteractive">{`
if(!window.fbq)!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}</Script>
      </ConsentGate>
    </>
  );
}
