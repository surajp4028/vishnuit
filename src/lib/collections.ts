// Admin CRUD schema shared by the API (server) and the editor UI (client).
export type FieldType = "text" | "textarea" | "html" | "number" | "bool" | "list" | "image" | "images" | "select" | "date" | "pairs" | "icon";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  help?: string;
  full?: boolean;
};

export type Collection = {
  key: string;
  table: string;
  label: string;
  singular: string;
  orderBy: string;
  listColumns: string[];
  imageColumn?: string;
  fields: Field[];
};

const publishedField: Field = { name: "published", label: "Published", type: "bool" };
const sortField: Field = { name: "sort", label: "Sort order", type: "number", help: "Lower shows first" };

export const COLLECTIONS: Record<string, Collection> = {
  services: {
    key: "services",
    table: "services",
    label: "Services",
    singular: "Service",
    orderBy: "sort, id",
    listColumns: ["title", "category"],
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug (URL)", type: "text", help: "Auto-generated from title if empty" },
      { name: "category", label: "Category", type: "select", options: ["Development", "Design", "Digital Marketing", "SEO"], required: true },
      { name: "icon", label: "Icon", type: "icon" },
      { name: "short", label: "Short description", type: "textarea", full: true },
      { name: "description", label: "Full description", type: "textarea", full: true },
      { name: "features", label: "Features (one per line)", type: "list" },
      { name: "process", label: "Process steps (one per line)", type: "list" },
      { name: "image", label: "Image", type: "image" },
      sortField,
      publishedField,
    ],
  },
  projects: {
    key: "projects",
    table: "projects",
    label: "Portfolio",
    singular: "Project",
    orderBy: "featured DESC, sort, id",
    listColumns: ["title", "category", "year"],
    imageColumn: "cover",
    fields: [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "slug", label: "Slug (URL)", type: "text" },
      { name: "tagline", label: "Tagline", type: "text", full: true },
      { name: "category", label: "Category", type: "select", options: ["Fintech", "E-commerce", "Website", "Brand Design", "App", "Marketing"], required: true },
      { name: "client", label: "Client", type: "text" },
      { name: "year", label: "Year", type: "text" },
      { name: "role", label: "Our role", type: "text" },
      { name: "url", label: "Live URL", type: "text" },
      { name: "summary", label: "Summary (cards)", type: "textarea", full: true },
      { name: "overview", label: "Overview paragraphs (one per line)", type: "list", full: true },
      { name: "highlights", label: "Highlights (Title | text, one per line)", type: "pairs", full: true },
      { name: "tools", label: "Tech stack (one per line)", type: "list" },
      { name: "cover", label: "Cover image", type: "image" },
      { name: "gallery", label: "Gallery / admin dashboard screenshots", type: "images", full: true },
      { name: "featured", label: "Featured", type: "bool" },
      sortField,
      publishedField,
    ],
  },
  testimonials: {
    key: "testimonials",
    table: "testimonials",
    label: "Testimonials",
    singular: "Testimonial",
    orderBy: "sort, id",
    listColumns: ["name", "role", "rating"],
    imageColumn: "avatar",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "role", label: "Role / company", type: "text" },
      { name: "quote", label: "Quote", type: "textarea", required: true, full: true },
      { name: "avatar", label: "Avatar", type: "image" },
      { name: "rating", label: "Rating (1-5)", type: "number" },
      sortField,
      publishedField,
    ],
  },
  posts: {
    key: "posts",
    table: "posts",
    label: "Blog & News",
    singular: "Post",
    orderBy: "published_at DESC, id DESC",
    listColumns: ["title", "category", "published_at"],
    imageColumn: "cover",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, full: true },
      { name: "slug", label: "Slug (URL)", type: "text" },
      { name: "category", label: "Category", type: "select", options: ["News", "Development", "Marketing", "SEO", "Design", "Ideas", "Case Study"] },
      { name: "published_at", label: "Publish date", type: "date", required: true },
      { name: "cover", label: "Cover image", type: "image" },
      { name: "excerpt", label: "Excerpt", type: "textarea", full: true },
      { name: "content", label: "Content (HTML: <p>, <h2>, <ul>, <strong>, <a>…)", type: "html", full: true },
      publishedField,
    ],
  },
  plans: {
    key: "plans",
    table: "plans",
    label: "Pricing Plans",
    singular: "Plan",
    orderBy: "sort, id",
    listColumns: ["name", "price", "suffix"],
    fields: [
      { name: "name", label: "Plan name", type: "text", required: true },
      { name: "price", label: "Price (₹)", type: "number", required: true },
      { name: "suffix", label: "Suffix", type: "text", help: "e.g. onwards, +, /month" },
      { name: "cta", label: "Button text", type: "text" },
      { name: "tagline", label: "Tagline", type: "text", full: true },
      { name: "features", label: "Features (one per line)", type: "list", full: true },
      { name: "highlighted", label: "Highlight as most popular", type: "bool" },
      sortField,
      publishedField,
    ],
  },
  faqs: {
    key: "faqs",
    table: "faqs",
    label: "FAQs",
    singular: "FAQ",
    orderBy: "sort, id",
    listColumns: ["question"],
    fields: [
      { name: "question", label: "Question", type: "text", required: true, full: true },
      { name: "answer", label: "Answer", type: "textarea", required: true, full: true },
      sortField,
      publishedField,
    ],
  },
  brands: {
    key: "brands",
    table: "brands",
    label: "Brands & Partners",
    singular: "Brand",
    orderBy: "sort, id",
    listColumns: ["name", "kind"],
    imageColumn: "logo",
    fields: [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "kind", label: "Type", type: "select", options: ["partner", "client"] },
      { name: "logo", label: "Logo", type: "image", required: true },
      { name: "url", label: "Website", type: "text" },
      sortField,
      publishedField,
    ],
  },
};

export const JSON_TYPES: FieldType[] = ["list", "images", "pairs"];
