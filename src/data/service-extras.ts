// Rich, category-level content that powers the service pages and the home showcase.
export type CategoryExtra = {
  key: string;
  icon: string;
  eyebrow: string;
  headline: string;
  highlight: string;
  intro: string;
  image: string;
  imageAlt: string;
  results: { value: string; label: string }[];
  benefits: { icon: string; title: string; text: string }[];
  deliverables: string[];
  tools: string[];
  industries: string[];
  faqs: { question: string; answer: string }[];
};

export const CATEGORY_EXTRAS: Record<string, CategoryExtra> = {
  Development: {
    key: "Development",
    icon: "Code2",
    eyebrow: "Web & App Development",
    headline: "Engineered for speed,",
    highlight: "built to scale",
    intro:
      "From high-converting business websites to fintech-grade platforms, we build on Next.js, React, Node.js, PHP, WordPress and MySQL — with clean architecture, airtight security and admin dashboards your team will love.",
    image: "/projects/onboarding-admin.webp",
    imageAlt: "Admin dashboard built by Vishnu IT",
    results: [
      { value: "<2s", label: "Average load time" },
      { value: "95+", label: "Lighthouse score" },
      { value: "150+", label: "Sites shipped" },
      { value: "99.9%", label: "Uptime" },
    ],
    benefits: [
      { icon: "Gauge", title: "Lightning-fast performance", text: "Server-rendered Next.js, image optimisation and edge caching for sub-2-second loads." },
      { icon: "Building2", title: "Scalable architecture", text: "Clean, modular code and MySQL schemas that grow with your traffic and features." },
      { icon: "Target", title: "Conversion-first UX", text: "Every page is designed around one goal — turning visitors into enquiries and sales." },
      { icon: "Blocks", title: "Admin dashboards & CMS", text: "Manage content, leads, orders and users yourself — no developer needed." },
      { icon: "ShoppingBag", title: "Payments & integrations", text: "Razorpay, Stripe, UPI, CRMs, WhatsApp, email and any third-party API." },
      { icon: "Gem", title: "Security baked in", text: "Hashed credentials, CSRF/XSS protection and fintech-grade practices from day one." },
    ],
    deliverables: ["Responsive website / web app", "Admin dashboard or CMS", "Source code & documentation", "Hosting, domain & SSL setup", "Speed & SEO optimisation", "Analytics & conversion tracking", "Training session & handover", "Post-launch support"],
    tools: ["Next.js", "React", "TypeScript", "Node.js", "PHP", "MySQL", "MongoDB", "WordPress", "WooCommerce", "Shopify", "Tailwind CSS", "Razorpay", "AWS S3", "Vercel"],
    industries: ["FinTech & Payments", "E-commerce & D2C", "Travel & Hospitality", "Education & LMS", "Healthcare", "Real Estate", "Immigration & Legal", "Spiritual & NGOs", "SaaS & Startups"],
    faqs: [
      { question: "Next.js or WordPress — which should I choose?", answer: "WordPress is ideal for content-led sites you want to edit easily on a budget. Next.js is best for premium performance, custom features, dashboards and scale. We'll recommend the right fit after understanding your goals." },
      { question: "Will I be able to update the website myself?", answer: "Yes. Every build includes an admin dashboard or CMS so you can edit text, images, services, blogs and more without touching code." },
      { question: "Do you provide hosting and maintenance?", answer: "We set up hosting, domain, SSL and backups, and offer monthly maintenance plans covering updates, security and small changes." },
      { question: "How long does development take?", answer: "Business websites take 1–3 weeks; e-commerce and custom web apps 4–10 weeks depending on scope. You get a clear milestone plan upfront." },
    ],
  },
  Design: {
    key: "Design",
    icon: "Palette",
    eyebrow: "Branding & UI/UX Design",
    headline: "Design that makes you",
    highlight: "unforgettable",
    intro:
      "Logos, identities, interfaces and print that look premium and feel consistent everywhere — crafted in Figma, Illustrator and Photoshop by designers who understand conversion.",
    image: "/projects/brand-business-cards.webp",
    imageAlt: "Brand and print design by Vishnu IT",
    results: [
      { value: "300+", label: "Creatives delivered" },
      { value: "3", label: "Logo concepts" },
      { value: "∞", label: "Revisions till happy" },
      { value: "48h", label: "First draft" },
    ],
    benefits: [
      { icon: "Gem", title: "Memorable identity", text: "Simple, timeless marks that people recognise and remember instantly." },
      { icon: "PenTool", title: "User-centred interfaces", text: "Research-led UI/UX with clear flows that reduce friction and lift conversions." },
      { icon: "Palette", title: "Consistent everywhere", text: "One visual language across website, social, packaging and print." },
      { icon: "Printer", title: "Print-ready files", text: "AI, EPS, SVG, PNG and PDF exports with correct bleed, CMYK and sizes." },
      { icon: "Sparkles", title: "Brand guidelines", text: "A style guide with colours, typography, logo usage and tone of voice." },
      { icon: "Rocket", title: "Fast turnaround", text: "First concepts in 48 hours, with collaborative revisions until it's right." },
    ],
    deliverables: ["Logo suite (AI, EPS, SVG, PNG)", "Colour palette & typography", "Brand style guide (PDF)", "Business cards & stationery", "Social media kit", "Figma UI designs & prototype", "Packaging / brochure artwork", "Source files ownership"],
    tools: ["Figma", "Adobe Illustrator", "Photoshop", "After Effects", "Premiere Pro", "Adobe XD", "Canva", "Framer"],
    industries: ["Startups", "Restaurants & Cafés", "Fashion & Beauty", "Real Estate", "Education", "Healthcare", "Spiritual & Religious", "Corporate & B2B"],
    faqs: [
      { question: "How many logo concepts do I get?", answer: "Typically three distinct concepts, then we refine your favourite through collaborative revisions." },
      { question: "Do I own the final design files?", answer: "Yes — once the project is paid, you receive all source files and full ownership." },
      { question: "Can you redesign my existing brand?", answer: "Absolutely. We can modernise your current identity while keeping the equity you've built." },
    ],
  },
  "Digital Marketing": {
    key: "Digital Marketing",
    icon: "Megaphone",
    eyebrow: "Performance & Social Marketing",
    headline: "Marketing that brings",
    highlight: "leads every day",
    intro:
      "Full-funnel growth across Instagram, Facebook, LinkedIn, YouTube, Google and Meta Ads — powered by scroll-stopping creatives, precise targeting, airtight tracking and honest monthly reporting.",
    image: "/projects/vishnu-it-services.webp",
    imageAlt: "Digital marketing services by Vishnu IT",
    results: [
      { value: "3.8x", label: "Average ROAS" },
      { value: "-42%", label: "Cost per lead" },
      { value: "10M+", label: "Impressions served" },
      { value: "24/7", label: "Campaign monitoring" },
    ],
    benefits: [
      { icon: "Target", title: "Laser-targeted audiences", text: "Interest, lookalike and retargeting audiences built from your real customers." },
      { icon: "Sparkles", title: "Thumb-stopping creatives", text: "Reels, carousels and ad creatives designed to win the scroll." },
      { icon: "MousePointerClick", title: "Conversion tracking", text: "GA4, GTM, Meta Pixel and Conversions API so every rupee is measured." },
      { icon: "Gauge", title: "Continuous optimisation", text: "Daily bid, budget and creative tweaks based on real performance data." },
      { icon: "Share2", title: "Community growth", text: "Consistent posting, engagement and influencer collaborations." },
      { icon: "FileSearch", title: "Transparent reporting", text: "Clear monthly reports on leads, sales, CPL and ROI — no vanity metrics." },
    ],
    deliverables: ["Marketing strategy & funnel", "Monthly content calendar", "Ad creatives & copy", "Campaign setup & management", "Pixel / GA4 / GTM tracking", "Landing page optimisation", "Lead sync to CRM / WhatsApp", "Monthly performance report"],
    tools: ["Meta Ads Manager", "Google Ads", "GA4", "Google Tag Manager", "Meta Pixel & CAPI", "Canva", "Later / Buffer", "HubSpot"],
    industries: ["E-commerce & D2C", "Real Estate", "Education & Coaching", "Healthcare & Clinics", "Immigration", "Restaurants", "Local Services", "B2B & SaaS"],
    faqs: [
      { question: "What ad budget do I need?", answer: "We recommend starting from ₹15,000–₹30,000/month in ad spend for most local businesses, scaling up as results prove out. Management fees are separate." },
      { question: "How soon will I see results?", answer: "Paid ads generate leads within days. Organic social growth compounds over 3–6 months." },
      { question: "Do you create the content too?", answer: "Yes — strategy, design, copywriting and video editing are all handled by our team." },
    ],
  },
  SEO: {
    key: "SEO",
    icon: "Search",
    eyebrow: "Search Engine Optimisation",
    headline: "Rank higher, get found,",
    highlight: "grow organically",
    intro:
      "White-hat SEO that compounds: technical fixes, Core Web Vitals, keyword-mapped content, authority link-building and local SEO — reported transparently every month.",
    image: "/projects/vishnu-it-web-dev.webp",
    imageAlt: "SEO and web performance by Vishnu IT",
    results: [
      { value: "3x", label: "Organic traffic" },
      { value: "Top 3", label: "Local map pack" },
      { value: "100%", label: "White-hat" },
      { value: "90+", label: "Core Web Vitals" },
    ],
    benefits: [
      { icon: "Gauge", title: "Technical excellence", text: "Core Web Vitals, crawlability, schema, sitemaps and clean site architecture." },
      { icon: "FileSearch", title: "Keyword-mapped content", text: "Pages built around real search intent that rank and convert." },
      { icon: "Link2", title: "Authority building", text: "Natural backlinks, PR mentions and citations from relevant sites." },
      { icon: "Target", title: "Local SEO", text: "Google Business Profile, reviews and NAP consistency to own 'near me' searches." },
      { icon: "Search", title: "Competitor insights", text: "We find the gaps your competitors miss — and take them." },
      { icon: "Sparkles", title: "Penalty-safe", text: "Only ethical, Google-approved techniques. No shortcuts, no risk." },
    ],
    deliverables: ["Full technical SEO audit", "Keyword research & mapping", "On-page optimisation", "Schema markup", "Google Business Profile optimisation", "Monthly backlink building", "Content briefs / blog posts", "Monthly ranking & traffic report"],
    tools: ["Google Search Console", "GA4", "Semrush", "Ahrefs", "Screaming Frog", "PageSpeed Insights", "Rank Math / Yoast", "Looker Studio"],
    industries: ["Local Businesses", "E-commerce", "Clinics & Doctors", "Law Firms", "Real Estate", "Education", "SaaS", "Travel"],
    faqs: [
      { question: "How long does SEO take to work?", answer: "Most sites see measurable movement in 6–12 weeks and strong results in 4–6 months. SEO compounds — the longer you invest, the better the ROI." },
      { question: "Can you guarantee #1 rankings?", answer: "No honest agency can guarantee rankings. We guarantee white-hat work, transparent reporting and steady, measurable growth." },
      { question: "My site was penalised — can you help?", answer: "Yes. We audit backlinks, disavow toxic links, fix on-page issues and file reconsideration where needed." },
    ],
  },
};
