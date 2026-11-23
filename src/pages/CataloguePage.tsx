import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ProductCard } from '../components/ProductCard';
import { QuickViewModal } from '../components/QuickViewModal';
import { useStore } from '../context/StoreContext';
import { apiFetch } from '../lib/api';
import type { Product } from '../types';

const PAGE_SIZE = 9;

export function CataloguePage() {
  const { categories } = useStore();
  const { slug: routeCategorySlug } = useParams<{ slug?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialSearch = searchParams.get('q') || '';
  const initialCatParam = routeCategorySlug || searchParams.get('cat') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCats, setSelectedCats] = useState<string[]>(initialCatParam ? [initialCatParam] : []);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(500);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'featured' | 'popular' | 'price-asc' | 'price-desc' | 'newest'>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  useEffect(() => {
    const qParam = searchParams.get('q') || '';
    if (qParam !== searchTerm) {
      setSearchTerm(qParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (routeCategorySlug) {
      setSelectedCats([routeCategorySlug]);
    } else {
      const catQuery = searchParams.get('cat');
      if (catQuery) setSelectedCats([catQuery]);
    }
    setCurrentPage(1);
  }, [routeCategorySlug]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    apiFetch<Product[]>(`/api/products?sort=${encodeURIComponent(sortBy)}`)
      .then((data) => {
        if (active) setProducts(data);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [sortBy]);

  const availableBrands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brand))).sort(),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      if (selectedCats.length > 0 && !selectedCats.includes(p.categorySlug)) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (p.priceAed > maxPrice) return false;
      if (inStockOnly && p.stockQty <= 0) return false;
      if (q) {
        const matches =
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          p.packSize.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [products, selectedCats, selectedBrands, maxPrice, inStockOnly, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedProducts = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const activeCategoryObj = routeCategorySlug
    ? categories.find((c) => c.slug === routeCategorySlug)
    : selectedCats.length === 1
      ? categories.find((c) => c.slug === selectedCats[0])
      : null;

  function toggleCategory(slug: string) {
    setCurrentPage(1);
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  function toggleBrand(brand: string) {
    setCurrentPage(1);
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  function resetAllFilters() {
    setSelectedCats(routeCategorySlug ? [routeCategorySlug] : []);
    setSelectedBrands([]);
    setMaxPrice(500);
    setInStockOnly(false);
    setSearchTerm('');
    setSearchParams({});
    setCurrentPage(1);
  }

  return (
    <div className="max-w-[1280px] w-full mx-auto px-md lg:px-xl py-xl">
      {/* Breadcrumb & Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl pb-lg border-b border-light-outline-variant">
        <div>
          <nav aria-label="Breadcrumb" className="font-body text-body-sm text-light-on-surface-variant mb-xs">
            <Link to="/" className="hover:text-light-primary">Home</Link> /{' '}
            {activeCategoryObj ? (
              <>
                <Link to="/catalogue" className="hover:text-light-primary">Catalogue</Link> /{' '}
                <span className="text-light-on-surface">{activeCategoryObj.name}</span>
              </>
            ) : (
              <span className="text-light-on-surface">
                {searchTerm ? `Search: "${searchTerm}"` : 'Product Catalogue'}
              </span>
            )}
          </nav>
          <h1 className="font-headline text-display-md-mobile lg:text-display-md text-light-on-surface">
            {activeCategoryObj
              ? activeCategoryObj.name
              : searchTerm
                ? `Search Results for "${searchTerm}"`
                : 'Commercial Hygiene & Cleaning Catalogue'}
          </h1>
          {activeCategoryObj && (
            <p className="font-body text-body-md text-light-on-surface-variant mt-xs">
              {activeCategoryObj.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-sm">
          <button
            type="button"
            onClick={() => setMobileFiltersOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-2 rounded border border-light-outline-variant bg-light-surface-container-lowest font-label text-label-md"
          >
            <span className="material-symbols-outlined text-[18px]">tune</span>
            <span>Filters</span>
          </button>
          <span className="inline-flex self-start items-center px-3 py-1.5 rounded-full bg-light-primary-container text-light-on-primary-container font-label text-label-sm">
            Prices in AED • Bulk quotes available
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-xl items-start">
        {/* Left Sidebar Filters */}
        <aside
          className={`${
            mobileFiltersOpen ? 'block' : 'hidden'
          } lg:block lg:col-span-3 bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-lg flex flex-col gap-lg`}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-title text-title-md text-light-on-surface">Filters</h2>
            <button
              type="button"
              onClick={resetAllFilters}
              className="font-label text-label-sm text-light-primary hover:underline"
            >
              Reset all
            </button>
          </div>

          {/* Category Filter */}
          <div className="border-t border-light-outline-variant pt-md">
            <h3 className="font-label text-label-md text-light-on-surface mb-sm">Product Category</h3>
            <div className="flex flex-col gap-xs font-body text-body-sm">
              {categories.map((cat) => (
                <label key={cat.slug} className="flex items-center justify-between gap-2 cursor-pointer py-0.5">
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedCats.includes(cat.slug)}
                      onChange={() => toggleCategory(cat.slug)}
                      className="rounded text-light-primary focus:ring-light-primary"
                    />
                    <span>{cat.name}</span>
                  </span>
                  {cat.productCount !== undefined && (
                    <span className="text-light-on-surface-variant tabular-nums">{cat.productCount}</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div className="border-t border-light-outline-variant pt-md">
            <h3 className="font-label text-label-md text-light-on-surface mb-sm">Brand</h3>
            <div className="flex flex-col gap-xs font-body text-body-sm">
              {availableBrands.map((brand) => (
                <label key={brand} className="flex items-center gap-2 cursor-pointer py-0.5">
                  <input
                    type="checkbox"
                    checked={selectedBrands.includes(brand)}
                    onChange={() => toggleBrand(brand)}
                    className="rounded text-light-primary focus:ring-light-primary"
                  />
                  <span>{brand}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="border-t border-light-outline-variant pt-md">
            <h3 className="font-label text-label-md text-light-on-surface mb-sm">Max Price (AED)</h3>
            <input
              type="range"
              min={30}
              max={500}
              step={10}
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full accent-light-primary"
            />
            <div className="flex justify-between font-body text-body-sm text-light-on-surface-variant tabular-nums mt-1">
              <span>AED 0</span>
              <span>Up to AED {maxPrice}</span>
            </div>
          </div>

          {/* Availability */}
          <div className="border-t border-light-outline-variant pt-md">
            <h3 className="font-label text-label-md text-light-on-surface mb-sm">Availability</h3>
            <label className="flex items-center gap-2 font-body text-body-sm cursor-pointer">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setCurrentPage(1);
                }}
                className="rounded text-light-primary focus:ring-light-primary"
              />
              <span>In Stock Only (UAE Dispatch)</span>
            </label>
          </div>
        </aside>

        {/* Main Catalogue Column */}
        <div className="lg:col-span-9 flex flex-col gap-lg">
          {/* Toolbar */}
          <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-md flex flex-col sm:flex-row sm:items-center justify-between gap-md">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-light-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search products, pack sizes, or SKU..."
                className="w-full rounded border border-light-outline-variant bg-light-surface pl-10 pr-md py-2 font-body text-body-md text-light-on-surface focus:border-light-primary focus:ring-2 focus:ring-light-primary/20 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-sm">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                aria-label="Sort products"
                className="rounded border border-light-outline-variant bg-light-surface px-3 py-2 font-label text-label-md text-light-on-surface focus:border-light-primary focus:outline-none"
              >
                <option value="featured">Sort: Featured</option>
                <option value="popular">Popularity: Most Ordered</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>

              <div className="inline-flex rounded border border-light-outline-variant overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  aria-label="Grid view"
                  className={`px-2.5 py-2 transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-light-primary text-light-on-primary'
                      : 'bg-light-surface-container-lowest text-light-on-surface hover:bg-light-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  aria-label="List view"
                  className={`px-2.5 py-2 transition-colors ${
                    viewMode === 'list'
                      ? 'bg-light-primary text-light-on-primary'
                      : 'bg-light-surface-container-lowest text-light-on-surface hover:bg-light-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">view_list</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-sm">
            <p className="font-body text-body-sm text-light-on-surface-variant">
              Showing {filteredProducts.length} commercial {filteredProducts.length === 1 ? 'product' : 'products'}
            </p>
            <Link to="/b2b-quote" className="font-label text-label-md text-light-primary hover:underline">
              Need pallet pricing? Request Bulk Quote →
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-light-surface-container-lowest rounded-md border border-light-outline-variant h-80 animate-pulse"
                />
              ))}
            </div>
          ) : paginatedProducts.length === 0 ? (
            <div className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant p-2xl text-center flex flex-col items-center gap-md">
              <span className="material-symbols-outlined text-[40px] text-light-outline">search_off</span>
              <h2 className="font-headline text-headline-sm text-light-on-surface">No products matched your filters</h2>
              <p className="font-body text-body-md text-light-on-surface-variant max-w-md">
                Try clearing category or price filters, or request a custom B2B sourcing quotation for specialized supplies.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-lg py-2.5 rounded bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-secondary"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'list'
                  ? 'flex flex-col gap-md'
                  : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg items-stretch'
              }
            >
              {paginatedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  layout={viewMode}
                  onQuickView={(p) => setQuickViewProduct(p)}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-md flex items-center justify-between border-t border-light-outline-variant">
              <span className="font-body text-body-sm text-light-on-surface-variant tabular-nums">
                Page {safePage} of {totalPages}
              </span>
              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded border border-light-outline-variant bg-light-surface-container-lowest font-label text-label-md text-light-on-surface disabled:opacity-50"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const p = idx + 1;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setCurrentPage(p)}
                      className={`px-3 py-1.5 rounded font-label text-label-md ${
                        p === safePage
                          ? 'bg-light-primary text-light-on-primary'
                          : 'border border-light-outline-variant bg-light-surface-container-lowest text-light-on-surface hover:border-light-primary'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded border border-light-outline-variant bg-light-surface-container-lowest font-label text-label-md text-light-on-surface disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />
    </div>
  );
}
