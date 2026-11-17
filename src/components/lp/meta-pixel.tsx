import Script from "next/script";
import { getIntegrations } from "@/lib/server/integrations";

/** Meta Pixel base code. Uses the given pixel id (per landing page) or the common Pixel ID from Settings → Integrations. */
export async function MetaPixel({ pixelId }: { pixelId?: string } = {}) {
  const id = pixelId || (await getIntegrations()).metaPixelId;
  if (!id || !/^\d+$/.test(id)) return null;
  return (
    <>
      <Script id={`meta-pixel-${id}`} strategy="afterInteractive">{`
if(!window.fbq)!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${id}');fbq('track','PageView');`}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img height="1" width="1" style={{ display: "none" }} alt="" src={`https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1`} />
      </noscript>
    </>
  );
}
