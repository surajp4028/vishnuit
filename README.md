# Vishnu IT Solutions — Next.js + MySQL

Premium agency website + admin dashboard. Next.js 16 (App Router), Tailwind v4, Motion / Aceternity UI, MySQL (mysql2), Resend email, Razorpay payments.

## Run locally
1. Start MySQL (XAMPP MariaDB on port 3307 is configured in `.env.local`).
2. `npm install`
3. `npm run db:setup` — creates database `vishnuit`, all tables, seeds content and the admin user. (`npm run db:setup -- --reset` reseeds content.)
4. `npm run dev` → http://localhost:3000 · Admin: http://localhost:3000/admin

## Admin
Dashboard (leads, conversion funnel, revenue) · Leads & Conversions (status, notes, CSV) · Payments & Clients (Razorpay purchases, project status, CSV) · Services · Portfolio (cover + gallery/admin screenshots) · Testimonials · Blog & News · Pricing Plans · FAQs · Brands & Partners · Settings & Branding (logos, colours, hero, stats, contact, social, SEO, founder, conversion toggles, password).

## Integrations
- **Resend**: contact form saves a lead to MySQL and emails `CONTACT_TO_EMAIL`. Use a verified domain in `CONTACT_FROM_EMAIL` for production.
- **Razorpay**: Buy buttons on pricing → `/api/payments/order` (price read from DB) → Checkout → `/api/payments/verify` (HMAC signature). Webhook: `/api/payments/webhook` (events `payment.captured`, `payment.failed`). Currently **test-mode keys** — swap to live keys to accept real payments.

## Deploying to Vercel (Aiven MySQL)
1. `.env.vercel` holds production values: Aiven host/port/user/password, `DB_NAME=vishnuit`, `DB_SSL=true` and a fresh `AUTH_SECRET`. It is gitignored.
2. Database: `npm run db:setup:prod` creates/seeds `vishnuit` on Aiven. This has already been run once, and it is safe to re-run — it only fills empty tables.
3. Vercel → New Project → import this repo → Settings → Environment Variables → **Import .env** → upload `.env.vercel`, then Deploy.
4. Domain: Vercel → Domains → add `vishnuit.co.in` and `www.vishnuit.co.in`. At your registrar, point `@` A record → `76.76.21.21` and `www` CNAME → `cname.vercel-dns.com`. This switches traffic away from WordPress.
5. Razorpay → Settings → Webhooks → `https://www.vishnuit.co.in/api/payments/webhook`, events `payment.captured` and `payment.failed`, with the secret from `RAZORPAY_WEBHOOK_SECRET`. Swap in `rzp_live_…` keys to take real payments.
6. Resend → verify `vishnuit.co.in`, then set `CONTACT_FROM_EMAIL=Vishnu IT Solutions <hello@vishnuit.co.in>`.

Admin image uploads are stored in MySQL (`media` table, served at `/media/:id`), so they work on Vercel's read-only filesystem. The limit is 4 MB per image.
