import Script from "next/script";
import { ConsentBanner, ConsentGate } from "@/components/consent-banner";

/**
 * Merchant's own Meta Pixel / Google Analytics, only on their store pages. IDs are validated digits / G-codes.
 * Nothing loads until the shopper accepts the cookie banner (DPDP Act consent); stores without pixels show no banner.
 */
export function StorePixels({ meta, ga }: { meta: string; ga: string }) {
  const m = /^\d{10,20}$/.test(meta) ? meta : "";
  const g = /^G-[A-Z0-9]{4,15}$/.test(ga) ? ga : "";
  if (!m && !g) return null;
  return (
    <>
      <ConsentBanner />
      <ConsentGate>
        {m && (
          <Script id={`store-pixel-${m}`} strategy="afterInteractive">{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${m}');fbq('track','PageView');`}</Script>
        )}
        {g && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${g}`} strategy="afterInteractive" />
            <Script id={`store-ga-${g}`} strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${g}');`}</Script>
          </>
        )}
      </ConsentGate>
    </>
  );
}
