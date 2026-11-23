import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import {
  formatAed,
  isValidEmail,
  isValidUaePhone,
  isValidUaeTrn,
  UAE_CITIES_BY_EMIRATE,
  UAE_EMIRATES,
  type UAEEmirate,
} from '../lib/uae';
import type { Order } from '../types';

export function CheckoutPage() {
  const { cart, storeConfig, customer, customerToken, clearCart, showToast } = useStore();
  const [searchParams] = useSearchParams();

  const [customerName, setCustomerName] = useState(customer?.name || '');
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');
  const [customerPhone, setCustomerPhone] = useState(customer?.phone || '');
  const [companyName, setCompanyName] = useState(customer?.companyName || '');
  const [trn, setTrn] = useState(customer?.trn || '');
  const [emirate, setEmirate] = useState<UAEEmirate>((customer?.emirate as UAEEmirate) || 'Dubai');
  const [city, setCity] = useState(customer?.city || UAE_CITIES_BY_EMIRATE.Dubai[0]);
  const [address, setAddress] = useState(customer?.address || '');
  const [billingSame, setBillingSame] = useState(true);
  const [deliveryWindow, setDeliveryWindow] = useState('Standard UAE Business Hours (9:00 AM – 5:00 PM)');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'bank_transfer' | 'uae_gateway'>(
    storeConfig.codEnabled ? 'cod' : storeConfig.bankTransferEnabled ? 'bank_transfer' : 'uae_gateway'
  );
  const [notes, setNotes] = useState('');

  const [couponInput, setCouponInput] = useState(searchParams.get('code') || '');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountAmountAed: number } | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [gatewayNotice, setGatewayNotice] = useState<string | null>(null);

  const subtotal = cart.reduce((sum, item) => sum + item.priceAed * item.qty, 0);

  useEffect(() => {
    const initialCode = searchParams.get('code');
    if (initialCode && subtotal > 0 && !appliedDiscount) {
      apiFetch<{ code: string; discountAmountAed: number }>('/api/discount/validate', {
        method: 'POST',
        body: JSON.stringify({ code: initialCode, subtotalAed: subtotal }),
      })
        .then((res) => setAppliedDiscount({ code: res.code, discountAmountAed: res.discountAmountAed }))
        .catch(() => {});
    }
  }, [subtotal]);

  useEffect(() => {
    const cities = UAE_CITIES_BY_EMIRATE[emirate] || [];
    if (!cities.includes(city)) {
      setCity(cities[0] || '');
    }
  }, [emirate]);

  const discountAmount = appliedDiscount ? Math.min(subtotal, appliedDiscount.discountAmountAed) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const baseDelivery =
    emirate === 'Dubai' ? storeConfig.dubaiDeliveryFee : storeConfig.otherEmiratesDeliveryFee;
  const deliveryFee =
    cart.length === 0
      ? 0
      : storeConfig.freeDeliveryThreshold > 0 && discountedSubtotal >= storeConfig.freeDeliveryThreshold
        ? 0
        : baseDelivery;
  const vatAmount = (discountedSubtotal + deliveryFee) * storeConfig.vatRate;
  const total = discountedSubtotal + deliveryFee + vatAmount;

  async function handleApplyDiscount() {
    setCouponMessage(null);
    if (!couponInput.trim()) return;
    try {
      const res = await apiFetch<{ code: string; discountAmountAed: number }>('/api/discount/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponInput.trim(), subtotalAed: subtotal }),
      });
      setAppliedDiscount({ code: res.code, discountAmountAed: res.discountAmountAed });
      setCouponMessage(`Applied ${res.code} (-${formatAed(res.discountAmountAed)})`);
    } catch (err) {
      setAppliedDiscount(null);
      setCouponMessage(err instanceof Error ? err.message : 'Invalid code');
    }
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Your cart is empty.');
      return;
    }
    if (!customerName.trim()) {
      setError('Please enter a contact name.');
      return;
    }
    if (!isValidEmail(customerEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!isValidUaePhone(customerPhone)) {
      setError('Please enter a valid UAE phone number (e.g., +971 50 123 4567 or 04 123 4567).');
      return;
    }
    if (!isValidUaeTrn(trn)) {
      setError('UAE TRN must be 15 digits when provided.');
      return;
    }
    if (!address.trim() || !city.trim()) {
      setError('Please enter your city and street delivery address.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ order: Order; gatewayNotice: string | null }>(
        '/api/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            customerName,
            customerEmail,
            customerPhone,
            companyName,
            trn,
            emirate,
            city,
            address,
            deliveryWindow,
            paymentMethod,
            discountCode: appliedDiscount?.code || '',
            notes: billingSame ? notes : `${notes ? `${notes} | ` : ''}Separate billing address requested`,
            items: cart.map((c) => ({
              productId: c.productId,
              variationId: c.variationId,
              qty: c.qty,
            })),
          }),
        },
        customerToken
      );

      setConfirmedOrder(res.order);
      setGatewayNotice(res.gatewayNotice);
      clearCart();
      showToast(`Order ${res.order.orderNumber} placed`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmedOrder) {
    return (
      <div className="max-w-[920px] w-full mx-auto px-md lg:px-xl py-2xl">
        <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl shadow-sm flex flex-col gap-lg">
          <div className="flex items-start gap-md border-b border-light-outline-variant pb-lg">
            <span className="w-12 h-12 rounded-full bg-light-primary-container text-light-on-primary-container flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </span>
            <div>
              <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
                Order Confirmation
              </span>
              <h1 className="font-headline text-headline-lg text-light-on-surface mt-xs">
                Order {confirmedOrder.orderNumber} Confirmed
              </h1>
              <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
                Confirmation recorded for {confirmedOrder.customerEmail}. Delivery to {confirmedOrder.city}, {confirmedOrder.emirate}.
              </p>
            </div>
          </div>

          {gatewayNotice && (
            <div className="p-md rounded-md bg-light-tertiary-container text-light-on-tertiary-container font-body text-body-sm">
              {gatewayNotice}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-md bg-light-surface-container-low rounded-md p-md">
            <div>
              <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Payment Method</p>
              <p className="font-title text-title-sm text-light-on-surface mt-xs">
                {confirmedOrder.paymentMethod === 'cod'
                  ? 'Cash on Delivery (COD)'
                  : confirmedOrder.paymentMethod === 'bank_transfer'
                    ? 'Bank Transfer (B2B)'
                    : 'UAE Card Gateway (Integration Point)'}
              </p>
            </div>
            <div>
              <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Payment Status</p>
              <p className="font-title text-title-sm text-light-secondary mt-xs">
                {confirmedOrder.paymentStatus.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Order Status</p>
              <p className="font-title text-title-sm text-light-primary mt-xs capitalize">
                {confirmedOrder.orderStatus.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="divide-y divide-light-outline-variant">
            {confirmedOrder.items.map((item, idx) => (
              <div key={idx} className="py-sm flex items-center justify-between gap-md">
                <div>
                  <p className="font-title text-title-sm text-light-on-surface">{item.name}</p>
                  <p className="font-body text-body-sm text-light-on-surface-variant">
                    {item.variationLabel} × {item.qty}
                  </p>
                </div>
                <span className="font-title text-title-sm tabular-nums">{formatAed(item.lineTotalAed)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-light-outline-variant pt-md flex flex-col gap-xs text-body-md">
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">Subtotal</span>
              <span className="tabular-nums">{formatAed(confirmedOrder.subtotalAed)}</span>
            </div>
            {confirmedOrder.discountAmountAed > 0 && (
              <div className="flex justify-between text-light-primary">
                <span>Discount ({confirmedOrder.discountCode})</span>
                <span className="tabular-nums">-{formatAed(confirmedOrder.discountAmountAed)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">Delivery ({confirmedOrder.emirate})</span>
              <span className="tabular-nums">
                {confirmedOrder.deliveryFeeAed === 0 ? 'Free' : formatAed(confirmedOrder.deliveryFeeAed)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">UAE VAT (5%)</span>
              <span className="tabular-nums">{formatAed(confirmedOrder.vatAmountAed)}</span>
            </div>
            <div className="flex justify-between font-headline text-headline-sm text-light-secondary pt-xs border-t border-light-outline-variant">
              <span>Total (AED)</span>
              <span className="tabular-nums">{formatAed(confirmedOrder.totalAed)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-md pt-sm">
            <Link
              to={`/track-order?order=${encodeURIComponent(confirmedOrder.orderNumber)}&email=${encodeURIComponent(confirmedOrder.customerEmail)}`}
              className="px-lg py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary"
            >
              Track This Order
            </Link>
            <Link
              to="/catalogue"
              className="px-lg py-3 rounded border border-light-outline-variant font-label text-label-lg text-light-on-surface hover:border-light-primary"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface">
            Shopping Cart &amp; Checkout
          </h1>
          <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
            Complete your UAE delivery details, select Cash on Delivery or B2B transfer, and review 5% VAT totals.
          </p>
        </div>
        <Link to="/cart" className="inline-flex items-center gap-1 font-label text-label-lg text-light-primary hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Edit Cart</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
        <div className="lg:col-span-8 flex flex-col gap-xl">
          {/* Items Preview */}
          <section className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg shadow-sm">
            <h2 className="font-headline text-headline-sm text-light-on-surface mb-md">
              Order Items ({cart.reduce((s, i) => s + i.qty, 0)})
            </h2>
            {cart.length === 0 ? (
              <p className="font-body text-body-md text-light-on-surface-variant">
                Your cart is empty. <Link to="/catalogue" className="text-light-primary underline">Add products</Link> before checking out.
              </p>
            ) : (
              <div className="divide-y divide-light-outline-variant">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.variationId}`} className="py-sm flex items-center justify-between gap-md">
                    <div className="flex items-center gap-md min-w-0">
                      <SafeImage src={item.image} alt={item.name} className="w-14 h-14 rounded object-cover bg-light-surface-container-low shrink-0" />
                      <div className="min-w-0">
                        <p className="font-title text-title-sm text-light-on-surface truncate">{item.name}</p>
                        <p className="font-body text-body-sm text-light-on-surface-variant">
                          {item.variationLabel} × {item.qty}
                        </p>
                      </div>
                    </div>
                    <span className="font-title text-title-sm text-light-secondary tabular-nums shrink-0">
                      {formatAed(item.priceAed * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Checkout Form */}
          <section className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl shadow-sm">
            <h2 className="font-headline text-headline-sm text-light-on-surface mb-lg">
              Customer &amp; UAE Delivery Information
            </h2>
            <form id="checkout-form" onSubmit={handlePlaceOrder} className="grid grid-cols-1 md:grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Contact Name *</span>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Email Address *</span>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="orders@company.ae"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">UAE Mobile / Phone *</span>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+971 50 123 4567"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Company Name (Optional for Residential)</span>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Company LLC"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">UAE TRN (Optional 15-Digit)</span>
                <input
                  type="text"
                  value={trn}
                  onChange={(e) => setTrn(e.target.value)}
                  placeholder="100XXXXXXXXXXXX"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-mono text-mono-sm focus:border-light-primary focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Emirate *</span>
                <select
                  value={emirate}
                  onChange={(e) => setEmirate(e.target.value as UAEEmirate)}
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                >
                  {UAE_EMIRATES.map((em) => (
                    <option key={em} value={em}>{em}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">City / District *</span>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                >
                  {(UAE_CITIES_BY_EMIRATE[emirate] || []).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Delivery Window</span>
                <select
                  value={deliveryWindow}
                  onChange={(e) => setDeliveryWindow(e.target.value)}
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                >
                  <option>Standard UAE Business Hours (9:00 AM – 5:00 PM)</option>
                  <option>Morning Loading Dock Window (8:00 AM – 12:00 PM)</option>
                  <option>Evening Residential Slot (5:00 PM – 9:00 PM)</option>
                </select>
              </label>

              <label className="md:col-span-2 flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Street, Building &amp; Unit / Villa *</span>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Building / Office / Villa No., Street, Nearest Landmark"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                />
              </label>

              <label className="md:col-span-2 flex items-center gap-2 font-body text-body-sm text-light-on-surface py-1">
                <input
                  type="checkbox"
                  checked={billingSame}
                  onChange={(e) => setBillingSame(e.target.checked)}
                  className="rounded text-light-primary focus:ring-light-primary"
                />
                <span>Billing address is the same as delivery address</span>
              </label>

              <label className="md:col-span-2 flex flex-col gap-xs">
                <span className="font-label text-label-md text-light-on-surface">Delivery Notes (Optional)</span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Security gate instructions, PO number, or contact extension"
                  className="w-full rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
                />
              </label>

              {/* Payment Methods */}
              <div className="md:col-span-2 pt-md border-t border-light-outline-variant">
                <h3 className="font-title text-title-md text-light-on-surface mb-xs">Payment Method</h3>
                <p className="font-body text-body-sm text-light-on-surface-variant mb-md">
                  Configurable UAE payment options. Card gateway integration saves orders as awaiting payment until live gateway credentials are active.
                </p>
                <div className="flex flex-col gap-sm">
                  {storeConfig.codEnabled && (
                    <label
                      className={`flex items-center justify-between p-md rounded border cursor-pointer ${
                        paymentMethod === 'cod'
                          ? 'border-light-primary bg-light-primary-container/40'
                          : 'border-light-outline-variant'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="text-light-primary focus:ring-light-primary"
                        />
                        <span className="font-title text-title-sm text-light-on-surface">
                          Cash on Delivery (UAE Courier Collection)
                        </span>
                      </span>
                      <span className="font-label text-label-sm text-light-primary">AED COD</span>
                    </label>
                  )}

                  {storeConfig.bankTransferEnabled && (
                    <label
                      className={`flex items-center justify-between p-md rounded border cursor-pointer ${
                        paymentMethod === 'bank_transfer'
                          ? 'border-light-primary bg-light-primary-container/40'
                          : 'border-light-outline-variant'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'bank_transfer'}
                          onChange={() => setPaymentMethod('bank_transfer')}
                          className="text-light-primary focus:ring-light-primary"
                        />
                        <span className="font-title text-title-sm text-light-on-surface">
                          UAE Bank Transfer (B2B Proforma Invoice)
                        </span>
                      </span>
                      <span className="font-label text-label-sm text-light-on-surface-variant">B2B IBAN</span>
                    </label>
                  )}

                  {storeConfig.uaeGatewayEnabled && (
                    <label
                      className={`flex items-center justify-between p-md rounded border cursor-pointer ${
                        paymentMethod === 'uae_gateway'
                          ? 'border-light-primary bg-light-primary-container/40'
                          : 'border-light-outline-variant'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="payment"
                          checked={paymentMethod === 'uae_gateway'}
                          onChange={() => setPaymentMethod('uae_gateway')}
                          className="text-light-primary focus:ring-light-primary"
                        />
                        <span className="font-title text-title-sm text-light-on-surface">
                          UAE Card / Apple Pay Gateway ({storeConfig.uaeGatewayConfigured ? 'Ready' : 'Integration Point'})
                        </span>
                      </span>
                      <span className="font-label text-label-sm text-light-on-surface-variant">
                        {storeConfig.uaeGatewayConfigured ? 'Configured' : 'Gateway Pending'}
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {error && (
                <div className="md:col-span-2 p-md rounded bg-light-error-container text-light-on-error-container font-body text-body-sm">
                  {error}
                </div>
              )}
            </form>
          </section>
        </div>

        {/* Right: Order Summary */}
        <aside className="lg:col-span-4 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl shadow-sm sticky top-28 flex flex-col gap-md">
          <h2 className="font-headline text-headline-sm text-light-on-surface">Order Summary</h2>

          <div className="flex gap-xs">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value)}
              placeholder="Discount code"
              className="flex-1 rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-mono text-mono-sm uppercase focus:border-light-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={handleApplyDiscount}
              className="px-md py-2 rounded bg-light-secondary text-light-on-secondary font-label text-label-md hover:bg-light-primary"
            >
              Apply
            </button>
          </div>
          {couponMessage && (
            <p className={`font-body text-body-sm ${appliedDiscount ? 'text-light-primary' : 'text-light-error'}`}>
              {couponMessage}
            </p>
          )}

          <div className="flex flex-col gap-sm font-body text-body-md border-y border-light-outline-variant py-md">
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">Subtotal</span>
              <span className="font-title text-title-sm tabular-nums">{formatAed(subtotal)}</span>
            </div>
            {discountAmount > 0 && appliedDiscount && (
              <div className="flex justify-between text-light-primary">
                <span>Discount ({appliedDiscount.code})</span>
                <span className="font-title text-title-sm tabular-nums">-{formatAed(discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">Delivery ({emirate})</span>
              <span className="font-title text-title-sm tabular-nums">
                {deliveryFee === 0 ? 'Free' : formatAed(deliveryFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-light-on-surface-variant">
                UAE VAT ({(storeConfig.vatRate * 100).toFixed(0)}%)
              </span>
              <span className="font-title text-title-sm tabular-nums">{formatAed(vatAmount)}</span>
            </div>
          </div>

          <div className="flex justify-between items-baseline">
            <span className="font-title text-title-md text-light-on-surface">Total (AED)</span>
            <span className="font-headline text-headline-md text-light-secondary tabular-nums">
              {formatAed(total)}
            </span>
          </div>

          <button
            type="submit"
            form="checkout-form"
            disabled={submitting || cart.length === 0}
            className="w-full py-3.5 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-60 transition-colors"
          >
            {submitting ? 'Placing Order...' : 'Place Order'}
          </button>

          <p className="font-body text-body-sm text-light-on-surface-variant text-center">
            Free delivery across UAE on orders over {formatAed(storeConfig.freeDeliveryThreshold)}
          </p>
        </aside>
      </div>
    </div>
  );
}
