import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import type { Product } from '../types';

const HERO_IMG = '/src/assets/images/hero_office_hygiene_1795433518175.jpg';

const B2B_TOWER_IMG = '/src/assets/images/b2b_tower_supply_1795433518111.jpg';

export function HomePage() {
  const { categories, showToast } = useStore();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [submittingNewsletter, setSubmittingNewsletter] = useState(false);

  useEffect(() => {
    let active = true;
    apiFetch<Product[]>('/api/products?featured=true')
      .then((data) => {
        if (active) setFeaturedProducts(data.slice(0, 8));
      })
      .catch(() => {
        if (active) setFeaturedProducts([]);
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleNewsletterSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubmittingNewsletter(true);
    try {
      await apiFetch('/api/newsletter', {
        method: 'POST',
        body: JSON.stringify({ email: newsletterEmail }),
      });
      showToast('Subscribed to HYGIENOVO commercial updates');
      setNewsletterEmail('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setSubmittingNewsletter(false);
    }
  }

  return (
    <div>
      {/* SECTION A – HERO */}
      <section className="relative overflow-hidden bg-deep-forest">
        <SafeImage
          src={HERO_IMG}
          alt="Modern Dubai commercial office workspace with organized HYGIENOVO cleaning supplies and equipment"
          className="w-full h-[540px] lg:h-[600px] object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-deep-forest/95 via-deep-forest/70 to-deep-forest/15" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl">
            <div className="max-w-2xl flex flex-col gap-lg">
              <span className="inline-flex self-start items-center gap-2 px-3 py-1 rounded-full bg-light-primary-container text-light-on-primary-container font-label text-label-sm">
                HYGIENOVO • DUBAI, UAE
              </span>
              <h1 className="font-headline text-display-lg-mobile lg:text-display-lg text-pure-white text-balance">
                Everything You Need for a Cleaner Workplace.
              </h1>
              <p className="font-body text-body-lg text-fresh-mint max-w-prose text-pretty">
                Premium cleaning supplies, hygiene essentials and professional equipment for businesses and homes across the UAE.
              </p>
              <div className="flex flex-wrap items-center gap-md pt-xs">
                <Link
                  to="/catalogue"
                  className="inline-flex items-center justify-center gap-sm px-lg py-3.5 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-pure-white hover:text-deep-forest transition-colors"
                >
                  <span>Explore Products</span>
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
                    arrow_forward
                  </span>
                </Link>
                <Link
                  to="/b2b-quote"
                  className="inline-flex items-center justify-center gap-sm px-lg py-3.5 rounded bg-pure-white/10 text-pure-white border border-pure-white/30 font-label text-label-lg hover:bg-pure-white hover:text-deep-forest transition-colors"
                >
                  <span>Request a Business Quote</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B – TRUST STRIP */}
      <section className="bg-light-surface-container-lowest border-b border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl py-lg grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-md bg-light-primary-container text-light-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">business_center</span>
            </div>
            <div>
              <h2 className="font-title text-title-sm text-light-on-surface">Business-Focused Supply</h2>
              <p className="font-body text-body-sm text-light-on-surface-variant">Commercial pack sizes built for teams</p>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-md bg-light-primary-container text-light-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">sell</span>
            </div>
            <div>
              <h2 className="font-title text-title-sm text-light-on-surface">Competitive Bulk Pricing</h2>
              <p className="font-body text-body-sm text-light-on-surface-variant">Volume quotations in AED</p>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-md bg-light-primary-container text-light-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">local_shipping</span>
            </div>
            <div>
              <h2 className="font-title text-title-sm text-light-on-surface">Reliable UAE Delivery</h2>
              <p className="font-body text-body-sm text-light-on-surface-variant">Scheduled dispatch across all Emirates</p>
            </div>
          </div>
          <div className="flex items-center gap-md">
            <div className="w-11 h-11 rounded-md bg-light-primary-container text-light-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">support_agent</span>
            </div>
            <div>
              <h2 className="font-title text-title-sm text-light-on-surface">Dedicated Customer Support</h2>
              <p className="font-body text-body-sm text-light-on-surface-variant">Direct procurement assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION C – SHOP BY CATEGORY */}
      <section className="py-2xl lg:py-section">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
            <div>
              <h2 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface">
                Shop by Category
              </h2>
              <p className="font-body text-body-lg text-light-on-surface-variant mt-xs">
                Six core commercial lines curated for offices, hospitality, facility teams, and homes.
              </p>
            </div>
            <Link
              to="/catalogue"
              className="inline-flex items-center gap-1 font-label text-label-lg text-light-primary hover:underline"
            >
              <span>View Full Catalogue</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg items-stretch">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/category/${cat.slug}`}
                className="group bg-light-surface-container-lowest rounded-lg border border-light-outline-variant overflow-hidden shadow-sm hover:border-light-primary hover:shadow-md transition-all flex flex-col h-full"
              >
                <div className="aspect-[4/3] bg-light-surface-container-low overflow-hidden">
                  <SafeImage
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
                  />
                </div>
                <div className="p-lg flex flex-col flex-1 gap-xs">
                  <h3 className="font-title text-title-lg text-light-on-surface group-hover:text-light-primary">
                    {cat.name}
                  </h3>
                  <p className="font-body text-body-md text-light-on-surface-variant">{cat.description}</p>
                  <span className="mt-auto pt-sm inline-flex items-center gap-1 font-label text-label-md text-light-primary">
                    Explore category <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION D – FEATURED PRODUCTS */}
      <section className="py-2xl lg:py-section bg-light-surface-container-low border-y border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
            <div>
              <h2 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface">
                Featured Commercial Products
              </h2>
              <p className="font-body text-body-lg text-light-on-surface-variant mt-xs">
                High-demand cleaning and hygiene essentials ready for UAE dispatch.
              </p>
            </div>
            <Link
              to="/catalogue"
              className="inline-flex self-start items-center gap-1.5 px-3 py-1.5 rounded-full bg-light-surface-container-lowest border border-light-outline-variant font-label text-label-sm text-light-on-surface-variant hover:border-light-primary"
            >
              Browse All Products →
            </Link>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-light-surface-container-lowest rounded-md border border-light-outline-variant h-96 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg items-stretch">
              {featuredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION E – B2B BUSINESS SOLUTIONS */}
      <section className="relative bg-deep-forest text-light-inverse-on-surface overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl py-2xl lg:py-section grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
          <div className="lg:col-span-6 flex flex-col gap-lg">
            <span className="inline-flex self-start px-3 py-1 rounded-full bg-pure-white/10 text-fresh-mint font-label text-label-sm">
              B2B SUPPLY SOLUTIONS
            </span>
            <h2 className="font-headline text-display-md-mobile lg:text-display-md text-pure-white text-balance">
              Your Business Deserves a Smarter Supply Partner.
            </h2>
            <p className="font-body text-body-lg text-fresh-mint">
              HYGIENOVO supports commercial operations across Dubai and the UAE with consistent wholesaler-sourced stock, clear bulk quotations, and dedicated account coordination for:
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
              <li className="flex items-center gap-2 font-body text-body-md text-pure-white">
                <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span> Office buildings
              </li>
              <li className="flex items-center gap-2 font-body text-body-md text-pure-white">
                <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span> Facility management companies
              </li>
              <li className="flex items-center gap-2 font-body text-body-md text-pure-white">
                <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span> Cleaning contractors
              </li>
              <li className="flex items-center gap-2 font-body text-body-md text-pure-white">
                <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span> Hotels and hospitality
              </li>
              <li className="flex items-center gap-2 font-body text-body-md text-pure-white">
                <span className="material-symbols-outlined text-gold-accent text-[18px]">check_circle</span> Commercial &amp; residential properties
              </li>
            </ul>
            <div className="pt-xs">
              <Link
                to="/b2b-quote"
                className="inline-flex items-center justify-center gap-sm px-lg py-3.5 rounded bg-pure-white text-deep-forest font-label text-label-lg hover:bg-fresh-mint transition-colors"
              >
                <span>Become a Business Customer</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-6">
            <SafeImage
              src={B2B_TOWER_IMG}
              alt="Modern Dubai commercial tower atrium"
              className="w-full h-[360px] lg:h-[420px] object-cover rounded-lg border border-pure-white/15 shadow-lg"
            />
          </div>
        </div>
      </section>

      {/* SECTION F – BULK ORDERING BANNER */}
      <section className="py-2xl">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl">
          <div className="bg-light-primary-container rounded-lg border border-light-outline-variant p-xl lg:p-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-lg">
            <div className="max-w-2xl flex flex-col gap-xs">
              <h2 className="font-headline text-headline-lg text-light-on-primary-container">
                Ordering for Multiple Buildings?
              </h2>
              <p className="font-body text-body-lg text-light-on-primary-container">
                Get customised quotations, bulk pricing and convenient recurring supply arrangements across the UAE.
              </p>
            </div>
            <Link
              to="/b2b-quote"
              className="inline-flex items-center justify-center gap-sm px-lg py-3.5 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary transition-colors shrink-0"
            >
              <span>Request Bulk Pricing</span>
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">request_quote</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SECTION G – WHY HYGIENOVO */}
      <section className="py-2xl lg:py-section bg-light-surface-container-lowest border-y border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl">
          <div className="max-w-xl mb-xl">
            <h2 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface">
              Why HYGIENOVO
            </h2>
            <p className="font-body text-body-lg text-light-on-surface-variant mt-xs">
              Built for procurement teams and households who value speed, clarity, and dependable supply.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg items-stretch">
            <article className="bg-light-surface rounded-md border border-light-outline-variant p-lg flex flex-col gap-sm">
              <span className="material-symbols-outlined text-light-primary text-[28px]" aria-hidden="true">payments</span>
              <h3 className="font-title text-title-md text-light-on-surface">Competitive Pricing</h3>
              <p className="font-body text-body-md text-light-on-surface-variant">
                Transparent AED pricing sourced directly from vetted UAE wholesalers with volume rates.
              </p>
            </article>
            <article className="bg-light-surface rounded-md border border-light-outline-variant p-lg flex flex-col gap-sm">
              <span className="material-symbols-outlined text-light-primary text-[28px]" aria-hidden="true">verified</span>
              <h3 className="font-title text-title-md text-light-on-surface">Carefully Selected Products</h3>
              <p className="font-body text-body-md text-light-on-surface-variant">
                Commercial-grade formulations and durable equipment chosen for daily facility workloads.
              </p>
            </article>
            <article className="bg-light-surface rounded-md border border-light-outline-variant p-lg flex flex-col gap-sm">
              <span className="material-symbols-outlined text-light-primary text-[28px]" aria-hidden="true">bolt</span>
              <h3 className="font-title text-title-md text-light-on-surface">Convenient Ordering</h3>
              <p className="font-body text-body-md text-light-on-surface-variant">
                Order online in minutes with Cash on Delivery or submit a multi-line quotation request.
              </p>
            </article>
            <article className="bg-light-surface rounded-md border border-light-outline-variant p-lg flex flex-col gap-sm">
              <span className="material-symbols-outlined text-light-primary text-[28px]" aria-hidden="true">handshake</span>
              <h3 className="font-title text-title-md text-light-on-surface">Business-Oriented Service</h3>
              <p className="font-body text-body-md text-light-on-surface-variant">
                Dedicated UAE B2B support for consolidated deliveries, 5% VAT TRN invoicing, and reorders.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* SECTION H – BRAND STORY */}
      <section id="brand-story" className="py-2xl lg:py-section">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl grid grid-cols-1 lg:grid-cols-12 gap-xl items-center">
          <div className="lg:col-span-7 flex flex-col gap-md">
            <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">OUR MISSION</span>
            <h2 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface text-balance">
              Making Professional Cleaning Supply Simple.
            </h2>
            <p className="font-body text-body-lg text-light-on-surface-variant max-w-prose text-pretty">
              Managing hygiene supplies across commercial buildings shouldn&apos;t require chasing multiple vendors or opaque spreadsheets. HYGIENOVO brings essential chemicals, washroom consumables, and commercial equipment into one streamlined UAE online procurement platform—helping facility teams and households stay stocked with zero friction.
            </p>
            <div className="pt-xs">
              <Link
                to="/about"
                className="inline-flex items-center gap-sm px-lg py-3 rounded border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface font-label text-label-lg hover:border-light-primary hover:text-light-primary transition-colors"
              >
                <span>Discover Hygienovo</span>
                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_forward</span>
              </Link>
            </div>
          </div>
          <div className="lg:col-span-5 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl flex flex-col gap-md shadow-sm">
            <p className="font-headline text-headline-md text-light-secondary">
              &ldquo;A Cleaner Standard for Every Space.&rdquo;
            </p>
            <p className="font-body text-body-md text-light-on-surface-variant">
              Serving offices, building management firms, cleaning companies, and residential customers across Dubai and all 7 Emirates.
            </p>
            <div className="border-t border-light-outline-variant pt-md flex items-center justify-between">
              <span className="font-label text-label-sm text-light-on-surface-variant">B2B &amp; B2C E-Commerce</span>
              <span className="font-label text-label-sm text-light-primary">Dubai, UAE</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION I – NEWSLETTER */}
      <section className="py-2xl bg-light-surface-container-low border-t border-light-outline-variant">
        <div className="max-w-[1280px] mx-auto px-md lg:px-xl flex flex-col lg:flex-row lg:items-center justify-between gap-lg">
          <div className="max-w-lg">
            <h2 className="font-headline text-headline-lg text-light-on-surface">Stay Ahead of the Clean.</h2>
            <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
              Receive new commercial product releases and seasonal UAE supply updates.
            </p>
          </div>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-sm w-full lg:w-auto">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your business email"
              className="w-full sm:w-80 rounded border border-light-outline-variant bg-light-surface-container-lowest px-md py-3 font-body text-body-md text-light-on-surface placeholder:text-light-outline focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submittingNewsletter}
              className="px-lg py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {submittingNewsletter ? 'Subscribing...' : 'Subscribe'}
            </button>
          </form>
        </div>
      </section>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
