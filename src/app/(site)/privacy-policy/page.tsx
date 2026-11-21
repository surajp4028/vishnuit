import type { Metadata } from "next";
import { PageHeader } from "@/components/sections/blocks";
import { ConsentReset } from "@/components/consent-banner";
import { getSettings } from "@/lib/server/content";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy-policy" } };

const UPDATED = "21 November 2026";

export default async function Privacy() {
  const { branding, contact, founder } = await getSettings();
  const name = branding.siteName || "Vishnu IT Solutions";
  const officer = founder?.name?.trim() || "Grievance Officer";
  const mail = <a href={`mailto:${contact.email}`}>{contact.email}</a>;
  return (
    <>
      <PageHeader eyebrow="Legal" title="Privacy" highlight="Policy" subtitle={`Last updated: ${UPDATED}`} />
      <div className="container-x prose-vit max-w-3xl pb-20">
        <p>
          This policy explains, in plain English, what personal data {name} (&quot;we&quot;, &quot;us&quot;) collects, why, who we share it with, how long we keep it and the
          rights you have. It is written for the Digital Personal Data Protection Act, 2023 (DPDP Act), the Information Technology Act, 2000 and the
          IT (Reasonable Security Practices) Rules, 2011 and IT (Intermediary Guidelines) Rules, 2021, and the Consumer Protection (E-Commerce) Rules, 2020.
        </p>

        <h2 id="who">1. Who we are</h2>
        <p>
          {name} is a web design, development and digital services business based in Delhi, India ({contact.address}). We run this website, client
          accounts, and <strong>Vishnu Stores</strong> — online stores that independent sellers run on our platform at vishnuit.co.in/catalog/@store-name or on the
          seller&apos;s own domain. For data about you as our visitor, client or account holder, we are the <strong>data fiduciary</strong>.
        </p>

        <h2 id="collect">2. What we collect</h2>
        <ul>
          <li><strong>Account details:</strong> name, email address, mobile number, company/GSTIN (optional) and a hashed password if you set one.</li>
          <li><strong>Google sign-in:</strong> if you choose &quot;Continue with Google&quot;, we receive your name, email, Google account ID and profile photo.</li>
          <li><strong>Profile photo</strong> you upload.</li>
          <li><strong>Enquiries:</strong> name, email, phone, service, budget and message you send through our forms.</li>
          <li><strong>Orders on seller stores:</strong> name, phone, email, delivery address, state, optional GSTIN/company, items ordered and payment status.</li>
          <li><strong>Payments:</strong> handled by Razorpay. We receive the order/payment IDs, amount and status — <strong>we never see or store your card, UPI PIN or bank login</strong>.</li>
          <li><strong>Files you upload</strong> (e.g. product images and videos for a store), stored on Amazon Web Services S3 in the Mumbai (ap-south-1) region.</li>
          <li><strong>Technical data:</strong> IP address, browser and device type and pages visited, kept in server logs for security.</li>
          <li><strong>Advertising & analytics data — only with your consent:</strong> Meta Pixel / Meta Conversions API (which receives your email and phone only in hashed form) and Google Analytics.</li>
        </ul>

        <h2 id="use">3. Why we use it</h2>
        <ul>
          <li>To create and secure your account, log you in (including OTP by SMS) and keep you signed in.</li>
          <li>To reply to enquiries, prepare proposals, deliver services and issue invoices.</li>
          <li>To run seller stores: place orders, send order updates and let the seller fulfil them.</li>
          <li>To process payments and prevent fraud and misuse.</li>
          <li>To send service emails (receipts, password reset, order status). We don&apos;t send marketing without your permission.</li>
          <li>With your consent only: to measure visits and the performance of our ads.</li>
          <li>To meet legal duties, such as GST and tax record-keeping, and to respond to lawful requests from authorities.</li>
        </ul>

        <h2 id="basis">4. Legal basis & consent</h2>
        <p>
          We process personal data on the basis of your <strong>consent</strong> (given when you sign up, submit a form, place an order or accept the cookie banner) and for
          <strong> legitimate uses</strong> allowed by Section 7 of the DPDP Act — for example, when you voluntarily give us data to get a service, or where the law requires us
          to keep records. You can withdraw consent at any time (see &quot;Your rights&quot;); withdrawal doesn&apos;t affect what was done before it, and we may then be unable
          to provide a service that needs that data.
        </p>

        <h2 id="share">5. Who we share it with</h2>
        <p>We <strong>never sell or rent</strong> your personal data. We share only what is needed:</p>
        <ul>
          <li><strong>The seller you buy from</strong> on a Vishnu Store gets your order and delivery details so they can ship to you.</li>
          <li><strong>Our service providers (data processors),</strong> under contract and only for the purposes above:
            <ul>
              <li>Razorpay — payments</li>
              <li>Amazon Web Services (S3, Mumbai) — file storage</li>
              <li>Resend and Zoho ZeptoMail — transactional email</li>
              <li>Fast2SMS — OTP and order SMS</li>
              <li>Google — sign-in (if you use it) and Google Analytics (with consent)</li>
              <li>Meta Platforms — Meta Pixel / Conversions API (with consent)</li>
              <li>Our hosting and database providers</li>
            </ul>
          </li>
          <li><strong>Authorities</strong> when required by Indian law or a valid legal order.</li>
        </ul>
        <p>Some of these providers may process data outside India; we only use providers that offer appropriate safeguards and as permitted under the DPDP Act.</p>

        <h2 id="stores">6. Data on seller stores</h2>
        <p>
          Each Vishnu Store is run by an independent seller, whose name, GSTIN (if registered), address and contact details are shown at the bottom of every store page.
          For the orders and customer details on their store, <strong>the seller is the data fiduciary</strong> and decides how that data is used; {name} acts as a
          <strong> data processor</strong> that hosts the store and processes the data on the seller&apos;s behalf. Questions about an order should go to the seller first.
          If the seller doesn&apos;t resolve your complaint, you can contact our Grievance Officer below.
        </p>

        <h2 id="retention">7. How long we keep it</h2>
        <ul>
          <li>Account data: while your account is active. When you delete your account, we remove your name, email, phone, photo and logins.</li>
          <li>Invoices, payments and order records: <strong>8 years</strong>, as required by GST and income-tax law — after account deletion these are kept without your contact details where possible.</li>
          <li>Enquiries: up to 3 years, unless you ask us to delete them sooner.</li>
          <li>OTP and password-reset codes: minutes; server security logs: up to 180 days.</li>
        </ul>

        <h2 id="rights">8. Your rights</h2>
        <p>Under the DPDP Act you can:</p>
        <ul>
          <li><strong>Access</strong> a summary of your personal data and who we shared it with.</li>
          <li><strong>Correct or update</strong> it — most of it directly in <a href="/account?tab=profile">My account → Profile</a>.</li>
          <li><strong>Erase</strong> it — use &quot;Delete my account&quot; in your profile, or email us.</li>
          <li><strong>Withdraw consent</strong>, including for cookies (see below).</li>
          <li><strong>Grievance redressal</strong> — complain to our Grievance Officer, and if unsatisfied, to the Data Protection Board of India.</li>
          <li><strong>Nominate</strong> someone to exercise these rights for you in case of death or incapacity — email us with their name and contact details.</li>
        </ul>
        <p>To use any right, email {mail} from your registered email (or tell us your registered mobile). We may verify your identity before acting.</p>

        <h2 id="cookies">9. Cookies</h2>
        <p>
          We use <strong>essential cookies</strong> to keep you logged in, remember your cart and keep the site secure — these don&apos;t need consent. <strong>Analytics and advertising
          cookies</strong> (Meta Pixel, Google Analytics — including those a seller adds to their own store) are loaded <strong>only if you click &quot;Accept&quot;</strong> on the cookie
          banner. &quot;Reject&quot; is just as easy, and your choice is remembered in a <code>vit_consent</code> cookie on that site. You can change your mind at any time:{" "}
          <ConsentReset label="change cookie settings" className="font-semibold text-accent underline underline-offset-[3px]" />.
        </p>

        <h2 id="children">10. Children</h2>
        <p>
          Our services are for people aged 18 and above. We don&apos;t knowingly collect data from children or track them for advertising. If you believe a child has given us
          data without verifiable parental consent, contact us and we will delete it.
        </p>

        <h2 id="security">11. Security</h2>
        <p>
          We use HTTPS everywhere, hashed passwords (scrypt), signed and site-bound login sessions, one-time codes with attempt limits, private storage with time-limited links,
          and access limited to authorised staff. No system is perfectly secure; if a personal data breach affects you, we will inform you and the Data Protection Board as the
          law requires.
        </p>

        <h2 id="changes">12. Changes</h2>
        <p>We may update this policy. The date at the top shows the latest version; for important changes we will notify account holders by email.</p>

        <h2 id="grievance">13. Grievance Officer</h2>
        <p>For any complaint or request about your personal data, or about a Vishnu Store, contact:</p>
        <p>
          <strong>{officer}</strong>
          <br />
          Grievance Officer, {name}
          <br />
          Email: {mail}
          <br />
          Phone: <a href={`tel:${contact.phone.replace(/\s+/g, "")}`}>{contact.phone}</a>
          <br />
          Address: {contact.address}
          {contact.hours && (
            <>
              <br />
              Hours: {contact.hours}
            </>
          )}
        </p>
        <p>We acknowledge complaints within 24 hours (48 hours at most) and resolve them within <strong>30 days</strong> of receipt.</p>
      </div>
    </>
  );
}
