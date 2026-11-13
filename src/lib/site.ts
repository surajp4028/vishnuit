/** Public base URL. On Vercel we use the project's production domain (vercel.app until the custom
 *  domain is attached, then vishnuit.co.in) so OG images and canonicals never point at the old WordPress site. */
export function siteUrl() {
  const v = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (v) return `https://${v}`;
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
}
