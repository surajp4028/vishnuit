// Ad landing pages. Add another object to create a new LP at /<slug> (e.g. "fullstack-development").
export type LandingPage = {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  badge: string;
  headline: string;
  highlight: string;
  subheadline: string;
  bullets: string[];
  formTitle: string;
  formSubtitle: string;
  serviceOptions: string[];
  pains: { title: string; text: string }[];
  offerings: { icon: string; title: string; text: string }[];
  showcase: { title: string; tag: string; image: string; slug: string; result: string }[];
  steps: { day: string; title: string; text: string }[];
  faqs: { question: string; answer: string }[];
};

export const LANDING_PAGES: LandingPage[] = [
  {
    slug: "website-development",
    metaTitle: "Website Development Company in Delhi — Premium Websites from ₹9,999",
    metaDescription:
      "Get a fast, premium, mobile-first website that brings you customers. Next.js & WordPress development, e-commerce, SEO-ready, live in 7 days. Free consultation.",
    badge: "🔥 November offer: Free domain + SSL + Google Business setup",
    headline: "Get a Premium Website That",
    highlight: "Brings You Customers",
    subheadline:
      "Fast, mobile-first websites for growing businesses — designed to convert visitors into calls, WhatsApp chats and sales. Starting at just ₹9,999, live in 7 days.",
    bullets: ["Live in 7 days — guaranteed timeline", "Mobile-first, lightning fast & SEO-ready", "WhatsApp, call & enquiry forms built in", "Easy admin panel — update anytime yourself"],
    formTitle: "Get a FREE quote in 30 minutes",
    formSubtitle: "Share your details — we'll call you with ideas, a timeline and a fixed price.",
    serviceOptions: ["Business Website", "E-commerce Store", "WordPress Website", "Custom Web App / Portal", "Landing Page for Ads", "Website Redesign", "SEO / Google Ranking", "Not sure — need advice"],
    pains: [
      { title: "No website, or an outdated one", text: "Customers search on Google first. If you're not there — or look old — they call your competitor." },
      { title: "Slow site, zero enquiries", text: "53% of mobile visitors leave if a page takes over 3 seconds. A slow site silently burns your ad money." },
      { title: "Freelancer disappeared", text: "Half-built site, no source code, no support. You're stuck and can't even make small changes." },
      { title: "Ads running, leads not coming", text: "Traffic lands on a confusing page with no clear call-to-action, so clicks never turn into customers." },
    ],
    offerings: [
      { icon: "Palette", title: "Premium custom design", text: "A unique, modern design built around your brand — not a ₹500 template." },
      { icon: "Smartphone", title: "Mobile-first & fast", text: "Pixel-perfect on every phone with sub-2-second loads and 90+ PageSpeed." },
      { icon: "Target", title: "Built to convert", text: "WhatsApp button, call button, lead forms and trust sections on every page." },
      { icon: "Search", title: "SEO-ready from day one", text: "Clean code, meta tags, schema, sitemap and Google Search Console setup." },
      { icon: "Blocks", title: "Easy admin panel", text: "Edit text, photos, services, blogs and see leads — no coding needed." },
      { icon: "ShoppingBag", title: "Payments & e-commerce", text: "Razorpay / UPI checkout, product catalogue, orders and GST invoices." },
      { icon: "Gem", title: "Secure & reliable", text: "SSL, backups, secure login and fintech-grade engineering practices." },
      { icon: "Rocket", title: "Support after launch", text: "Free support period plus affordable maintenance — we never disappear." },
    ],
    showcase: [
      { title: "Payment Gateway Onboarding", tag: "Fintech · Admin dashboard", image: "/projects/onboarding-admin.webp", slug: "imoneypay-merchant-onboarding", result: "KYC → approval → live in one flow" },
      { title: "SKYO Travel Booking", tag: "Travel · Booking platform", image: "/projects/skyo-home.webp", slug: "skyo-travel", result: "Trains, flights, PNR & live status" },
      { title: "ASTRO — Kundli Milan", tag: "E-commerce · Paid reports", image: "/projects/kundli-home.webp", slug: "astro-kundli-milan", result: "Razorpay checkout + auto PDF reports" },
      { title: "Shiv Shringar Sewa Samiti", tag: "Community · CMS", image: "/projects/shiv-shringar-home.webp", slug: "shiv-shringar-sewa-samiti", result: "Live darshan, events & admin panel" },
      { title: "Suraj.dev Portfolio", tag: "Personal brand · Next.js", image: "/projects/suraj-portfolio-v1-hero.webp", slug: "suraj-dev-portfolio", result: "3D globe, animations & lead form" },
      { title: "Minimal Developer Portfolio", tag: "Personal brand · Blog", image: "/projects/minimal-portfolio-hero.webp", slug: "minimal-portfolio", result: "Content-first, light & dark themes" },
      { title: "House of Geet", tag: "Fashion · WooCommerce", image: "/projects/house-of-geet.png", slug: "house-of-geet", result: "Ethnic-wear store with online payments" },
      { title: "Perk Immigration, Canada", tag: "Lead generation · WordPress", image: "/projects/perk-immigration.png", slug: "perk-immigration", result: "Consultation-booking website" },
    ],
    steps: [
      { day: "Day 1", title: "Free consultation", text: "We understand your business, goals and competitors, and share a fixed quote." },
      { day: "Day 2–3", title: "Design preview", text: "You see your homepage design first — and we refine it until you love it." },
      { day: "Day 4–6", title: "Development", text: "We build every page, connect forms, WhatsApp, SEO and your admin panel." },
      { day: "Day 7", title: "Go live 🚀", text: "Final checks on speed and mobile, domain connected, and you're live." },
    ],
    faqs: [
      { question: "How much does a website cost?", answer: "Our Starter website begins at ₹9,999, Growth (with admin panel, payments & advanced SEO) at ₹19,999, and Premium custom projects at ₹39,999+. You get a fixed quote before we start — no hidden charges." },
      { question: "How fast can my website go live?", answer: "Starter websites go live in 5–7 days once we have your content. Larger e-commerce or custom projects take 2–4 weeks." },
      { question: "Do I need to pay everything upfront?", answer: "No. You pay 50% to start and the remaining 50% only after you've approved the website, right before it goes live." },
      { question: "Will I be able to update the website myself?", answer: "Yes. Every website comes with a simple admin panel so you can change text, photos, services and blogs — and see your enquiries." },
      { question: "Do you provide domain and hosting?", answer: "Yes, we help you buy the domain and set up fast, secure hosting with SSL. With the current offer, domain + SSL setup is free." },
      { question: "Will my website show on Google?", answer: "Every site is SEO-ready: fast, mobile-friendly, with meta tags, schema and a sitemap submitted to Google Search Console. For top rankings, add our SEO service." },
      { question: "What if I don't like the design?", answer: "You approve the design before development starts, with revisions included. We don't move ahead until you're happy." },
    ],
  },
];

export const getLandingPage = (slug: string) => LANDING_PAGES.find((p) => p.slug === slug) ?? null;
