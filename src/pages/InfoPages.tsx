import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { buildWhatsAppLink, formatAed } from '../lib/uae';

export function AboutPage() {
  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl flex flex-col gap-2xl">
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
        <div className="lg:col-span-7 flex flex-col gap-md">
          <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
            About HYGIENOVO
          </span>
          <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface text-balance">
            A Cleaner Standard for Every Space in the UAE.
          </h1>
          <p className="font-body text-body-lg text-light-on-surface-variant max-w-prose">
            HYGIENOVO is a UAE-based online commercial and residential hygiene supply platform. By partnering directly with vetted UAE wholesalers and operating an agile online-first fulfillment model without unnecessary warehouse overhead, we deliver dependable cleaning chemicals, washroom consumables, paper products, and janitorial equipment across Dubai and all seven Emirates.
          </p>
          <div className="flex flex-wrap gap-md pt-xs">
            <Link
              to="/catalogue"
              className="px-lg py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary transition-colors"
            >
              Explore Catalogue
            </Link>
            <Link
              to="/b2b-quote"
              className="px-lg py-3 rounded border border-light-outline-variant font-label text-label-lg text-light-on-surface hover:border-light-primary"
            >
              Request a Business Quote
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5 bg-deep-forest text-pure-white rounded-lg p-xl flex flex-col gap-md">
          <h2 className="font-headline text-headline-sm">Who We Serve</h2>
          <ul className="flex flex-col gap-sm font-body text-body-md text-fresh-mint">
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span>
              Corporate Offices &amp; Co-Working Spaces
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span>
              Building &amp; Facility Management Teams
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span>
              Commercial Cleaning Contractors
            </li>
            <li className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span>
              Hospitality, Clinics &amp; Residential Homes
            </li>
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
          <span className="material-symbols-outlined text-light-primary text-[28px] mb-sm">inventory</span>
          <h3 className="font-title text-title-md text-light-on-surface mb-xs">Wholesaler-Direct Sourcing</h3>
          <p className="font-body text-body-md text-light-on-surface-variant">
            Every SKU is sourced from established UAE distributors so commercial buyers get authentic formulations and consistent pack sizes.
          </p>
        </div>
        <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
          <span className="material-symbols-outlined text-light-primary text-[28px] mb-sm">receipt_long</span>
          <h3 className="font-title text-title-md text-light-on-surface mb-xs">UAE VAT &amp; TRN Ready</h3>
          <p className="font-body text-body-md text-light-on-surface-variant">
            Transparent AED pricing with 5% UAE VAT calculation and optional 15-digit Tax Registration Number support at checkout.
          </p>
        </div>
        <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
          <span className="material-symbols-outlined text-light-primary text-[28px] mb-sm">local_shipping</span>
          <h3 className="font-title text-title-md text-light-on-surface mb-xs">All-Emirates Coverage</h3>
          <p className="font-body text-body-md text-light-on-surface-variant">
            Scheduled dispatch across Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, and Umm Al Quwain.
          </p>
        </div>
      </section>
    </div>
  );
}

export function ContactPage() {
  const { storeConfig, showToast } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const whatsappUrl = buildWhatsAppLink(
    storeConfig.whatsappNumber,
    'Hello HYGIENOVO Support, I have an enquiry regarding a UAE cleaning supplies order.'
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      setSent(true);
      setName('');
      setEmail('');
      setPhone('');
      setSubject('');
      setMessage('');
      showToast('Message sent to HYGIENOVO UAE Desk');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl">
      <div className="max-w-2xl mb-xl">
        <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">Contact Us</span>
        <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface mt-xs">
          Reach Our UAE Commercial &amp; Customer Desk
        </h1>
        <p className="font-body text-body-lg text-light-on-surface-variant mt-xs">
          Questions about product specifications, delivery schedules, or bulk procurement? Send a message below or connect on WhatsApp.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-8 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl shadow-sm grid grid-cols-1 md:grid-cols-2 gap-md"
        >
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">Your Name *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">Email Address *</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">UAE Phone (Optional)</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+971 50 000 0000"
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">Subject *</span>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Order delivery schedule / Product spec"
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <label className="md:col-span-2 flex flex-col gap-xs">
            <span className="font-label text-label-md">Message *</span>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>

          {error && (
            <div className="md:col-span-2 p-sm rounded bg-light-error-container text-light-on-error-container font-body text-body-sm">
              {error}
            </div>
          )}
          {sent && (
            <div className="md:col-span-2 p-md rounded bg-light-primary-container text-light-on-primary-container font-body text-body-sm">
              Thank you — your message has been received by our Dubai procurement team.
            </div>
          )}

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={sending}
              className="px-xl py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-60"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>

        <aside className="lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-deep-forest text-pure-white rounded-lg p-xl flex flex-col gap-md">
            <h2 className="font-headline text-headline-sm">Dubai Operations Desk</h2>
            <p className="font-body text-body-md text-fresh-mint">
              Online-only commercial &amp; residential supply across the United Arab Emirates.
            </p>
            <div className="font-body text-body-sm text-fresh-mint/90 flex flex-col gap-xs">
              <p>Support Hours: Mon – Sat, 8:30 AM – 6:00 PM GST</p>
              <p>Region: Dubai &amp; All 7 Emirates, UAE</p>
            </div>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-xs inline-flex items-center justify-center gap-2 py-2.5 px-md rounded bg-light-primary text-pure-white font-label text-label-md hover:bg-pure-white hover:text-deep-forest transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Chat on WhatsApp</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function FaqPage() {
  const { storeConfig } = useStore();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Where in the UAE does HYGIENOVO deliver?',
      a: `We deliver across all seven Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah. Standard Dubai delivery is ${formatAed(storeConfig.dubaiDeliveryFee)} and other Emirates are ${formatAed(storeConfig.otherEmiratesDeliveryFee)}, with free delivery on orders above ${formatAed(storeConfig.freeDeliveryThreshold)}.`,
    },
    {
      q: 'Do residential customers and small offices need a business account to order?',
      a: 'No. Both commercial organizations (offices, facility managers, cleaning contractors) and individual residential buyers can shop online directly or check out as a guest.',
    },
    {
      q: 'Is 5% UAE VAT applied to orders?',
      a: `Yes, ${(storeConfig.vatRate * 100).toFixed(0)}% UAE VAT is calculated transparently at checkout. Commercial customers can enter their 15-digit UAE Tax Registration Number (TRN) during checkout or in their account profile.`,
    },
    {
      q: 'What payment methods are supported?',
      a: 'HYGIENOVO supports Cash on Delivery (COD), B2B Bank Transfer, and configurable UAE Card / Apple Pay gateway integration points.',
    },
    {
      q: 'How do bulk and multi-building quotations work?',
      a: 'Use our Request a Quote page to submit your SKU list, estimated volume, and Emirate delivery schedule. Our procurement desk prepares custom volume pricing in AED.',
    },
  ];

  return (
    <div className="max-w-3xl w-full mx-auto px-md py-2xl">
      <div className="mb-xl">
        <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">Help Centre</span>
        <h1 className="font-headline text-display-md-mobile lg:text-headline-lg text-light-on-surface mt-xs">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="flex flex-col gap-sm">
        {faqs.map((item, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-lg flex items-center justify-between text-left gap-md"
              >
                <span className="font-title text-title-md text-light-on-surface">{item.q}</span>
                <span className="material-symbols-outlined text-light-primary shrink-0">
                  {isOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {isOpen && (
                <div className="px-lg pb-lg font-body text-body-md text-light-on-surface-variant border-t border-light-outline-variant pt-md">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DeliveryReturnsPage() {
  const { storeConfig } = useStore();
  return (
    <div className="max-w-4xl w-full mx-auto px-md py-2xl flex flex-col gap-lg">
      <div>
        <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">Logistics</span>
        <h1 className="font-headline text-display-md-mobile lg:text-headline-lg text-light-on-surface mt-xs">
          UAE Delivery &amp; Returns Policy
        </h1>
      </div>
      <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl flex flex-col gap-md font-body text-body-md text-light-on-surface-variant">
        <h2 className="font-title text-title-lg text-light-on-surface">1. UAE Delivery Rates &amp; Schedule</h2>
        <p>
          Orders across Dubai are dispatched within 1–2 business days at a standard rate of{' '}
          <strong className="text-light-on-surface">{formatAed(storeConfig.dubaiDeliveryFee)}</strong>. Deliveries to Abu Dhabi, Sharjah, Ajman, Umm Al Quwain, Ras Al Khaimah, and Fujairah are fulfilled within 2–3 business days at{' '}
          <strong className="text-light-on-surface">{formatAed(storeConfig.otherEmiratesDeliveryFee)}</strong>.
        </p>
        <p>
          Orders exceeding <strong className="text-light-on-surface">{formatAed(storeConfig.freeDeliveryThreshold)}</strong> qualify for complimentary standard UAE delivery.
        </p>
        <h2 className="font-title text-title-lg text-light-on-surface pt-sm">2. Damaged or Incorrect Items</h2>
        <p>
          Inspect commercial cartons upon arrival. Report any leaking 5L jerrycans, damaged mop hardware, or quantity discrepancies within 48 hours of delivery with your order number for rapid replacement.
        </p>
        <h2 className="font-title text-title-lg text-light-on-surface pt-sm">3. Unopened Commercial Returns</h2>
        <p>
          Unopened, tamper-seal-intact items in original packaging may be returned within 7 days of delivery. Opened cleaning chemicals and personal protective equipment cannot be restocked for hygiene safety.
        </p>
      </div>
    </div>
  );
}

export function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl w-full mx-auto px-md py-2xl flex flex-col gap-lg">
      <div>
        <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">Legal</span>
        <h1 className="font-headline text-display-md-mobile lg:text-headline-lg text-light-on-surface mt-xs">
          Privacy Policy
        </h1>
      </div>
      <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl flex flex-col gap-md font-body text-body-md text-light-on-surface-variant">
        <p>
          HYGIENOVO collects customer contact names, UAE delivery addresses, phone numbers, company names, and optional Tax Registration Numbers (TRN) strictly to fulfill cleaning and hygiene supply orders, issue VAT invoices, and coordinate UAE courier dispatch.
        </p>
        <p>
          Account passwords are encrypted with per-user cryptographic salts, and session tokens are verified on our servers. We do not sell or rent commercial procurement lists or residential buyer information to third parties.
        </p>
        <p>
          For data updates or account deletion requests, please contact our UAE customer desk via the{' '}
          <Link to="/contact" className="text-light-primary underline">Contact Us</Link> page.
        </p>
      </div>
    </div>
  );
}

export function TermsPage() {
  return (
    <div className="max-w-4xl w-full mx-auto px-md py-2xl flex flex-col gap-lg">
      <div>
        <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">Legal</span>
        <h1 className="font-headline text-display-md-mobile lg:text-headline-lg text-light-on-surface mt-xs">
          Terms and Conditions
        </h1>
      </div>
      <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl flex flex-col gap-md font-body text-body-md text-light-on-surface-variant">
        <p>
          All prices listed on HYGIENOVO are stated in United Arab Emirates Dirhams (AED). Applicable 5% UAE Value Added Tax (VAT) and Emirate delivery fees are displayed prior to order placement.
        </p>
        <p>
          Commercial cleaning chemicals must be handled and diluted strictly according to manufacturer label instructions and workplace safety protocols.
        </p>
        <p>
          Cash on Delivery orders require payment in AED upon receipt at the specified UAE delivery address. B2B Bank Transfer orders are scheduled for dispatch upon payment confirmation or approved corporate credit terms.
        </p>
      </div>
    </div>
  );
}
