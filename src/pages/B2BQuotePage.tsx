import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { buildWhatsAppLink, isValidEmail, isValidUaePhone } from '../lib/uae';

export function B2BQuotePage() {
  const { storeConfig, showToast } = useStore();
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [productsRequired, setProductsRequired] = useState('');
  const [estimatedQuantity, setEstimatedQuantity] = useState('');
  const [supplyFrequency, setSupplyFrequency] = useState('One-Time Bulk Order');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);

  const whatsappUrl = buildWhatsAppLink(
    storeConfig.whatsappNumber,
    'Hello HYGIENOVO B2B Desk, I would like to request a commercial cleaning & hygiene supply quotation.'
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isValidEmail(email)) {
      setError('Please enter a valid business email address.');
      return;
    }
    if (!isValidUaePhone(phone)) {
      setError('Please enter a valid UAE phone number (e.g., +971 50 123 4567).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ referenceNumber: string }>('/api/quotes', {
        method: 'POST',
        body: JSON.stringify({
          companyName,
          contactPerson,
          email,
          phone,
          businessType,
          deliveryLocation,
          productsRequired,
          estimatedQuantity,
          supplyFrequency,
          notes,
        }),
      });
      setReferenceNumber(res.referenceNumber);
      showToast(`Quote request ${res.referenceNumber} submitted`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit quote request.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl">
      <div className="max-w-2xl mb-xl">
        <span className="inline-flex items-center px-3 py-1 rounded-full bg-light-primary-container text-light-on-primary-container font-label text-label-sm mb-sm">
          B2B PROCUREMENT DESK • DUBAI &amp; UAE
        </span>
        <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface text-balance">
          Get a Custom Quote for Your Business.
        </h1>
        <p className="font-body text-body-lg text-light-on-surface-variant mt-xs">
          Share your facility requirements below to receive a formal AED quotation, bulk volume pricing, and scheduled UAE delivery options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
        <section className="lg:col-span-8 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Company Name *</span>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Horizon Facility Management LLC"
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Contact Person *</span>
              <input
                type="text"
                required
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Full name"
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Business Email *</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="procurement@company.ae"
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">UAE Phone Number *</span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+971 50 000 0000"
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Business Type *</span>
              <select
                required
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              >
                <option value="">Select business sector</option>
                <option>Office Building / Corporate HQ</option>
                <option>Facility Management Company</option>
                <option>Professional Cleaning Contractor</option>
                <option>Hotel &amp; Hospitality</option>
                <option>School / Educational Institution</option>
                <option>Residential Community / Tower</option>
              </select>
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Delivery Location (Emirate / Area) *</span>
              <input
                type="text"
                required
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                placeholder="e.g., Business Bay, Dubai"
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            <label className="md:col-span-2 flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Products Required *</span>
              <input
                type="text"
                required
                value={productsRequired}
                onChange={(e) => setProductsRequired(e.target.value)}
                placeholder="e.g., Commercial Floor Cleaner 5L, Liquid Hand Wash 5L, Microfiber Cloths"
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Estimated Quantity *</span>
              <input
                type="text"
                required
                value={estimatedQuantity}
                onChange={(e) => setEstimatedQuantity(e.target.value)}
                placeholder="e.g., 50 × 5L units / monthly"
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Supply Frequency</span>
              <select
                value={supplyFrequency}
                onChange={(e) => setSupplyFrequency(e.target.value)}
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:outline-none"
              >
                <option>One-Time Bulk Order</option>
                <option>Monthly Recurring Supply</option>
                <option>Quarterly Contract</option>
              </select>
            </label>

            <label className="md:col-span-2 flex flex-col gap-xs">
              <span className="font-label text-label-md text-light-on-surface">Additional Requirements</span>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Delivery dock hours, multi-building split, or UAE TRN details..."
                className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </label>

            {error && (
              <div className="md:col-span-2 p-md rounded bg-light-error-container text-light-on-error-container font-body text-body-sm">
                {error}
              </div>
            )}

            <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-md pt-sm">
              <p className="font-body text-body-sm text-light-on-surface-variant">
                Submissions are logged directly to our UAE procurement team.
              </p>
              <button
                type="submit"
                disabled={submitting}
                className="px-xl py-3.5 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary transition-colors disabled:opacity-60"
              >
                {submitting ? 'Submitting...' : 'Submit Quote Request'}
              </button>
            </div>
          </form>

          {referenceNumber && (
            <div className="mt-lg p-lg rounded-md bg-light-primary-container text-light-on-primary-container flex items-start gap-md">
              <span className="material-symbols-outlined text-[24px]">check_circle</span>
              <div>
                <p className="font-title text-title-md">Quote Request Received</p>
                <p className="font-body text-body-md mt-xs">
                  Reference <span className="font-mono font-semibold">{referenceNumber}</span>. Our UAE B2B desk has recorded your request and will prepare your custom AED quotation.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="lg:col-span-4 flex flex-col gap-lg">
          <div className="bg-deep-forest text-pure-white rounded-lg p-xl flex flex-col gap-md">
            <h2 className="font-headline text-headline-sm">How Bulk Quoting Works</h2>
            <ol className="flex flex-col gap-md font-body text-body-md text-fresh-mint">
              <li className="flex gap-3">
                <span className="font-title text-gold-accent">01</span>
                <span>Submit your product list, quantities, and Dubai/UAE delivery site.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-title text-gold-accent">02</span>
                <span>Receive an itemized AED quotation with volume pricing tiers and 5% VAT breakdown.</span>
              </li>
              <li className="flex gap-3">
                <span className="font-title text-gold-accent">03</span>
                <span>Approve your quote to schedule consolidated or recurring delivery.</span>
              </li>
            </ol>
          </div>

          <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg flex flex-col gap-sm">
            <h3 className="font-title text-title-md text-light-on-surface">Need Immediate Assistance?</h3>
            <p className="font-body text-body-sm text-light-on-surface-variant">
              Connect with our Dubai commercial supply team on WhatsApp for urgent facility orders.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-xs inline-flex items-center justify-center gap-2 py-2.5 px-md rounded bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-secondary"
            >
              <span className="material-symbols-outlined text-[18px]">chat</span>
              <span>Message on WhatsApp</span>
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
}
