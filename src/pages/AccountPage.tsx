import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatAed, UAE_CITIES_BY_EMIRATE, UAE_EMIRATES, type UAEEmirate } from '../lib/uae';
import type { CustomerUser, Order, Product } from '../types';

const ORDER_STEPS = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const;

function OrderTrackingTimeline({ status }: { status: Order['orderStatus'] }) {
  if (status === 'cancelled') {
    return (
      <div className="p-md rounded bg-light-error-container text-light-on-error-container font-label text-label-md">
        Order Cancelled
      </div>
    );
  }
  const activeIdx = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-sm">
      {ORDER_STEPS.map((step, idx) => {
        const done = idx <= activeIdx;
        return (
          <div
            key={step}
            className={`p-sm rounded border text-center ${
              done
                ? 'border-light-primary bg-light-primary-container text-light-on-primary-container'
                : 'border-light-outline-variant bg-light-surface text-light-on-surface-variant'
            }`}
          >
            <p className="font-label text-label-sm capitalize">{step.replace(/_/g, ' ')}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AccountPage() {
  const { customer, customerToken, wishlist, setCustomerSession, logoutCustomer, showToast } = useStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialTab = searchParams.get('tab') === 'wishlist' ? 'wishlist' : 'orders';
  const [tab, setTab] = useState<'orders' | 'profile' | 'wishlist'>(initialTab);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);

  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phone || '');
  const [companyName, setCompanyName] = useState(customer?.companyName || '');
  const [trn, setTrn] = useState(customer?.trn || '');
  const [emirate, setEmirate] = useState<UAEEmirate>((customer?.emirate as UAEEmirate) || 'Dubai');
  const [city, setCity] = useState(customer?.city || '');
  const [address, setAddress] = useState(customer?.address || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (!customer && tab !== 'wishlist') {
      navigate('/login');
    }
  }, [customer, tab, navigate]);

  useEffect(() => {
    if (customerToken) {
      apiFetch<Order[]>('/api/orders/mine', {}, customerToken)
        .then((data) => {
          setOrders(data);
          if (data.length > 0) setSelectedOrder(data[0]);
        })
        .catch(() => {});
    }
  }, [customerToken]);

  useEffect(() => {
    if (wishlist.length === 0) {
      setWishlistProducts([]);
      return;
    }
    apiFetch<Product[]>('/api/products')
      .then((all) => setWishlistProducts(all.filter((p) => wishlist.includes(p.id))))
      .catch(() => {});
  }, [wishlist]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!customerToken || !customer) return;
    setSavingProfile(true);
    try {
      const res = await apiFetch<{ user: CustomerUser }>(
        '/api/auth/profile',
        {
          method: 'PATCH',
          body: JSON.stringify({
            name,
            phone,
            companyName,
            trn,
            customerType: customer.customerType,
            emirate,
            city,
            address,
          }),
        },
        customerToken
      );
      setCustomerSession(customerToken, res.user);
      showToast('Profile updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save profile');
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-xl pb-lg border-b border-light-outline-variant">
        <div>
          <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
            Customer Dashboard
          </span>
          <h1 className="font-headline text-display-md-mobile lg:text-headline-lg text-light-on-surface mt-xs">
            {customer ? `Welcome, ${customer.name}` : 'Saved Wishlist'}
          </h1>
          {customer && (
            <p className="font-body text-body-md text-light-on-surface-variant">
              {customer.email} • {customer.companyName || 'Residential Account'}
            </p>
          )}
        </div>
        {customer ? (
          <button
            type="button"
            onClick={() => {
              logoutCustomer();
              navigate('/');
            }}
            className="px-md py-2 rounded border border-light-outline-variant font-label text-label-md text-light-on-surface hover:border-light-primary"
          >
            Sign Out
          </button>
        ) : (
          <Link
            to="/login"
            className="px-md py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md"
          >
            Sign In to View Orders
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-sm mb-lg">
        {customer && (
          <>
            <button
              type="button"
              onClick={() => setTab('orders')}
              className={`px-md py-2 rounded font-label text-label-md ${
                tab === 'orders'
                  ? 'bg-light-primary text-light-on-primary'
                  : 'bg-light-surface-container-lowest border border-light-outline-variant text-light-on-surface'
              }`}
            >
              Order History &amp; Tracking ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('profile')}
              className={`px-md py-2 rounded font-label text-label-md ${
                tab === 'profile'
                  ? 'bg-light-primary text-light-on-primary'
                  : 'bg-light-surface-container-lowest border border-light-outline-variant text-light-on-surface'
              }`}
            >
              Account &amp; Delivery Address
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setTab('wishlist')}
          className={`px-md py-2 rounded font-label text-label-md ${
            tab === 'wishlist'
              ? 'bg-light-primary text-light-on-primary'
              : 'bg-light-surface-container-lowest border border-light-outline-variant text-light-on-surface'
          }`}
        >
          Saved Wishlist ({wishlistProducts.length})
        </button>
      </div>

      {tab === 'orders' && customer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
          <div className="lg:col-span-5 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant divide-y divide-light-outline-variant">
            {orders.length === 0 ? (
              <div className="p-xl text-center">
                <p className="font-body text-body-md text-light-on-surface-variant mb-md">
                  You haven&apos;t placed any orders yet.
                </p>
                <Link
                  to="/catalogue"
                  className="inline-block px-lg py-2.5 rounded bg-light-primary text-light-on-primary font-label text-label-md"
                >
                  Explore Catalogue
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className={`w-full text-left p-md hover:bg-light-surface-container-low transition-colors ${
                    selectedOrder?.id === order.id ? 'bg-light-primary-container/30' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-mono-sm font-semibold text-light-secondary">
                      {order.orderNumber}
                    </span>
                    <span className="font-title text-title-sm tabular-nums">{formatAed(order.totalAed)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 font-body text-body-sm text-light-on-surface-variant">
                    <span className="capitalize">{order.orderStatus.replace(/_/g, ' ')}</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="lg:col-span-7">
            {selectedOrder && (
              <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg flex flex-col gap-lg">
                <div className="flex flex-wrap items-center justify-between gap-sm border-b border-light-outline-variant pb-md">
                  <div>
                    <h2 className="font-headline text-headline-sm text-light-on-surface">
                      Order {selectedOrder.orderNumber}
                    </h2>
                    <p className="font-body text-body-sm text-light-on-surface-variant">
                      {selectedOrder.city}, {selectedOrder.emirate} • {selectedOrder.address}
                    </p>
                  </div>
                  <span className="font-title text-title-lg text-light-secondary tabular-nums">
                    {formatAed(selectedOrder.totalAed)}
                  </span>
                </div>

                <div>
                  <p className="font-label text-label-md text-light-on-surface mb-sm">Delivery Progress</p>
                  <OrderTrackingTimeline status={selectedOrder.orderStatus} />
                </div>

                <div className="divide-y divide-light-outline-variant">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="py-sm flex justify-between font-body text-body-md">
                      <span>
                        {item.name} ({item.variationLabel}) × {item.qty}
                      </span>
                      <span className="font-title text-title-sm tabular-nums">
                        {formatAed(item.lineTotalAed)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'profile' && customer && (
        <form
          onSubmit={handleSaveProfile}
          className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl grid grid-cols-1 md:grid-cols-2 gap-md max-w-3xl"
        >
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">Full Name *</span>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">UAE Phone *</span>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">Company Name</span>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">UAE TRN</span>
            <input
              type="text"
              value={trn}
              onChange={(e) => setTrn(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-mono text-mono-sm"
            />
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">Emirate</span>
            <select
              value={emirate}
              onChange={(e) => {
                const em = e.target.value as UAEEmirate;
                setEmirate(em);
                setCity(UAE_CITIES_BY_EMIRATE[em]?.[0] || '');
              }}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            >
              {UAE_EMIRATES.map((em) => (
                <option key={em} value={em}>{em}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-xs">
            <span className="font-label text-label-md">City / Area</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            >
              {(UAE_CITIES_BY_EMIRATE[emirate] || []).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="md:col-span-2 flex flex-col gap-xs">
            <span className="font-label text-label-md">Street Address</span>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-xl py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-60"
            >
              {savingProfile ? 'Saving...' : 'Save Account Details'}
            </button>
          </div>
        </form>
      )}

      {tab === 'wishlist' && (
        <div>
          {wishlistProducts.length === 0 ? (
            <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-2xl text-center">
              <p className="font-body text-body-md text-light-on-surface-variant mb-md">
                No products saved to your wishlist yet.
              </p>
              <Link
                to="/catalogue"
                className="inline-block px-lg py-2.5 rounded bg-light-primary text-light-on-primary font-label text-label-md"
              >
                Browse Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
              {wishlistProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function lookupOrder(num: string, em: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<Order>(
        `/api/orders/track/${encodeURIComponent(num.trim())}?email=${encodeURIComponent(em.trim())}`
      );
      setOrder(res);
    } catch (err) {
      setOrder(null);
      setError(err instanceof Error ? err.message : 'Order not found');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialOrder = searchParams.get('order');
    const initialEmail = searchParams.get('email');
    if (initialOrder && initialEmail) {
      lookupOrder(initialOrder, initialEmail);
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    lookupOrder(orderNumber, email);
  }

  return (
    <div className="max-w-3xl w-full mx-auto px-md py-2xl">
      <div className="mb-xl">
        <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
          UAE Order Lookup
        </span>
        <h1 className="font-headline text-display-md-mobile lg:text-headline-lg text-light-on-surface mt-xs">
          Track Your Order
        </h1>
        <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
          Enter your HYGIENOVO order number and customer email to inspect real-time dispatch status.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg grid grid-cols-1 sm:grid-cols-3 gap-md shadow-sm mb-xl"
      >
        <input
          type="text"
          required
          value={orderNumber}
          onChange={(e) => setOrderNumber(e.target.value)}
          placeholder="Order # (e.g. HYG-123456-789)"
          className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-mono text-mono-sm focus:border-light-primary focus:outline-none"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Order email address"
          className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md focus:border-light-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="py-2.5 px-lg rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-60"
        >
          {loading ? 'Checking...' : 'Track Order'}
        </button>
      </form>

      {error && (
        <div className="p-md rounded bg-light-error-container text-light-on-error-container font-body text-body-md">
          {error}
        </div>
      )}

      {order && (
        <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg flex flex-col gap-lg shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-sm border-b border-light-outline-variant pb-md">
            <div>
              <h2 className="font-headline text-headline-sm text-light-on-surface">{order.orderNumber}</h2>
              <p className="font-body text-body-sm text-light-on-surface-variant">
                {order.city}, {order.emirate} • {order.deliveryWindow}
              </p>
            </div>
            <span className="font-title text-title-lg text-light-secondary tabular-nums">
              {formatAed(order.totalAed)}
            </span>
          </div>

          <OrderTrackingTimeline status={order.orderStatus} />

          <div className="divide-y divide-light-outline-variant">
            {order.items.map((item, idx) => (
              <div key={idx} className="py-sm flex justify-between font-body text-body-md">
                <span>
                  {item.name} ({item.variationLabel}) × {item.qty}
                </span>
                <span className="font-title text-title-sm tabular-nums">{formatAed(item.lineTotalAed)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
