import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { SafeImage } from '../components/SafeImage';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import { buildWhatsAppLink, formatAed } from '../lib/uae';
import type { Product } from '../types';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { addToCart, storeConfig, wishlist, toggleWishlist } = useStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeImage, setActiveImage] = useState('');
  const [zoomed, setZoomed] = useState(false);
  const [selectedVariationId, setSelectedVariationId] = useState('');
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState<'specs' | 'apps' | 'usage' | 'pack'>('specs');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    setLoading(true);
    setError(null);
    apiFetch<{ product: Product; related: Product[] }>(`/api/products/${encodeURIComponent(slug)}`)
      .then((data) => {
        if (!active) return;
        setProduct(data.product);
        setRelated(data.related);
        setActiveImage(data.product.image);
        setSelectedVariationId(data.product.variations[0]?.id || '');
        setQty(1);
        setZoomed(false);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Product not found');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl">
          <div className="lg:col-span-6 aspect-square rounded-lg bg-light-surface-container animate-pulse" />
          <div className="lg:col-span-6 h-96 rounded-lg bg-light-surface-container animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-2xl text-center flex flex-col items-center gap-md">
        <h1 className="font-headline text-headline-lg text-light-on-surface">Product Not Found</h1>
        <p className="font-body text-body-md text-light-on-surface-variant">{error || 'Unable to locate product.'}</p>
        <Link to="/catalogue" className="px-lg py-2.5 rounded bg-light-primary text-light-on-primary font-label text-label-md">
          Back to Catalogue
        </Link>
      </div>
    );
  }

  const activeVariation =
    product.variations.find((v) => v.id === selectedVariationId) || product.variations[0] || null;
  const displayPrice = activeVariation ? activeVariation.priceAed : product.priceAed;
  const displaySku = activeVariation?.skuSuffix ? `${product.sku}-${activeVariation.skuSuffix}` : product.sku;
  const availableStock = activeVariation
    ? Math.min(product.stockQty, activeVariation.stockQty)
    : product.stockQty;
  const gallery = product.gallery.length > 0 ? product.gallery : [product.image];
  const isWished = wishlist.includes(product.id);

  const whatsappUrl = buildWhatsAppLink(
    storeConfig.whatsappNumber,
    `Hello HYGIENOVO, I have a question regarding ${product.name} (SKU: ${displaySku}, ${activeVariation?.label || product.packSize}).`
  );

  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-xl">
      <nav aria-label="Breadcrumb" className="font-body text-body-sm text-light-on-surface-variant mb-lg">
        <Link to="/" className="hover:text-light-primary">Home</Link> /{' '}
        <Link to={`/category/${product.categorySlug}`} className="hover:text-light-primary">
          {product.categoryName}
        </Link>{' '}
        / <span className="text-light-on-surface">{product.name}</span>
      </nav>

      {/* Main Product Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
        {/* Left: Gallery + Zoom */}
        <div className="lg:col-span-6 flex flex-col gap-md">
          <div className="relative bg-light-surface-container-lowest rounded-lg border border-light-outline-variant overflow-hidden">
            <div
              onClick={() => setZoomed((z) => !z)}
              className="cursor-zoom-in overflow-hidden"
            >
              <SafeImage
                src={activeImage || product.image}
                alt={product.name}
                className={`w-full aspect-square object-cover transition-transform duration-200 ${
                  zoomed ? 'scale-[1.35]' : 'scale-100'
                }`}
              />
            </div>
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className="absolute bottom-4 right-4 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-light-surface-container-lowest/95 border border-light-outline-variant font-label text-label-sm text-light-on-surface shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">
                {zoomed ? 'zoom_out' : 'zoom_in'}
              </span>
              <span>{zoomed ? 'Reset Zoom' : 'Toggle Zoom'}</span>
            </button>
          </div>

          {gallery.length > 1 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-md">
              {gallery.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setActiveImage(imgUrl);
                    setZoomed(false);
                  }}
                  className={`rounded-md overflow-hidden bg-light-surface-container-lowest border-2 transition-colors ${
                    (activeImage || product.image) === imgUrl
                      ? 'border-light-primary'
                      : 'border-light-outline-variant hover:border-light-primary'
                  }`}
                >
                  <SafeImage
                    src={imgUrl}
                    alt={`${product.name} view ${idx + 1}`}
                    className="w-full aspect-square object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info & Actions */}
        <div className="lg:col-span-6 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl flex flex-col gap-md shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-sm">
            <span className="font-mono text-mono-sm text-light-on-surface-variant">
              SKU: {displaySku}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full font-label text-label-sm ${
                availableStock > 0
                  ? 'bg-light-primary-container text-light-on-primary-container'
                  : 'bg-light-error-container text-light-on-error-container'
              }`}
            >
              {availableStock > 0
                ? `In Stock (${availableStock} available) • UAE Dispatch`
                : 'Currently Out of Stock'}
            </span>
          </div>

          <div className="flex items-start justify-between gap-md">
            <h1 className="font-headline text-display-md-mobile lg:text-headline-lg text-light-on-surface">
              {product.name}
            </h1>
            <button
              type="button"
              onClick={() => toggleWishlist(product.id)}
              aria-label="Save to wishlist"
              className={`w-10 h-10 rounded-full border border-light-outline-variant flex items-center justify-center shrink-0 ${
                isWished ? 'text-light-primary bg-light-primary-container/50' : 'text-light-on-surface-variant hover:text-light-primary'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isWished ? 'favorite' : 'favorite_border'}
              </span>
            </button>
          </div>

          <p className="font-body text-body-md text-light-on-surface-variant max-w-prose">
            {product.description}
          </p>

          <div className="py-md border-y border-light-outline-variant flex flex-wrap items-baseline justify-between gap-sm">
            <div>
              <span className="font-headline text-headline-lg text-light-secondary tabular-nums">
                {formatAed(displayPrice)}
              </span>
              <span className="ml-2 font-body text-body-sm text-light-on-surface-variant">
                Excl. {(storeConfig.vatRate * 100).toFixed(0)}% UAE VAT
              </span>
            </div>
            <span className="font-label text-label-sm text-light-primary">
              Bulk pallet rates available
            </span>
          </div>

          {/* Pack Size / Product Variations */}
          {product.variations.length > 0 && (
            <div>
              <span className="block font-label text-label-md text-light-on-surface mb-xs">
                Pack Size / Variation
              </span>
              <div className="flex flex-wrap gap-sm">
                {product.variations.map((v) => {
                  const selected = activeVariation?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedVariationId(v.id)}
                      className={`px-md py-2 rounded font-label text-label-md transition-colors ${
                        selected
                          ? 'border-2 border-light-primary bg-light-primary-container text-light-on-primary-container'
                          : 'border border-light-outline-variant bg-light-surface text-light-on-surface hover:border-light-primary'
                      }`}
                    >
                      {v.label} — {formatAed(v.priceAed)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity + Primary Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-sm pt-xs">
            <div className="inline-flex items-center justify-between border border-light-outline-variant rounded px-2 py-1.5 bg-light-surface w-36">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
                className="w-8 h-8 rounded hover:bg-light-surface-container flex items-center justify-center"
              >
                -
              </button>
              <span className="font-title text-title-md tabular-nums">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(Math.max(1, availableStock), q + 1))}
                aria-label="Increase quantity"
                className="w-8 h-8 rounded hover:bg-light-surface-container flex items-center justify-center"
              >
                +
              </button>
            </div>
            <button
              type="button"
              disabled={availableStock <= 0}
              onClick={() => addToCart(product, qty, activeVariation)}
              className="flex-1 py-3 px-lg rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-50 transition-colors"
            >
              Add to Cart
            </button>
            <button
              type="button"
              disabled={availableStock <= 0}
              onClick={() => {
                addToCart(product, qty, activeVariation);
                navigate('/checkout');
              }}
              className="py-3 px-lg rounded border border-light-outline-variant text-center font-label text-label-lg text-light-on-surface hover:border-light-primary disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 py-2.5 px-md rounded border border-light-primary/40 bg-light-surface-container-low text-light-secondary font-label text-label-md hover:bg-light-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span>Enquire on WhatsApp about this item</span>
          </a>

          {/* Dedicated B2B Bulk Quote Option */}
          <div className="bg-light-surface-container-low rounded-md border border-light-outline-variant p-md flex flex-col sm:flex-row sm:items-center justify-between gap-sm mt-xs">
            <div>
              <p className="font-title text-title-sm text-light-on-surface">
                Ordering 20+ units or recurring supply?
              </p>
              <p className="font-body text-body-sm text-light-on-surface-variant">
                Request a tailored AED quotation for your facility.
              </p>
            </div>
            <Link
              to="/b2b-quote"
              className="px-md py-2 rounded bg-light-secondary text-light-on-secondary font-label text-label-md whitespace-nowrap text-center hover:bg-light-primary"
            >
              Request Bulk Quote
            </Link>
          </div>
        </div>
      </section>

      {/* Tabs: Specifications, Applications, Usage, Packaging */}
      <section className="mt-2xl bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg lg:p-xl">
        <div className="flex flex-wrap gap-md border-b border-light-outline-variant pb-md mb-lg" role="tablist">
          {(
            [
              ['specs', 'Specifications'],
              ['apps', 'Applications'],
              ['usage', 'Usage & Safety'],
              ['pack', 'Packaging Details'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={`font-label text-label-lg pb-1 transition-colors ${
                activeTab === id
                  ? 'text-light-primary border-b-2 border-light-primary'
                  : 'text-light-on-surface-variant hover:text-light-on-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'specs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
            {product.specifications.map((spec, idx) => (
              <div key={idx} className="flex justify-between py-2 border-b border-light-outline-variant gap-md">
                <span className="font-body text-body-md text-light-on-surface-variant">{spec.label}</span>
                <span className="font-title text-title-sm text-right">{spec.value}</span>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'apps' && (
          <p className="font-body text-body-md text-light-on-surface-variant max-w-prose">
            {product.applications}
          </p>
        )}

        {activeTab === 'usage' && (
          <p className="font-body text-body-md text-light-on-surface-variant max-w-prose">
            {product.usageSafety}
          </p>
        )}

        {activeTab === 'pack' && (
          <p className="font-body text-body-md text-light-on-surface-variant max-w-prose">
            {product.packagingDetails}
          </p>
        )}
      </section>

      {/* Frequently Bought Together */}
      {related.length > 0 && (
        <section className="mt-2xl">
          <h2 className="font-headline text-headline-md text-light-on-surface mb-lg">
            Frequently Bought Together
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/product/${item.slug}`}
                className="bg-light-surface-container-lowest rounded-md border border-light-outline-variant p-md flex items-center gap-md hover:border-light-primary transition-colors"
              >
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded object-cover bg-light-surface-container-low shrink-0"
                />
                <div className="min-w-0">
                  <p className="font-title text-title-sm text-light-on-surface truncate">{item.name}</p>
                  <p className="font-body text-body-sm text-light-secondary tabular-nums">
                    {formatAed(item.priceAed)}
                  </p>
                  <p className="font-body text-body-sm text-light-on-surface-variant">{item.packSize}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
