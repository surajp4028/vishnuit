import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { getSettings } from "@/lib/server/content";
import "./globals.css";
import { siteUrl } from "@/lib/site";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "swap", weight: ["500", "600", "700", "800"] });
const serif = Instrument_Serif({ subsets: ["latin"], variable: "--font-serif", display: "swap", weight: "400", style: ["normal", "italic"] });

const SITE = siteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const { seo, branding } = await getSettings();
  return {
    metadataBase: new URL(SITE),
    title: { default: seo.title, template: `%s | ${branding.siteName}` },
    description: seo.description,
    keywords: seo.keywords,
    openGraph: { type: "website", siteName: branding.siteName, title: seo.title, description: seo.description, images: [seo.ogImage], locale: "en_IN" },
    twitter: { card: "summary_large_image", title: seo.title, description: seo.description, images: [seo.ogImage] },
    alternates: { canonical: "/" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf8" },
    { media: "(prefers-color-scheme: dark)", color: "#060608" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable} ${serif.variable}`}>
      <body className="min-h-dvh font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
