import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatAed } from '../lib/uae';

export function CartPage() {
  const { cart, storeConfig, updateCartQty, removeFromCart, showToast } = useStore();
  const [couponInput, setCouponInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; discountAmountAed: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + item.priceAed * item.qty, 0);
  const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const discountAmount = appliedDiscount ? Math.min(subtotal, appliedDiscount.discountAmountAed) : 0;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const estimatedDelivery =
    cart.length === 0
      ? 0
      : storeConfig.freeDeliveryThreshold > 0 && discountedSubtotal >= storeConfig.freeDeliveryThreshold
        ? 0
        : storeConfig.dubaiDeliveryFee;
  const estimatedVat = (discountedSubtotal + estimatedDelivery) * storeConfig.vatRate;
  const total = discountedSubtotal + estimatedDelivery + estimatedVat;

  async function handleApplyCoupon(e: React.FormEvent) {
    e.preventDefault();
    setCouponError(null);
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);
    try {
      const res = await apiFetch<{ code: string; discountAmountAed: number }>('/api/discount/validate', {
        method: 'POST',
        body: JSON.stringify({ code: couponInput.trim(), subtotalAed: subtotal }),
      });
      setAppliedDiscount({ code: res.code, discountAmountAed: res.discountAmountAed });
      showToast(`Code ${res.code} applied`);
    } catch (err) {
      setAppliedDiscount(null);
      setCouponError(err instanceof Error ? err.message : 'Invalid discount code');
    } finally {
      setCheckingCoupon(false);
    }
  }

  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl">
        <div>
          <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface">
            Shopping Cart
          </h1>
          <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
            Review items in your UAE supply order before checkout.
          </p>
        </div>
        <Link to="/catalogue" className="inline-flex items-center gap-1 font-label text-label-lg text-light-primary hover:underline">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Continue Shopping</span>
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-2xl text-center flex flex-col items-center gap-md shadow-sm">
          <span className="material-symbols-outlined text-[48px] text-light-outline">shopping_cart</span>
          <h2 className="font-headline text-headline-sm text-light-on-surface">Your shopping cart is empty</h2>
          <p className="font-body text-body-md text-light-on-surface-variant max-w-md">
            Explore our 5L commercial cleaning chemicals, washroom hygiene dispensers, paper cases, and janitorial supplies.
          </p>
          <Link
            to="/catalogue"
            className="px-xl py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary"
          >
            Browse Catalogue
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
          <section className="lg:col-span-8 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg shadow-sm">
            <h2 className="font-headline text-headline-sm text-light-on-surface mb-md">
              Cart Items ({totalCount})
            </h2>
            <div className="divide-y divide-light-outline-variant">
              {cart.map((item) => (
                <div key={`${item.productId}-${item.variationId}`} className="py-md flex flex-col sm:flex-row sm:items-center gap-md">
                  <Link to={`/product/${item.slug}`} className="w-20 h-20 rounded overflow-hidden bg-light-surface-container-low shrink-0">
                    <SafeImage src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.slug}`} className="font-title text-title-md text-light-on-surface hover:text-light-primary">
                      {item.name}
                    </Link>
                    <p className="font-body text-body-sm text-light-on-surface-variant">
                      {item.variationLabel} • SKU: <span className="font-mono">{item.sku}</span> • Unit: {formatAed(item.priceAed)}
                    </p>
                  </div>
                  <div className="flex items-center gap-md">
                    <div className="inline-flex items-center border border-light-outline-variant rounded px-1">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variationId, item.qty - 1)}
                        aria-label="Decrease quantity"
                        className="w-7 h-8"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-title text-title-sm tabular-nums">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.productId, item.variationId, item.qty + 1)}
                        aria-label="Increase quantity"
                        className="w-7 h-8"
                      >
                        +
                      </button>
                    </div>
                    <span className="w-28 text-right font-title text-title-md text-light-secondary tabular-nums">
                      {formatAed(item.priceAed * item.qty)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId, item.variationId)}
                      aria-label={`Remove ${item.name}`}
                      className="text-light-on-surface-variant hover:text-light-error"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="lg:col-span-4 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl shadow-sm sticky top-28 flex flex-col gap-md">
            <h2 className="font-headline text-headline-sm text-light-on-surface">Order Summary</h2>

            <form onSubmit={handleApplyCoupon} className="flex gap-xs">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                placeholder="Discount code (e.g. WELCOME10)"
                className="flex-1 rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-mono text-mono-sm uppercase focus:border-light-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={checkingCoupon}
                className="px-md py-2 rounded bg-light-secondary text-light-on-secondary font-label text-label-md hover:bg-light-primary disabled:opacity-60"
              >
                Apply
              </button>
            </form>
            {couponError && <p className="font-body text-body-sm text-light-error">{couponError}</p>}

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
                <span className="text-light-on-surface-variant">Dubai Delivery Estimate</span>
                <span className="font-title text-title-sm tabular-nums">
                  {estimatedDelivery === 0 ? 'Free' : formatAed(estimatedDelivery)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-light-on-surface-variant">
                  UAE VAT ({(storeConfig.vatRate * 100).toFixed(0)}%)
                </span>
                <span className="font-title text-title-sm tabular-nums">{formatAed(estimatedVat)}</span>
              </div>
            </div>

            <div className="flex justify-between items-baseline">
              <span className="font-title text-title-md text-light-on-surface">Estimated Total</span>
              <span className="font-headline text-headline-md text-light-secondary tabular-nums">
                {formatAed(total)}
              </span>
            </div>

            <Link
              to={appliedDiscount ? `/checkout?code=${encodeURIComponent(appliedDiscount.code)}` : '/checkout'}
              className="w-full py-3.5 rounded bg-light-primary text-light-on-primary text-center font-label text-label-lg hover:bg-light-secondary transition-colors"
            >
              Proceed to Checkout
            </Link>

            <p className="font-body text-body-sm text-light-on-surface-variant text-center">
              Buying in bulk?{' '}
              <Link to="/b2b-quote" className="text-light-primary font-medium hover:underline">
                Request a B2B Quote
              </Link>
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
