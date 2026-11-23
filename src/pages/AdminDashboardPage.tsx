import React, { useCallback, useEffect, useState } from 'react';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { formatAed } from '../lib/uae';
import type {
  AdminAnalytics,
  B2BQuote,
  Category,
  CustomerUser,
  DiscountCode,
  Order,
  Product,
  StoreConfig,
} from '../types';

type AdminTab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'quotes'
  | 'discounts'
  | 'customers'
  | 'settings';

interface CustomerWithStats extends CustomerUser {
  orderCount: number;
  totalSpentAed: number;
}

export function AdminDashboardPage() {
  const { adminToken, setAdminToken, showToast, refreshStoreMetadata } = useStore();

  const [statusLoading, setStatusLoading] = useState(true);
  const [needsBootstrap, setNeedsBootstrap] = useState(false);
  const [envConfigured, setEnvConfigured] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<B2BQuote[]>([]);
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [settings, setSettings] = useState<StoreConfig | null>(null);

  // Product Form Modal
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pSku, setPSku] = useState('');
  const [pCategorySlug, setPCategorySlug] = useState('chemicals');
  const [pBrand, setPBrand] = useState('HYGIENOVO Pro');
  const [pPackSize, setPPackSize] = useState('5L Jerrycan');
  const [pPrice, setPPrice] = useState('68');
  const [pStock, setPStock] = useState('100');
  const [pFeatured, setPFeatured] = useState(true);
  const [pImage, setPImage] = useState('');
  const [pDesc, setPDesc] = useState('');
  const [uploadingImg, setUploadingImg] = useState(false);

  // Category Form
  const [cName, setCName] = useState('');
  const [cDesc, setCDesc] = useState('');
  const [cImage, setCImage] = useState('');

  // Discount Form
  const [dCode, setDCode] = useState('');
  const [dType, setDType] = useState<'percent' | 'fixed'>('percent');
  const [dValue, setDValue] = useState('10');
  const [dMinOrder, setDMinOrder] = useState('100');

  useEffect(() => {
    apiFetch<{ needsBootstrap: boolean; envConfigured: boolean }>('/api/admin/status')
      .then((res) => {
        setNeedsBootstrap(res.needsBootstrap);
        setEnvConfigured(res.envConfigured);
      })
      .catch(() => {})
      .finally(() => setStatusLoading(false));
  }, []);

  const loadAdminData = useCallback(async () => {
    if (!adminToken) return;
    try {
      const [ana, prods, cats, ords, qts, discs, custs, cfg] = await Promise.all([
        apiFetch<AdminAnalytics>('/api/admin/analytics', {}, adminToken),
        apiFetch<Product[]>('/api/admin/products', {}, adminToken),
        apiFetch<Category[]>('/api/categories'),
        apiFetch<Order[]>('/api/admin/orders', {}, adminToken),
        apiFetch<B2BQuote[]>('/api/admin/quotes', {}, adminToken),
        apiFetch<DiscountCode[]>('/api/admin/discounts', {}, adminToken),
        apiFetch<CustomerWithStats[]>('/api/admin/customers', {}, adminToken),
        apiFetch<StoreConfig>('/api/store-config'),
      ]);
      setAnalytics(ana);
      setProducts(prods);
      setCategories(cats);
      setOrders(ords);
      setQuotes(qts);
      setDiscounts(discs);
      setCustomers(custs);
      setSettings(cfg);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to load admin data');
    }
  }, [adminToken, showToast]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function handleBootstrap(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }
    setAuthBusy(true);
    try {
      const res = await apiFetch<{ token: string }>('/api/admin/bootstrap', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setAdminToken(res.token);
      setNeedsBootstrap(false);
      setPassword('');
      setConfirmPassword('');
      showToast('Admin password claimed & signed in');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Bootstrap failed');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthBusy(true);
    try {
      const res = await apiFetch<{ token: string }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setAdminToken(res.token);
      setPassword('');
      showToast('Signed in to HYGIENOVO Admin');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setAuthBusy(false);
    }
  }

  function openNewProductModal() {
    setEditingProduct(null);
    setPName('');
    setPSku('');
    setPCategorySlug(categories[0]?.slug || 'chemicals');
    setPBrand('HYGIENOVO Pro');
    setPPackSize('5L Jerrycan');
    setPPrice('68');
    setPStock('100');
    setPFeatured(true);
    setPImage('');
    setPDesc('');
    setProductModalOpen(true);
  }

  function openEditProductModal(p: Product) {
    setEditingProduct(p);
    setPName(p.name);
    setPSku(p.sku);
    setPCategorySlug(p.categorySlug);
    setPBrand(p.brand);
    setPPackSize(p.packSize);
    setPPrice(String(p.priceAed));
    setPStock(String(p.stockQty));
    setPFeatured(p.featured);
    setPImage(p.image);
    setPDesc(p.description);
    setProductModalOpen(true);
  }

  async function handleImageFileUpload(e: React.ChangeEvent<HTMLInputElement>, onUrl: (url: string) => void) {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    setUploadingImg(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
      });
      const res = await apiFetch<{ url: string }>(
        '/api/admin/upload',
        {
          method: 'POST',
          body: JSON.stringify({ dataUrl }),
        },
        adminToken
      );
      onUrl(res.url);
      showToast('Product image uploaded');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setUploadingImg(false);
    }
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
    try {
      const payload = {
        name: pName,
        sku: pSku,
        categorySlug: pCategorySlug,
        brand: pBrand,
        packSize: pPackSize,
        priceAed: Number(pPrice),
        stockQty: Number(pStock),
        featured: pFeatured,
        image: pImage,
        description: pDesc,
      };
      if (editingProduct) {
        await apiFetch(`/api/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        }, adminToken);
        showToast('Product updated');
      } else {
        await apiFetch('/api/admin/products', {
          method: 'POST',
          body: JSON.stringify(payload),
        }, adminToken);
        showToast('Product created');
      }
      setProductModalOpen(false);
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save product');
    }
  }

  async function handleDeleteProduct(id: number) {
    if (!adminToken) return;
    try {
      await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' }, adminToken);
      showToast('Product deleted');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
    try {
      await apiFetch('/api/admin/categories', {
        method: 'POST',
        body: JSON.stringify({ name: cName, description: cDesc, image: cImage }),
      }, adminToken);
      setCName('');
      setCDesc('');
      setCImage('');
      showToast('Category created');
      await Promise.all([loadAdminData(), refreshStoreMetadata()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to add category');
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!adminToken) return;
    try {
      await apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }, adminToken);
      showToast('Category deleted');
      await Promise.all([loadAdminData(), refreshStoreMetadata()]);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cannot delete category');
    }
  }

  async function handleOrderUpdate(id: number, orderStatus: string, paymentStatus: string) {
    if (!adminToken) return;
    try {
      await apiFetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ orderStatus, paymentStatus }),
      }, adminToken);
      showToast('Order status updated');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update order');
    }
  }

  async function handleQuoteStatus(id: number, status: string) {
    if (!adminToken) return;
    try {
      await apiFetch(`/api/admin/quotes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }, adminToken);
      showToast('Quote status updated');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update quote');
    }
  }

  async function handleCreateDiscount(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken) return;
    try {
      await apiFetch('/api/admin/discounts', {
        method: 'POST',
        body: JSON.stringify({
          code: dCode,
          type: dType,
          value: Number(dValue),
          minOrderAed: Number(dMinOrder),
        }),
      }, adminToken);
      setDCode('');
      showToast('Discount code created');
      await loadAdminData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create discount code');
    }
  }

  async function handleToggleDiscount(d: DiscountCode) {
    if (!adminToken) return;
    await apiFetch(`/api/admin/discounts/${d.id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !d.active }),
    }, adminToken);
    await loadAdminData();
  }

  async function handleDeleteDiscount(id: number) {
    if (!adminToken) return;
    await apiFetch(`/api/admin/discounts/${id}`, { method: 'DELETE' }, adminToken);
    showToast('Discount code removed');
    await loadAdminData();
  }

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!adminToken || !settings) return;
    try {
      const updated = await apiFetch<StoreConfig>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, adminToken);
      setSettings(updated);
      await refreshStoreMetadata();
      showToast('UAE store configuration saved');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save settings');
    }
  }

  if (statusLoading) {
    return (
      <div className="max-w-md mx-auto py-2xl px-md text-center font-body text-body-md text-light-on-surface-variant">
        Loading HYGIENOVO Admin Console...
      </div>
    );
  }

  if (!adminToken) {
    return (
      <div className="max-w-md w-full mx-auto px-md py-2xl">
        <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-xl shadow-sm flex flex-col gap-lg">
          <div>
            <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
              Restricted Administration
            </span>
            <h1 className="font-headline text-headline-lg text-light-on-surface mt-xs">
              {needsBootstrap ? 'Create Store Admin Password' : 'Admin Dashboard Sign In'}
            </h1>
            <p className="font-body text-body-sm text-light-on-surface-variant mt-xs">
              {needsBootstrap
                ? 'First-time setup: set an administrator password (min. 8 characters) to protect inventory, orders, and store controls.'
                : envConfigured
                  ? 'Sign in with your store administrator password.'
                  : 'Enter your administrator password to manage inventory, orders, and UAE store settings.'}
            </p>
          </div>

          <form onSubmit={needsBootstrap ? handleBootstrap : handleAdminLogin} className="flex flex-col gap-md">
            <label className="flex flex-col gap-xs">
              <span className="font-label text-label-md">
                {needsBootstrap ? 'Administrator Password *' : 'Password *'}
              </span>
              <input
                type="password"
                required
                minLength={needsBootstrap ? 8 : 1}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
              />
            </label>

            {needsBootstrap && (
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md">Confirm Admin Password *</span>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2.5 font-body text-body-md"
                />
              </label>
            )}

            {authError && (
              <div className="p-sm rounded bg-light-error-container text-light-on-error-container font-body text-body-sm">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authBusy}
              className="py-3 rounded bg-light-secondary text-light-on-secondary font-label text-label-lg hover:bg-light-primary disabled:opacity-60"
            >
              {authBusy ? 'Verifying...' : needsBootstrap ? 'Claim Admin Access' : 'Sign In to Admin'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1360px] w-full mx-auto px-md lg:px-xl py-xl flex-1">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md mb-lg pb-md border-b border-light-outline-variant">
        <div>
          <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
            HYGIENOVO Operations
          </span>
          <h1 className="font-headline text-headline-lg text-light-on-surface">
            Administration Console
          </h1>
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={openNewProductModal}
            className="px-md py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-secondary whitespace-nowrap"
          >
            + Add Product
          </button>
          <button
            type="button"
            onClick={() => setAdminToken(null)}
            className="px-md py-2 rounded border border-light-outline-variant font-label text-label-md text-light-on-surface hover:border-light-primary whitespace-nowrap"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
        {/* Sidebar */}
        <aside className="lg:col-span-3 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-sm flex flex-row lg:flex-col gap-xs overflow-x-auto">
          {(
            [
              ['overview', 'Analytics Overview', 'analytics'],
              ['products', 'Products & Inventory', 'inventory_2'],
              ['categories', 'Categories', 'category'],
              ['orders', 'Orders', 'receipt_long'],
              ['quotes', 'B2B Quotes', 'request_quote'],
              ['discounts', 'Discount Codes', 'sell'],
              ['customers', 'Customers', 'group'],
              ['settings', 'UAE Tax & Delivery', 'settings'],
            ] as const
          ).map(([id, label, icon]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 px-md py-2.5 rounded font-label text-label-md whitespace-nowrap transition-colors ${
                activeTab === id
                  ? 'bg-deep-forest text-pure-white'
                  : 'text-light-on-surface hover:bg-light-surface-container'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </aside>

        {/* Main Workspace */}
        <div className="lg:col-span-9 flex flex-col gap-lg min-w-0">
          {activeTab === 'overview' && analytics && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-md">
                <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
                  <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Total Sales (AED)</p>
                  <p className="font-headline text-headline-lg text-light-secondary tabular-nums mt-xs">
                    {formatAed(analytics.totalRevenueAed)}
                  </p>
                </div>
                <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
                  <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Total Orders</p>
                  <p className="font-headline text-headline-lg text-light-on-surface tabular-nums mt-xs">
                    {analytics.totalOrders}
                  </p>
                </div>
                <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
                  <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Avg. Order Value</p>
                  <p className="font-headline text-headline-lg text-light-primary tabular-nums mt-xs">
                    {formatAed(analytics.averageOrderValueAed)}
                  </p>
                </div>
                <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
                  <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Registered Customers</p>
                  <p className="font-headline text-headline-md text-light-on-surface tabular-nums mt-xs">
                    {analytics.totalCustomers}
                  </p>
                </div>
                <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
                  <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Open B2B Quotes</p>
                  <p className="font-headline text-headline-md text-light-on-surface tabular-nums mt-xs">
                    {analytics.pendingQuotes}
                  </p>
                </div>
                <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
                  <p className="font-label text-label-sm text-light-on-surface-variant uppercase">Low Stock SKUs (≤25)</p>
                  <p className="font-headline text-headline-md text-warning tabular-nums mt-xs">
                    {analytics.lowStockProducts}
                  </p>
                </div>
              </div>

              <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg">
                <h2 className="font-title text-title-md text-light-on-surface mb-md">Sales by Category</h2>
                {analytics.revenueByCategory.length === 0 ? (
                  <p className="font-body text-body-md text-light-on-surface-variant">
                    No completed order sales recorded yet.
                  </p>
                ) : (
                  <div className="divide-y divide-light-outline-variant">
                    {analytics.revenueByCategory.map((c) => (
                      <div key={c.categoryName} className="py-sm flex items-center justify-between">
                        <span className="font-body text-body-md text-light-on-surface">{c.categoryName}</span>
                        <div className="flex items-center gap-lg tabular-nums">
                          <span className="font-body text-body-sm text-light-on-surface-variant">
                            {c.unitsSold} units
                          </span>
                          <span className="font-title text-title-sm text-light-secondary">
                            {formatAed(c.revenueAed)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'products' && (
            <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-light-outline-variant bg-light-surface-container-low font-label text-label-sm text-light-on-surface-variant uppercase">
                    <th className="p-md">Product</th>
                    <th className="p-md">SKU</th>
                    <th className="p-md">Category</th>
                    <th className="p-md text-right">Price (AED)</th>
                    <th className="p-md text-right">Stock</th>
                    <th className="p-md text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-outline-variant font-body text-body-sm">
                  {products.map((p) => (
                    <tr key={p.id} className="hover:bg-light-surface-container-low/50">
                      <td className="p-md flex items-center gap-sm">
                        <SafeImage src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover shrink-0" />
                        <span className="font-title text-title-sm text-light-on-surface">{p.name}</span>
                      </td>
                      <td className="p-md font-mono text-mono-sm">{p.sku}</td>
                      <td className="p-md">{p.categoryName}</td>
                      <td className="p-md text-right tabular-nums">{formatAed(p.priceAed)}</td>
                      <td className="p-md text-right tabular-nums">{p.stockQty}</td>
                      <td className="p-md text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditProductModal(p)}
                          className="text-light-primary font-label text-label-sm hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-light-error font-label text-label-sm hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="flex flex-col gap-lg">
              <form
                onSubmit={handleCreateCategory}
                className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg grid grid-cols-1 md:grid-cols-3 gap-md"
              >
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Category Name"
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2 font-body text-body-md"
                />
                <input
                  type="text"
                  required
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                  placeholder="Short description"
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2 font-body text-body-md"
                />
                <div className="flex gap-xs">
                  <input
                    type="text"
                    required
                    value={cImage}
                    onChange={(e) => setCImage(e.target.value)}
                    placeholder="Image URL or upload"
                    className="flex-1 rounded border border-light-outline-variant bg-light-surface px-md py-2 font-body text-body-md"
                  />
                  <label className="px-3 py-2 rounded border border-light-outline-variant bg-light-surface cursor-pointer font-label text-label-sm flex items-center">
                    Upload
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, setCImage)}
                    />
                  </label>
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="px-lg py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md"
                  >
                    Add Category
                  </button>
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-md flex items-center gap-md"
                  >
                    <SafeImage src={c.image} alt={c.name} className="w-16 h-16 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-title text-title-sm text-light-on-surface">{c.name}</p>
                      <p className="font-body text-body-sm text-light-on-surface-variant truncate">{c.description}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteCategory(c.id)}
                      className="text-light-error font-label text-label-sm hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant divide-y divide-light-outline-variant">
              {orders.length === 0 ? (
                <p className="p-xl font-body text-body-md text-light-on-surface-variant">No orders placed yet.</p>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="p-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
                    <div>
                      <div className="flex items-center gap-sm">
                        <span className="font-mono text-mono-sm font-semibold text-light-secondary">{o.orderNumber}</span>
                        <span className="font-body text-body-sm text-light-on-surface-variant">
                          {new Date(o.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="font-title text-title-sm text-light-on-surface mt-xs">
                        {o.customerName} {o.companyName ? `(${o.companyName})` : ''} • {o.customerPhone}
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-variant">
                        {o.city}, {o.emirate} — {o.address}
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface mt-xs tabular-nums">
                        Total: <strong>{formatAed(o.totalAed)}</strong> ({o.paymentMethod.toUpperCase()})
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-sm">
                      <select
                        value={o.orderStatus}
                        onChange={(e) => handleOrderUpdate(o.id, e.target.value, o.paymentStatus)}
                        aria-label="Order status"
                        className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-label text-label-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="preparing">Preparing</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                      <select
                        value={o.paymentStatus}
                        onChange={(e) => handleOrderUpdate(o.id, o.orderStatus, e.target.value)}
                        aria-label="Payment status"
                        className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-label text-label-sm"
                      >
                        <option value="cod_pending">COD Pending</option>
                        <option value="awaiting_bank_transfer">Awaiting Bank Transfer</option>
                        <option value="awaiting_gateway_payment">Awaiting Gateway Payment</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant divide-y divide-light-outline-variant">
              {quotes.length === 0 ? (
                <p className="p-xl font-body text-body-md text-light-on-surface-variant">No B2B quotes submitted yet.</p>
              ) : (
                quotes.map((q) => (
                  <div key={q.id} className="p-lg flex flex-col md:flex-row md:items-center justify-between gap-md">
                    <div>
                      <span className="font-mono text-mono-sm font-semibold text-light-primary">{q.referenceNumber}</span>
                      <p className="font-title text-title-sm text-light-on-surface mt-xs">
                        {q.companyName} — {q.contactPerson} ({q.phone})
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface-variant">
                        {q.businessType} • {q.deliveryLocation} • {q.supplyFrequency}
                      </p>
                      <p className="font-body text-body-sm text-light-on-surface mt-xs">
                        Items: {q.productsRequired} ({q.estimatedQuantity})
                      </p>
                    </div>
                    <select
                      value={q.status}
                      onChange={(e) => handleQuoteStatus(q.id, e.target.value)}
                      aria-label="Quote status"
                      className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-label text-label-sm"
                    >
                      <option value="new">New</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="quoted">Quoted</option>
                      <option value="approved">Approved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'discounts' && (
            <div className="flex flex-col gap-lg">
              <form
                onSubmit={handleCreateDiscount}
                className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg grid grid-cols-1 sm:grid-cols-5 gap-sm items-end"
              >
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-sm">Code *</span>
                  <input
                    type="text"
                    required
                    value={dCode}
                    onChange={(e) => setDCode(e.target.value.toUpperCase())}
                    placeholder="OFFICE20"
                    className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-mono text-mono-sm uppercase"
                  />
                </label>
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-sm">Type</span>
                  <select
                    value={dType}
                    onChange={(e) => setDType(e.target.value as 'percent' | 'fixed')}
                    className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-sm"
                  >
                    <option value="percent">% Off</option>
                    <option value="fixed">Fixed AED Off</option>
                  </select>
                </label>
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-sm">Value</span>
                  <input
                    type="number"
                    min={1}
                    required
                    value={dValue}
                    onChange={(e) => setDValue(e.target.value)}
                    className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-sm"
                  />
                </label>
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-sm">Min Order (AED)</span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={dMinOrder}
                    onChange={(e) => setDMinOrder(e.target.value)}
                    className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-sm"
                  />
                </label>
                <button
                  type="submit"
                  className="py-2 px-md rounded bg-light-primary text-light-on-primary font-label text-label-md"
                >
                  Create Code
                </button>
              </form>

              <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant divide-y divide-light-outline-variant">
                {discounts.map((d) => (
                  <div key={d.id} className="p-md flex flex-wrap items-center justify-between gap-md">
                    <div>
                      <span className="font-mono text-mono-sm font-semibold text-light-secondary">{d.code}</span>
                      <span className="ml-3 font-body text-body-sm text-light-on-surface-variant">
                        {d.type === 'percent' ? `${d.value}% off` : `${formatAed(d.value)} off`} • Min{' '}
                        {formatAed(d.minOrderAed)} • Used {d.usageCount}×
                      </span>
                    </div>
                    <div className="flex items-center gap-sm">
                      <button
                        type="button"
                        onClick={() => handleToggleDiscount(d)}
                        className={`px-3 py-1 rounded font-label text-label-sm ${
                          d.active
                            ? 'bg-light-primary-container text-light-on-primary-container'
                            : 'bg-light-surface-container text-light-on-surface-variant'
                        }`}
                      >
                        {d.active ? 'Active' : 'Paused'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDiscount(d.id)}
                        className="text-light-error font-label text-label-sm hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-light-outline-variant bg-light-surface-container-low font-label text-label-sm text-light-on-surface-variant uppercase">
                    <th className="p-md">Customer</th>
                    <th className="p-md">Type / Company</th>
                    <th className="p-md">Emirate</th>
                    <th className="p-md text-right">Orders</th>
                    <th className="p-md text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-light-outline-variant font-body text-body-sm">
                  {customers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-xl text-center text-light-on-surface-variant">
                        No registered customers yet.
                      </td>
                    </tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id}>
                        <td className="p-md">
                          <p className="font-title text-title-sm text-light-on-surface">{c.name}</p>
                          <p className="text-light-on-surface-variant">{c.email} • {c.phone}</p>
                        </td>
                        <td className="p-md capitalize">
                          {c.customerType} {c.companyName ? `(${c.companyName})` : ''}
                        </td>
                        <td className="p-md">{c.city}, {c.emirate}</td>
                        <td className="p-md text-right tabular-nums">{c.orderCount}</td>
                        <td className="p-md text-right tabular-nums">{formatAed(c.totalSpentAed)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && settings && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl grid grid-cols-1 md:grid-cols-2 gap-md"
            >
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md">UAE VAT Rate (e.g. 0.05 for 5%)</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  max={0.25}
                  value={settings.vatRate}
                  onChange={(e) => setSettings({ ...settings, vatRate: Number(e.target.value) })}
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2 font-body text-body-md"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md">Dubai Delivery Fee (AED)</span>
                <input
                  type="number"
                  min={0}
                  value={settings.dubaiDeliveryFee}
                  onChange={(e) => setSettings({ ...settings, dubaiDeliveryFee: Number(e.target.value) })}
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2 font-body text-body-md"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md">Other Emirates Delivery Fee (AED)</span>
                <input
                  type="number"
                  min={0}
                  value={settings.otherEmiratesDeliveryFee}
                  onChange={(e) => setSettings({ ...settings, otherEmiratesDeliveryFee: Number(e.target.value) })}
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2 font-body text-body-md"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md">Free Delivery Threshold (AED)</span>
                <input
                  type="number"
                  min={0}
                  value={settings.freeDeliveryThreshold}
                  onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2 font-body text-body-md"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-md">WhatsApp Procurement Number</span>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="rounded border border-light-outline-variant bg-light-surface px-md py-2 font-mono text-mono-sm"
                />
              </label>
              <div className="md:col-span-2 flex flex-wrap gap-lg pt-sm">
                <label className="flex items-center gap-2 font-body text-body-md">
                  <input
                    type="checkbox"
                    checked={settings.codEnabled}
                    onChange={(e) => setSettings({ ...settings, codEnabled: e.target.checked })}
                    className="rounded text-light-primary"
                  />
                  <span>Enable Cash on Delivery (COD)</span>
                </label>
                <label className="flex items-center gap-2 font-body text-body-md">
                  <input
                    type="checkbox"
                    checked={settings.bankTransferEnabled}
                    onChange={(e) => setSettings({ ...settings, bankTransferEnabled: e.target.checked })}
                    className="rounded text-light-primary"
                  />
                  <span>Enable B2B Bank Transfer</span>
                </label>
                <label className="flex items-center gap-2 font-body text-body-md">
                  <input
                    type="checkbox"
                    checked={settings.uaeGatewayEnabled}
                    onChange={(e) => setSettings({ ...settings, uaeGatewayEnabled: e.target.checked })}
                    className="rounded text-light-primary"
                  />
                  <span>Show UAE Payment Gateway Option</span>
                </label>
              </div>
              <div className="md:col-span-2 pt-sm">
                <button
                  type="submit"
                  className="px-xl py-3 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary"
                >
                  Save UAE Configuration
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-md">
          <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant max-w-2xl w-full p-lg lg:p-xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-md">
              <h2 className="font-headline text-headline-sm text-light-on-surface">
                {editingProduct ? 'Edit Product' : 'Add Commercial Product'}
              </h2>
              <button
                type="button"
                onClick={() => setProductModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-light-surface-container flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-md">
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-sm">Product Name *</span>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-md"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-sm">SKU *</span>
                <input
                  type="text"
                  required
                  value={pSku}
                  onChange={(e) => setPSku(e.target.value.toUpperCase())}
                  className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-mono text-mono-sm"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-sm">Category *</span>
                <select
                  value={pCategorySlug}
                  onChange={(e) => setPCategorySlug(e.target.value)}
                  className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-md"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-sm">Brand</span>
                <input
                  type="text"
                  value={pBrand}
                  onChange={(e) => setPBrand(e.target.value)}
                  className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-md"
                />
              </label>
              <label className="flex flex-col gap-xs">
                <span className="font-label text-label-sm">Pack Size *</span>
                <input
                  type="text"
                  required
                  value={pPackSize}
                  onChange={(e) => setPPackSize(e.target.value)}
                  className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-md"
                />
              </label>
              <div className="grid grid-cols-2 gap-sm">
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-sm">Price (AED) *</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    required
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-md"
                  />
                </label>
                <label className="flex flex-col gap-xs">
                  <span className="font-label text-label-sm">Stock Qty *</span>
                  <input
                    type="number"
                    min="0"
                    required
                    value={pStock}
                    onChange={(e) => setPStock(e.target.value)}
                    className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-md"
                  />
                </label>
              </div>
              <div className="sm:col-span-2 flex flex-col gap-xs">
                <span className="font-label text-label-sm">Product Image (Upload or URL) *</span>
                <div className="flex gap-sm">
                  <input
                    type="text"
                    required
                    value={pImage}
                    onChange={(e) => setPImage(e.target.value)}
                    placeholder="https://... or /uploads/..."
                    className="flex-1 rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-sm"
                  />
                  <label className="px-md py-2 rounded border border-light-outline-variant bg-light-surface-container-low cursor-pointer font-label text-label-sm flex items-center">
                    {uploadingImg ? 'Uploading...' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(e) => handleImageFileUpload(e, setPImage)}
                    />
                  </label>
                </div>
              </div>
              <label className="sm:col-span-2 flex flex-col gap-xs">
                <span className="font-label text-label-sm">Description *</span>
                <textarea
                  rows={3}
                  required
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-body text-body-md"
                />
              </label>
              <label className="sm:col-span-2 flex items-center gap-2 font-body text-body-sm">
                <input
                  type="checkbox"
                  checked={pFeatured}
                  onChange={(e) => setPFeatured(e.target.checked)}
                  className="rounded text-light-primary"
                />
                <span>Feature this product on Homepage</span>
              </label>
              <div className="sm:col-span-2 flex justify-end gap-sm pt-sm">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-lg py-2.5 rounded border border-light-outline-variant font-label text-label-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-lg py-2.5 rounded bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-secondary"
                >
                  {editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
