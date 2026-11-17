// Seed content for Vishnu IT Solutions. Used by `npm run db:setup` to fill MySQL,
// and as a fallback when the database is unreachable (so the site never breaks).
// Keep this file free of imports so Node can run it directly.

export type Service = {
  slug: string;
  title: string;
  category: "Development" | "Design" | "Digital Marketing" | "SEO";
  icon: string;
  short: string;
  description: string;
  features: string[];
  process: string[];
  image?: string;
  sort: number;
};

export type Plan = {
  name: string;
  price: number;
  suffix: string;
  tagline: string;
  features: string[];
  highlighted: boolean;
  cta: string;
  sort: number;
};

export type Testimonial = { name: string; role: string; quote: string; avatar: string; rating: number; sort: number };
export type Post = { slug: string; title: string; category: string; excerpt: string; content: string; cover: string; published_at: string };
export type Faq = { question: string; answer: string; sort: number };
export type Brand = { name: string; logo: string; url: string; kind: "partner" | "client"; sort: number };

export const services: Service[] = [
  // ---------- Development ----------
  {
    slug: "custom-web-development",
    title: "Custom Web Development",
    category: "Development",
    icon: "Code2",
    short: "Tailored web apps with React, Next.js, Node, PHP and MySQL — built for speed and scale.",
    description:
      "We engineer custom websites and web applications from the ground up — no bloated templates. Our team works across React, Next.js, Node.js, PHP, MySQL and MongoDB to ship secure, scalable products with clean front-end and back-end integration.",
    features: [
      "Front-end development with React & Next.js",
      "Back-end APIs with Node.js, PHP & MySQL/MongoDB",
      "Full-stack web apps & admin dashboards",
      "Custom CMS solutions",
      "Third-party & payment API integrations",
      "Responsive, mobile-first and blazing fast",
    ],
    process: ["Consultation & requirements", "Design & prototyping", "Development", "Testing & QA", "Launch & monitoring", "Ongoing support"],
    sort: 1,
  },
  {
    slug: "website-design-service",
    title: "Website Design",
    category: "Design",
    icon: "Palette",
    short: "Custom, responsive, conversion-focused websites designed for every screen.",
    description:
      "High-performance website design for businesses of every size — business sites, portfolios, blogs and landing pages. Every design is user-centred, SEO-ready and tuned for Core Web Vitals.",
    features: [
      "Business, portfolio & content websites",
      "SEO-friendly architecture",
      "User-centred UI/UX & intuitive navigation",
      "CMS, analytics & security built in",
      "Image, code & caching optimisation",
      "Pixel-perfect responsive layouts",
    ],
    process: ["Client meeting", "In-depth analysis", "Strategy", "Execution & launch", "Continuous improvement"],
    sort: 2,
  },
  {
    slug: "wordpress-web-development-agency",
    title: "WordPress Development",
    category: "Development",
    icon: "Blocks",
    short: "Custom WordPress themes, WooCommerce stores and an easy-to-use backend.",
    description:
      "Custom WordPress websites built to your brand — fast-loading, SEO-optimised and simple to manage. From bespoke themes to WooCommerce stores and third-party integrations, we handle it end to end.",
    features: [
      "Custom themes & Elementor builds",
      "WooCommerce e-commerce",
      "SEO best practices baked in",
      "Security hardening & backups",
      "Third-party plugin integrations",
      "Training & ongoing maintenance",
    ],
    process: ["Discovery & planning", "Design & prototyping", "WordPress development", "Content integration", "Testing & QA", "Launch & training", "Support & maintenance"],
    sort: 3,
  },
  {
    slug: "e-commerce-website-service",
    title: "E-Commerce Development",
    category: "Development",
    icon: "ShoppingBag",
    short: "Online stores on Shopify, WooCommerce or custom stacks with secure UPI & card payments.",
    description:
      "Tailored e-commerce solutions that turn browsers into buyers. We build on WooCommerce, Shopify or fully custom Next.js stacks with Razorpay, Stripe and UPI payments, inventory, shipping and tax handled.",
    features: [
      "Product catalogue & inventory management",
      "Razorpay, Stripe, UPI & card payments",
      "Customer accounts & order management",
      "Shipping, tax & coupon engines",
      "Conversion-optimised checkout",
      "Analytics & sales reporting",
    ],
    process: ["Consultation & discovery", "Platform selection", "Custom design & UX", "Feature integration", "SEO & CRO", "Testing & QA", "Launch & training", "Support"],
    sort: 4,
  },
  {
    slug: "b2b-web-development-solutions",
    title: "B2B Web Solutions",
    category: "Development",
    icon: "Building2",
    short: "Client portals, enterprise web apps and CRM/ERP integrations for B2B companies.",
    description:
      "Secure, scalable web platforms for B2B businesses — client portals, enterprise applications, bulk-pricing commerce and CRM/ERP integrations, backed by data and business intelligence.",
    features: [
      "Custom websites & client portals",
      "Enterprise web applications",
      "CRM & ERP integration",
      "B2B commerce with bulk pricing",
      "Data management & BI dashboards",
      "Custom API integrations",
    ],
    process: ["Discovery", "Architecture", "Build", "Integrate", "Launch", "Scale"],
    sort: 5,
  },
  {
    slug: "startup-agencies",
    title: "Startup Web Solutions",
    category: "Development",
    icon: "Rocket",
    short: "MVPs, web apps and launch-ready websites for startups across 9+ industries.",
    description:
      "From MVP to market — we help startups launch fast with websites, web applications and e-commerce, wired up with SEO, analytics and the third-party services you need to grow.",
    features: [
      "Launch-ready startup websites",
      "MVPs & SaaS web applications",
      "E-commerce for D2C brands",
      "SEO & marketing integration",
      "API & third-party services",
      "Healthcare, FinTech, travel, real estate & more",
    ],
    process: ["Idea validation", "MVP scope", "Design sprint", "Build", "Launch", "Iterate"],
    sort: 6,
  },
  {
    slug: "app-development",
    title: "App Development",
    category: "Development",
    icon: "Smartphone",
    short: "Cross-platform mobile apps and PWAs that feel native and scale with your users.",
    description:
      "We design and develop mobile apps and progressive web apps that feel fast and native — with secure auth, payments, push notifications and an admin dashboard to run it all.",
    features: [
      "Cross-platform mobile apps",
      "Progressive Web Apps (PWA)",
      "OTP auth & secure sessions",
      "Payments & subscriptions",
      "Push notifications",
      "Admin panel & analytics",
    ],
    process: ["Discovery", "UX & UI", "Development", "QA", "Store launch", "Support"],
    sort: 7,
  },
  {
    slug: "lms-development",
    title: "LMS & E-Learning",
    category: "Development",
    icon: "GraduationCap",
    short: "Custom learning management systems with courses, quizzes and certificates.",
    description:
      "Custom LMS platforms for institutes and creators — course builders, video lessons, quizzes, certificates, student dashboards and payment-gated enrolments.",
    features: ["Course & lesson builder", "Video & document lessons", "Quizzes & certificates", "Student & instructor dashboards", "Paid enrolments", "Progress analytics"],
    process: ["Discovery", "Curriculum mapping", "Build", "Content upload", "Launch", "Support"],
    sort: 8,
  },
  // ---------- Design ----------
  {
    slug: "branding-logo-design-service",
    title: "Branding & Logo Design",
    category: "Design",
    icon: "Gem",
    short: "Memorable logos, corporate identity and brand guidelines that last.",
    description:
      "Create a lasting impression with professional branding. We craft logos, corporate identities and brand strategies that stay consistent across web, social and print — delivered with a full style guide.",
    features: ["Logo design (AI, EPS, PNG, SVG)", "Corporate identity", "Brand strategy & positioning", "Website & social branding", "Brand style guide", "Simple, memorable, timeless"],
    process: ["Brand discovery & research", "Concept development", "Design refinement", "Branding elements", "Final deliverables"],
    sort: 9,
  },
  {
    slug: "ui-ux-design",
    title: "UI/UX Design",
    category: "Design",
    icon: "PenTool",
    short: "Research-led interfaces and design systems for websites, apps and dashboards.",
    description:
      "User-centred UI/UX for websites, apps and SaaS dashboards — wireframes, prototypes and production-ready design systems in Figma that developers love.",
    features: ["UX research & user flows", "Wireframes & prototypes", "Figma design systems", "Dashboard & SaaS UI", "Accessibility (WCAG)", "Dev-ready handoff"],
    process: ["Research", "Flows", "Wireframes", "Visual design", "Prototype", "Handoff"],
    sort: 10,
  },
  {
    slug: "print-collateral-business-cards",
    title: "Print & Creative Assets",
    category: "Design",
    icon: "Printer",
    short: "Business cards, brochures, hoardings, packaging and social creatives.",
    description:
      "Graphic design that sells — business cards, brochures, hoardings, standees, product packaging, YouTube thumbnails and scroll-stopping social media creatives.",
    features: ["Business cards & stationery", "Brochures & catalogues", "Hoardings & standees", "Product packaging", "Social media creatives", "YouTube thumbnails"],
    process: ["Brief", "Moodboard", "Concepts", "Revisions", "Print-ready files"],
    sort: 11,
  },
  // ---------- Digital Marketing ----------
  {
    slug: "digital-marketing-service",
    title: "Digital Marketing",
    category: "Digital Marketing",
    icon: "Megaphone",
    short: "Full-funnel growth marketing — social, search, content, email and paid ads.",
    description:
      "Your trusted growth partner. We plan and run full-funnel digital marketing — social media, Google & Meta Ads, content, email and SEO/SEM — measured by leads, sales and ROI.",
    features: ["Social media marketing", "Google Ads & Meta Ads", "Content marketing", "Email marketing", "SEO & SEM", "Monthly ROI reporting"],
    process: ["Audit", "Strategy", "Creative", "Launch", "Optimise", "Report"],
    sort: 12,
  },
  {
    slug: "social-media-marketing",
    title: "Social Media Marketing",
    category: "Digital Marketing",
    icon: "Share2",
    short: "Instagram, Facebook, LinkedIn and YouTube growth with content that converts.",
    description:
      "Elevate your brand on Instagram, Facebook, LinkedIn, X and YouTube with tailored strategies, consistent content, community management and data-driven paid campaigns.",
    features: ["Strategy & content calendar", "Reels, posts & creatives", "Community management", "Influencer collaborations", "Paid social campaigns", "Analytics & optimisation"],
    process: ["Strategy", "Content creation", "Community engagement", "Advertising", "Analytics & optimisation"],
    sort: 13,
  },
  {
    slug: "google-ads-marketing",
    title: "Google Ads (PPC)",
    category: "Digital Marketing",
    icon: "MousePointerClick",
    short: "High-intent Search, Display, Shopping and YouTube campaigns with full transparency.",
    description:
      "Drive targeted traffic and conversions with Google Ads. We handle keyword research, ad copy, landing pages and continuous optimisation — you get immediate results, budget control and real-time reporting.",
    features: ["Search, Display & Shopping ads", "YouTube & Performance Max", "Keyword research & ad copy", "Landing page optimisation", "Conversion tracking (GA4/GTM)", "Transparent reporting"],
    process: ["Campaign strategy", "Keywords & ad creation", "Landing page optimisation", "Continuous optimisation", "Reporting"],
    sort: 14,
  },
  {
    slug: "meta-ads-marketing",
    title: "Meta Ads (Facebook & Instagram)",
    category: "Digital Marketing",
    icon: "Target",
    short: "Lead-gen and sales campaigns on Facebook & Instagram with pixel-perfect tracking.",
    description:
      "Performance campaigns on Facebook and Instagram — audience research, creatives, Meta Pixel & Conversions API tracking and CRM-connected lead forms.",
    features: ["Lead generation campaigns", "Catalogue & sales ads", "Meta Pixel & CAPI setup", "Creative testing", "Retargeting funnels", "CRM lead sync"],
    process: ["Audience research", "Creative", "Launch", "A/B test", "Scale"],
    sort: 15,
  },
  // ---------- SEO ----------
  {
    slug: "seo-service",
    title: "SEO Services",
    category: "SEO",
    icon: "Search",
    short: "White-hat SEO that ranks — on-page, off-page, technical and local SEO.",
    description:
      "Unlock your website's potential with expert, white-hat SEO. We combine on-page, off-page, technical and local SEO with transparent reporting to grow organic traffic that converts.",
    features: ["On-page SEO", "Off-page SEO & link building", "Technical SEO", "Local SEO & Google Business Profile", "Keyword research & strategy", "Transparent monthly reports"],
    process: ["Audit & analysis", "Keyword strategy", "Optimisation", "Monitoring & adjustments"],
    sort: 16,
  },
  {
    slug: "on-page-seo",
    title: "On-Page SEO",
    category: "SEO",
    icon: "FileSearch",
    short: "Content, structure and intent optimisation with ethical white-hat techniques.",
    description:
      "Boost rankings with white-hat on-page SEO: keyword mapping, content optimisation, page structure, media optimisation and search-intent alignment.",
    features: ["Comprehensive SEO audit", "Keyword research & mapping", "Content optimisation", "Meta tags & headings", "Image & media optimisation", "Internal linking"],
    process: ["Audit", "Keyword research", "Content optimisation", "Structure", "Monitoring"],
    sort: 17,
  },
  {
    slug: "off-page-seo",
    title: "Off-Page SEO",
    category: "SEO",
    icon: "Link2",
    short: "Quality backlinks, brand mentions and citations that build real authority.",
    description:
      "Enhance your domain authority with natural, high-quality backlinks, brand mentions, local citations, reviews and community engagement.",
    features: ["Quality backlink building", "Brand mentions & PR", "Local citations & directories", "Online reviews", "Influencer outreach", "Forum & community engagement"],
    process: ["Backlink analysis", "Outreach campaigns", "Content promotion", "Social engagement", "Reporting"],
    sort: 18,
  },
  {
    slug: "technical-seo",
    title: "Technical SEO",
    category: "SEO",
    icon: "Gauge",
    short: "Core Web Vitals, crawlability, schema and site speed — engineered for Google.",
    description:
      "Optimise your website for peak performance: Core Web Vitals (LCP, INP, CLS), crawlability, XML sitemaps, robots.txt, structured data, canonicals, HTTPS and redirect management.",
    features: ["Core Web Vitals (LCP, INP, CLS)", "Site speed optimisation", "XML sitemap & robots.txt", "Schema.org structured data", "Crawl error & redirect fixes", "Mobile-first indexing"],
    process: ["Website audit", "On-site improvements", "Crawl & index optimisation", "Ongoing monitoring"],
    sort: 19,
  },
];

export const plans: Plan[] = [
  {
    name: "Starter",
    price: 9999,
    suffix: "onwards",
    tagline: "A premium website to launch your business online — fast.",
    features: [
      "Up to 5-page responsive website",
      "Next.js or WordPress build",
      "Premium mobile-first design",
      "Contact form + WhatsApp chat button",
      "Basic on-page SEO + Google indexing",
      "SSL, hosting setup & speed optimisation",
      "1 month free support",
    ],
    highlighted: false,
    cta: "Start with Starter",
    sort: 1,
  },
  {
    name: "Growth",
    price: 19999,
    suffix: "onwards",
    tagline: "Website + lead engine built to bring enquiries every day.",
    features: [
      "Up to 12 pages or e-commerce store (50 products)",
      "Custom UI/UX design + logo refresh",
      "Admin dashboard / CMS",
      "Razorpay / UPI payment gateway",
      "Advanced SEO + Google Business Profile",
      "Meta Pixel, GA4 & conversion tracking",
      "3 months free support",
    ],
    highlighted: true,
    cta: "Grow with Growth",
    sort: 2,
  },
  {
    name: "Premium",
    price: 39999,
    suffix: "+",
    tagline: "Custom web apps, portals and full-funnel marketing.",
    features: [
      "Custom web app / portal / SaaS",
      "Multi-role admin & workflows",
      "CRM, WhatsApp & third-party API integrations",
      "Security hardening & performance audit",
      "Full SEO + Google / Meta Ads setup",
      "Dedicated project manager",
      "6 months priority support",
    ],
    highlighted: false,
    cta: "Talk to us",
    sort: 3,
  },
];

export const testimonials: Testimonial[] = [
  { name: "Sakshi Agarwal", role: "Founder, Tech Startup", quote: "Vishnu IT delivered a fast, secure website with flawless functionality. The team understood our product and shipped ahead of schedule.", avatar: "/testimonials/t1.jpeg", rating: 5, sort: 1 },
  { name: "Arvind Malhotra", role: "CEO, Retail Business", quote: "Their marketing campaigns brought us a clear jump in qualified leads and sales within the first quarter. Transparent reporting every month.", avatar: "/testimonials/t2.jpeg", rating: 5, sort: 2 },
  { name: "Kunal Patel", role: "Online Store Owner", quote: "End-to-end e-commerce with smooth payments and a checkout our customers love. Orders went up the very first month.", avatar: "/testimonials/t3.jpeg", rating: 5, sort: 3 },
  { name: "Neeraj Khanna", role: "Startup Founder", quote: "Logo, branding, marketing material and the website — all consistent and premium. It finally feels like a real brand.", avatar: "/testimonials/t4.jpeg", rating: 5, sort: 4 },
  { name: "Richa Bansal", role: "IT Manager, Finance Firm", quote: "Security was our biggest concern. Vishnu IT hardened our platform and gave us real peace of mind.", avatar: "/testimonials/t5.jpeg", rating: 5, sort: 5 },
  { name: "Deepak Verma", role: "Founder, Manufacturing Firm", quote: "The custom dashboard they built streamlined our entire workflow. Our team saves hours every week.", avatar: "/testimonials/t6.jpeg", rating: 4, sort: 6 },
  { name: "Sameer Kapoor", role: "Operations Head, Logistics Firm", quote: "Professional, responsive and technically strong. Our infrastructure upgrade went without a hitch.", avatar: "/testimonials/t7.jpeg", rating: 5, sort: 7 },
  { name: "Pooja Sharma", role: "Lifestyle Blogger", quote: "My Instagram and YouTube growth has been incredible since working with them. Great creatives and strategy.", avatar: "/testimonials/t8.jpeg", rating: 5, sort: 8 },
  { name: "Megha Jain", role: "Digital Marketer", quote: "Their keyword research and SEO work doubled our organic traffic. Clear, honest and results-driven.", avatar: "/testimonials/t9.jpeg", rating: 5, sort: 9 },
];

const p = (...paras: string[]) => paras.map((x) => `<p>${x}</p>`).join("\n");

export const posts: Post[] = [
  {
    slug: "shopify-vs-wordpress-which-is-the-best-platform-for-your-online-store",
    title: "Shopify vs WordPress: Which Is the Best Platform for Your Online Store?",
    category: "Development",
    excerpt: "Hosted simplicity or open-source freedom? We compare cost, flexibility, SEO and scalability to help you choose.",
    cover: "/blog/b7.jpg",
    published_at: "2025-04-07",
    content:
      p(
        "Choosing an e-commerce platform is one of the biggest early decisions for any online brand. Shopify and WordPress (with WooCommerce) power millions of stores — but they suit very different businesses.",
        "<strong>Shopify</strong> is fully hosted: you get security, updates and a polished checkout out of the box, at the cost of monthly fees and app subscriptions. <strong>WordPress + WooCommerce</strong> is open-source: you own everything, can customise without limits and avoid platform fees, but you take responsibility for hosting and maintenance.",
        "For fast launches with minimal tech overhead, Shopify wins. For content-heavy brands, custom workflows and lower long-term cost, WordPress wins. And for high-scale or highly custom experiences, a headless Next.js storefront gives you the best of both.",
      ) + "<h2>Our recommendation</h2>" + p("Talk to us about your catalogue size, budget and growth plans — we'll recommend the stack that fits, not the one that's trendy."),
  },
  {
    slug: "from-zero-to-hero-a-social-media-success-story",
    title: "From Zero to Hero: A Social Media Success Story",
    category: "Marketing",
    excerpt: "How a brand-new D2C label went from zero followers to a steady stream of daily orders in six months.",
    cover: "/blog/b1.jpg",
    published_at: "2025-03-10",
    content: p(
      "Every brand starts at zero. The difference is a clear strategy, consistent content and the discipline to test, learn and double down on what works.",
      "We started with audience research, built a content calendar around Reels and carousels, and layered a small, tightly-targeted Meta Ads budget on top. Within six months the brand had a loyal community and predictable daily orders.",
      "The lesson: organic and paid work best together. Content builds trust; ads accelerate reach.",
    ),
  },
  {
    slug: "how-we-helped-a-local-business-3x-their-revenue-with-seo",
    title: "How We Helped a Local Business 3X Their Revenue with SEO",
    category: "SEO",
    excerpt: "Local SEO, Google Business Profile optimisation and a few smart landing pages tripled inbound revenue.",
    cover: "/blog/b2.jpg",
    published_at: "2025-02-25",
    content: p(
      "Local businesses often underestimate how much revenue is waiting in Google Maps and 'near me' searches.",
      "We fixed NAP consistency across directories, optimised the Google Business Profile, built service-area landing pages and set up a review-request flow. Calls and walk-ins climbed month after month.",
      "Within a year, revenue from organic channels had tripled — with zero ad spend.",
    ),
  },
  {
    slug: "a-beginners-guide-to-paid-social-media-advertising",
    title: "A Beginner's Guide to Paid Social Media Advertising",
    category: "Marketing",
    excerpt: "Objectives, audiences, creatives and budgets — everything you need to run your first profitable campaign.",
    cover: "/blog/b3.jpg",
    published_at: "2025-02-02",
    content: p(
      "Paid social can feel overwhelming. Start with one clear objective — leads, sales or awareness — and build everything around it.",
      "Define tight audiences, test 3–5 creatives, install the Meta Pixel and Conversions API, and give each test enough budget to learn. Kill losers fast and scale winners slowly.",
    ),
  },
  {
    slug: "is-influencer-marketing-still-worth-it-in-2025",
    title: "Is Influencer Marketing Still Worth It in 2025?",
    category: "Marketing",
    excerpt: "Micro-influencers, authenticity and measurable ROI — why influencer marketing is evolving, not dying.",
    cover: "/blog/b4.jpg",
    published_at: "2025-01-31",
    content: p(
      "Influencer marketing has matured. Audiences can spot a scripted ad instantly — authenticity is now the currency.",
      "Micro and nano creators deliver higher engagement and better ROI for most brands. Track every collaboration with UTM links and unique codes so you know exactly what works.",
    ),
  },
  {
    slug: "how-ai-is-reshaping-the-future-of-digital-marketing",
    title: "How AI Is Reshaping the Future of Digital Marketing",
    category: "Ideas",
    excerpt: "From AI-generated creatives to predictive bidding — what changes, and what still needs a human touch.",
    cover: "/blog/b5.jpg",
    published_at: "2025-01-08",
    content: p(
      "AI now writes ad variations, predicts which leads will convert and optimises bids in real time.",
      "But strategy, brand voice and genuine creativity remain human strengths. The winners will be teams that use AI to move faster while keeping their brand unmistakably human.",
    ),
  },
  {
    slug: "top-digital-marketing-trends-to-watch-in-2025",
    title: "Top Digital Marketing Trends to Watch in 2025",
    category: "Ideas",
    excerpt: "Short-form video, search beyond Google, first-party data and AI — the trends shaping growth this year.",
    cover: "/blog/b6.jpg",
    published_at: "2025-01-01",
    content: p(
      "Short-form video keeps dominating attention. Search is fragmenting across YouTube, Instagram and AI assistants. Privacy changes make first-party data more valuable than ever.",
      "Brands that invest in owned channels — website, email, community — will be the most resilient.",
    ),
  },
];

export const faqs: Faq[] = [
  { question: "What services does Vishnu IT offer?", answer: "Web design & development, e-commerce, app development, SEO, social media marketing, Google & Meta Ads, branding, logo design and UI/UX — everything you need to grow online, under one roof.", sort: 1 },
  { question: "How long does a project take?", answer: "A Starter website goes live in 5–7 days, Growth projects in 2–3 weeks, and custom Premium platforms in 4+ weeks. You get a clear timeline before we begin.", sort: 2 },
  { question: "How much does a project cost?", answer: "Websites start at just ₹9,999 (Starter), ₹19,999 for Growth and ₹39,999+ for Premium custom projects. Every project gets a clear quote upfront — no hidden costs.", sort: 3 },
  { question: "Will my website be mobile-friendly and fast?", answer: "Yes. Every site is fully responsive, optimised for Core Web Vitals and built to load fast on 4G connections.", sort: 4 },
  { question: "Do you offer support after launch?", answer: "Yes — every plan includes free support, and we offer monthly maintenance, security and marketing retainers.", sort: 5 },
  { question: "Can you improve SEO for my existing website?", answer: "Absolutely. We start with a full technical and content audit, then share a prioritised improvement plan.", sort: 6 },
  { question: "Which industries do you work with?", answer: "E-commerce, fintech, healthcare, education, real estate, travel, immigration, legal, spiritual/religious organisations, SaaS and more.", sort: 7 },
  { question: "How do I get started?", answer: "Fill in the contact form or WhatsApp us. We'll book a free consultation, understand your goals and send a proposal within 24 hours.", sort: 8 },
];

export const brands: Brand[] = [
  { name: "Google Partner", logo: "/partners/google_partner.png", url: "", kind: "partner", sort: 1 },
  { name: "Clutch", logo: "/partners/clutch_partner.png", url: "", kind: "partner", sort: 2 },
  { name: "GoodFirms", logo: "/partners/goodfirms_partner.png", url: "", kind: "partner", sort: 3 },
  { name: "WooRank", logo: "/partners/woorank_partner.png", url: "", kind: "partner", sort: 4 },
  { name: "Crunchbase", logo: "/partners/crunchbase.jpg", url: "", kind: "partner", sort: 5 },
  { name: "DesignRush", logo: "/partners/designrush.jpg", url: "", kind: "partner", sort: 6 },
];

export const settings: Record<string, unknown> = {
  branding: {
    siteName: "Vishnu IT Solutions",
    shortName: "Vishnu IT",
    tagline: "Next-Gen IT Solutions",
    logoLight: "/brand/vishnuit-vishnu-logo-white.png",
    logoDark: "/brand/vishnuit-vishnu-logo-black.png",
    accent: "#1d4ed8",
    favicon: "/icon.png",
  },
  hero: {
    badge: "India's premier digital growth agency",
    title: "Boosting Growth with",
    words: ["Web Development", "SEO", "Digital Marketing", "Branding", "UI/UX Design"],
    subtitle:
      "We design, build and market premium digital experiences — websites, apps, SEO and performance marketing that turn visitors into customers.",
    primaryCta: "Start your project",
    secondaryCta: "View our work",
  },
  stats: [
    { label: "Projects delivered", value: 150, suffix: "+" },
    { label: "Happy clients", value: 120, suffix: "+" },
    { label: "Years of experience", value: 4, suffix: "+" },
    { label: "Client rating", value: 4.9, suffix: "/5" },
  ],
  contact: {
    email: "surajp4028@gmail.com",
    phone: "+91 79826 24533",
    whatsapp: "917982624533",
    address: "Gandhi Nagar, Delhi 110031, India",
    hours: "Mon – Sat, 10:00 AM – 7:00 PM IST",
    mapEmbed: "https://www.google.com/maps?q=Gandhi+Nagar,+Delhi+110031&output=embed",
  },
  social: {
    linkedin: "https://www.linkedin.com/in/suraj-pandey-225459197",
    instagram: "https://www.instagram.com/vishnuit.co.in/",
    facebook: "https://www.facebook.com/vishnuit.co.in/",
    twitter: "",
    youtube: "",
    github: "",
  },
  seo: {
    title: "Vishnu IT Solutions | Web Development, SEO & Digital Marketing Agency in Delhi",
    description:
      "Vishnu IT Solutions is a Delhi-based digital agency for website design, Next.js & WordPress development, e-commerce, SEO, Google & Meta Ads, branding and UI/UX.",
    keywords: "digital marketing agency delhi, web development company, seo services india, nextjs development, wordpress agency, google ads agency",
    ogImage: "/og-logo.png",
  },
  founder: {
    name: "Suraj Pandey",
    role: "Founder & Fullstack Developer",
    photo: "/images/suraj-portrait.jpg",
    bio: "Fullstack developer with 4+ years of experience shipping fast, secure web products — merchant onboarding platforms, payment gateway integrations, trading APIs and CMS dashboards. Founder of Vishnu IT Solutions.",
    cv: "/Suraj-Pandey-CV.pdf",
    portfolio: "https://surajportfolio-coral.vercel.app/",
  },
  conversion: {
    whatsappButton: true,
    stickyCta: true,
    leadNotify: true,
    payNowButton: true,
    payNowMobile: false,
    announcement: "Free website audit for new clients this month — limited slots!",
  },
};
