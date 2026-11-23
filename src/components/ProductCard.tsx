import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatAed } from '../lib/uae';
import type { Product } from '../types';
import { SafeImage } from './SafeImage';

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
  layout?: 'grid' | 'list';
}

export function ProductCard({ product, onQuickView, layout = 'grid' }: ProductCardProps) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const isWished = wishlist.includes(product.id);
  const inStock = product.stockQty > 0;

  if (layout === 'list') {
    return (
      <article className="bg-light-surface-container-lowest rounded-md border border-light-outline-variant p-md flex flex-col sm:flex-row items-center gap-md shadow-sm hover:shadow-md transition-shadow">
        <Link
          to={`/product/${product.slug}`}
          className="w-28 h-28 shrink-0 rounded bg-light-surface-container-low overflow-hidden"
        >
          <SafeImage src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </Link>
        <div className="flex-1 flex flex-col gap-xs min-w-0">
          <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
            {product.categoryName}
          </span>
          <Link
            to={`/product/${product.slug}`}
            className="font-title text-title-md text-light-on-surface hover:text-light-primary truncate"
          >
            {product.name}
          </Link>
          <p className="font-body text-body-sm text-light-on-surface-variant">
            {product.packSize} •{' '}
            <span className={inStock ? 'text-light-primary font-medium' : 'text-light-error font-medium'}>
              {inStock ? `In Stock (${product.stockQty})` : 'Out of Stock'}
            </span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-sm shrink-0">
          <div className="text-right">
            <span className="font-title text-title-lg text-light-secondary tabular-nums">
              {formatAed(product.priceAed)}
            </span>
            <span className="block font-body text-body-sm text-light-on-surface-variant">Excl. 5% VAT</span>
          </div>
          <div className="flex items-center gap-xs">
            <button
              type="button"
              disabled={!inStock}
              onClick={() => addToCart(product, 1)}
              className="px-md py-2 rounded bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-secondary disabled:opacity-50 transition-colors whitespace-nowrap"
            >
              Add to Cart
            </button>
            <Link
              to={`/product/${product.slug}`}
              className="px-md py-2 rounded border border-light-outline-variant font-label text-label-md text-light-on-surface hover:border-light-primary whitespace-nowrap"
            >
              Details
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="bg-light-surface-container-lowest rounded-md border border-light-outline-variant overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="relative bg-light-surface-container-low aspect-square overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block w-full h-full">
          <SafeImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-200"
          />
        </Link>
        <button
          type="button"
          onClick={() => toggleWishlist(product.id)}
          aria-label={isWished ? 'Remove from wishlist' : 'Save to wishlist'}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-light-surface-container-lowest/95 border border-light-outline-variant flex items-center justify-center transition-colors ${
            isWished ? 'text-light-primary' : 'text-light-on-surface-variant hover:text-light-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isWished ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </div>
      <div className="p-md flex flex-col flex-1 gap-xs">
        <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
          {product.categoryName}
        </span>
        <Link
          to={`/product/${product.slug}`}
          className="font-title text-title-md text-light-on-surface hover:text-light-primary"
        >
          {product.name}
        </Link>
        <p className="font-body text-body-sm text-light-on-surface-variant">
          {product.packSize} •{' '}
          <span className={inStock ? 'text-light-primary font-medium' : 'text-light-error font-medium'}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </p>
        <div className="mt-auto pt-sm flex items-baseline justify-between gap-sm">
          <span className="font-title text-title-lg text-light-secondary tabular-nums">
            {formatAed(product.priceAed)}
          </span>
          <span className="font-body text-body-sm text-light-on-surface-variant">Excl. VAT</span>
        </div>
        <div className="pt-sm flex items-center gap-sm">
          <button
            type="button"
            disabled={!inStock}
            onClick={() => addToCart(product, 1)}
            className="flex-1 py-2 px-3 rounded bg-light-primary text-light-on-primary font-label text-label-md hover:bg-light-secondary disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {inStock ? 'Add to Cart' : 'Unavailable'}
          </button>
          {onQuickView ? (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              className="py-2 px-3 rounded border border-light-outline-variant text-light-on-surface font-label text-label-md hover:border-light-primary whitespace-nowrap"
            >
              Quick View
            </button>
          ) : (
            <Link
              to={`/product/${product.slug}`}
              className="py-2 px-3 rounded border border-light-outline-variant text-light-on-surface font-label text-label-md hover:border-light-primary whitespace-nowrap"
            >
              Details
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
