// Creates the `vishnuit` database + tables and seeds content and the admin user.
// Run: npm run db:setup        (only fills empty tables)
//      npm run db:setup -- --reset   (wipes content tables and reseeds; leads/admins kept)
import mysql from "mysql2/promise";
import { readFileSync } from "node:fs";
import { scryptSync, randomBytes } from "node:crypto";
import { services, plans, testimonials, posts, faqs, brands, settings } from "../src/data/seed.ts";
import { SERVICE_DETAILS } from "../src/data/service-details.ts";

const projects = JSON.parse(readFileSync(new URL("../src/data/projects.json", import.meta.url), "utf8"));
const reset = process.argv.includes("--reset");
const env = process.env;
const DB = (env.DB_NAME || "vishnuit").replace(/[^a-zA-Z0-9_]/g, "");

function hash(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}

const conn = await mysql.createConnection({
  host: env.DB_HOST || "127.0.0.1",
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER || "root",
  password: env.DB_PASS || "",
  multipleStatements: true,
  ssl: env.DB_SSL === "true"
    ? env.DB_SSL_CA ? { ca: env.DB_SSL_CA.replace(/\\n/g, "\n"), rejectUnauthorized: true } : { rejectUnauthorized: false }
    : undefined,
  connectTimeout: 15000,
});
await conn.query("CREATE DATABASE IF NOT EXISTS `" + DB + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
await conn.query("USE `" + DB + "`");
await conn.query(readFileSync(new URL("../src/lib/schema.sql", import.meta.url), "utf8"));
console.log(`✓ database "${DB}" and tables ready`);

// Additive migrations (safe to re-run; MySQL 8 has no ADD COLUMN IF NOT EXISTS)
for (const sql of [
  "ALTER TABLE leads ADD COLUMN city VARCHAR(80) NULL AFTER budget",
  "ALTER TABLE leads ADD COLUMN utm TEXT NULL AFTER page",
  "ALTER TABLE payments ADD COLUMN user_id INT NULL AFTER plan_name",
  "ALTER TABLE payments ADD COLUMN invoice_key VARCHAR(400) NULL AFTER paid_at",
  "ALTER TABLE payments ADD INDEX idx_user (user_id)",
  "ALTER TABLE payments ADD COLUMN kind VARCHAR(20) NOT NULL DEFAULT 'service' AFTER user_id",
  "ALTER TABLE payments ADD COLUMN meta JSON NULL AFTER notes",
  "ALTER TABLE stores ADD COLUMN reminder_sent_at DATETIME NULL AFTER plan_expires_at",
  "ALTER TABLE store_orders ADD COLUMN rzp_order_id VARCHAR(64) NULL AFTER utr",
  "ALTER TABLE payments MODIFY amount DECIMAL(10,2) NOT NULL",
  "ALTER TABLE stores ADD COLUMN tax JSON NULL AFTER payments",
  "ALTER TABLE stores ADD COLUMN testimonials JSON NULL AFTER tax",
  "ALTER TABLE stores ADD COLUMN storefront JSON NULL AFTER testimonials",
  "ALTER TABLE store_orders MODIFY status VARCHAR(20) NOT NULL DEFAULT 'new'",
  "ALTER TABLE store_orders ADD COLUMN status_log JSON NULL AFTER status",
  "ALTER TABLE store_orders ADD COLUMN tracking JSON NULL AFTER status_log",
  "ALTER TABLE store_categories ADD COLUMN parent_id INT NULL AFTER store_id",
  "ALTER TABLE store_orders ADD COLUMN items_total DECIMAL(10,2) NULL AFTER items",
  "ALTER TABLE store_orders ADD COLUMN shipping DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER items_total",
  "ALTER TABLE store_orders ADD COLUMN tax JSON NULL AFTER shipping",
  "ALTER TABLE store_orders ADD COLUMN state VARCHAR(4) NULL AFTER address",
  "ALTER TABLE store_products ADD COLUMN gst_rate DECIMAL(4,2) NULL AFTER compare_price",
  "ALTER TABLE store_products ADD COLUMN hsn VARCHAR(12) NULL AFTER gst_rate",
]) {
  try { await conn.query(sql); console.log("✓ migrated:", sql.slice(0, 60)); }
  catch (e) { if (!["ER_DUP_FIELDNAME", "ER_DUP_KEYNAME"].includes((e as { code?: string }).code ?? "")) throw e; }
}

const j = (v: unknown) => JSON.stringify(v ?? null);
async function isEmpty(table: string) {
  if (reset) await conn.query("TRUNCATE TABLE " + table);
  const [rows] = await conn.query("SELECT COUNT(*) AS c FROM " + table);
  return Number((rows as { c: number }[])[0].c) === 0;
}

if (await isEmpty("services"))
  for (const s of services)
    await conn.execute(
      "INSERT INTO services (slug,title,category,icon,short,description,features,process,image,sort) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [s.slug, s.title, s.category, s.icon, s.short, s.description, j(s.features), j(s.process), s.image ?? SERVICE_DETAILS[s.slug]?.image ?? null, s.sort],
    );
if (await isEmpty("projects"))
  for (const p of projects)
    await conn.execute(
      "INSERT INTO projects (slug,title,tagline,category,client,year,role,summary,overview,highlights,tools,url,cover,gallery,featured,sort) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      [p.slug, p.title, p.tagline, p.category, p.client, p.year, p.role, p.summary, j(p.overview), j(p.highlights), j(p.tools), p.url, p.cover || null, j(p.gallery), p.featured ? 1 : 0, p.sort],
    );
if (await isEmpty("testimonials"))
  for (const t of testimonials)
    await conn.execute("INSERT INTO testimonials (name,role,quote,avatar,rating,sort) VALUES (?,?,?,?,?,?)", [t.name, t.role, t.quote, t.avatar, t.rating, t.sort]);
if (await isEmpty("posts"))
  for (const p of posts)
    await conn.execute("INSERT INTO posts (slug,title,category,excerpt,content,cover,published_at) VALUES (?,?,?,?,?,?,?)", [p.slug, p.title, p.category, p.excerpt, p.content, p.cover, p.published_at]);
if (await isEmpty("plans"))
  for (const p of plans)
    await conn.execute("INSERT INTO plans (name,price,suffix,tagline,features,highlighted,cta,sort) VALUES (?,?,?,?,?,?,?,?)", [p.name, p.price, p.suffix, p.tagline, j(p.features), p.highlighted ? 1 : 0, p.cta, p.sort]);
if (await isEmpty("faqs"))
  for (const f of faqs) await conn.execute("INSERT INTO faqs (question,answer,sort) VALUES (?,?,?)", [f.question, f.answer, f.sort]);
if (await isEmpty("brands"))
  for (const b of brands) await conn.execute("INSERT INTO brands (name,logo,url,kind,sort) VALUES (?,?,?,?,?)", [b.name, b.logo, b.url, b.kind, b.sort]);
for (const [k, v] of Object.entries(settings))
  await conn.execute(reset ? "REPLACE INTO settings (k,v) VALUES (?,?)" : "INSERT IGNORE INTO settings (k,v) VALUES (?,?)", [k, j(v)]);
console.log("✓ content seeded");

const email = env.SEED_ADMIN_EMAIL;
const pw = env.SEED_ADMIN_PASSWORD;
if (email && pw) {
  const [rows] = await conn.execute("SELECT id FROM admins WHERE email=?", [email]);
  if ((rows as unknown[]).length === 0) {
    await conn.execute("INSERT INTO admins (email,name,password_hash) VALUES (?,?,?)", [email, "Suraj Pandey", hash(pw)]);
    console.log(`✓ admin created: ${email}`);
  } else console.log(`• admin ${email} already exists (password unchanged)`);
}
await conn.end();
