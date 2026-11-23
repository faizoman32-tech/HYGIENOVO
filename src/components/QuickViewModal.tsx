import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatAed } from '../lib/uae';
import type { Product } from '../types';
import { SafeImage } from './SafeImage';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const { addToCart } = useStore();
  const [selectedVarId, setSelectedVarId] = useState<string>('');

  if (!product) return null;

  const activeVar =
    product.variations.find((v) => v.id === selectedVarId) || product.variations[0] || null;
  const price = activeVar ? activeVar.priceAed : product.priceAed;
  const label = activeVar ? activeVar.label : product.packSize;

  return (
    <div
      className="fixed inset-0 z-50 bg-charcoal/50 flex items-center justify-center p-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qv-title"
      onClick={onClose}
    >
      <div
        className="bg-light-surface-container-lowest rounded-lg border border-light-outline-variant max-w-2xl w-full p-lg lg:p-xl shadow-xl relative grid grid-cols-1 md:grid-cols-2 gap-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-light-surface-container flex items-center justify-center hover:bg-light-primary-container"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>

        <SafeImage
          src={product.image}
          alt={product.name}
          className="w-full aspect-square object-cover rounded-md bg-light-surface-container-low"
        />

        <div className="flex flex-col gap-sm">
          <span className="font-label text-label-sm text-light-primary uppercase tracking-wider">
            {product.categoryName}
          </span>
          <h3 id="qv-title" className="font-headline text-headline-sm text-light-on-surface">
            {product.name}
          </h3>
          <p className="font-body text-body-sm text-light-on-surface-variant">
            {label} • {product.stockQty > 0 ? `In Stock (${product.stockQty})` : 'Out of Stock'}
          </p>
          <p className="font-title text-title-lg text-light-secondary tabular-nums mt-xs">
            {formatAed(price)}
          </p>
          <p className="font-body text-body-sm text-light-on-surface-variant line-clamp-3">
            {product.description}
          </p>

          {product.variations.length > 1 && (
            <div className="flex flex-wrap gap-xs pt-xs">
              {product.variations.map((v) => {
                const selected = (activeVar && activeVar.id === v.id) || false;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVarId(v.id)}
                    className={`px-3 py-1.5 rounded text-label-md font-label border transition-colors ${
                      selected
                        ? 'border-light-primary bg-light-primary-container text-light-on-primary-container'
                        : 'border-light-outline-variant bg-light-surface text-light-on-surface hover:border-light-primary'
                    }`}
                  >
                    {v.label}
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-md flex flex-col gap-sm">
            <button
              type="button"
              disabled={product.stockQty <= 0}
              onClick={() => {
                addToCart(product, 1, activeVar);
                onClose();
              }}
              className="w-full py-2.5 rounded bg-light-primary text-light-on-primary font-label text-label-lg hover:bg-light-secondary disabled:opacity-50 transition-colors"
            >
              Add to Cart
            </button>
            <Link
              to={`/product/${product.slug}`}
              onClick={onClose}
              className="w-full py-2.5 rounded border border-light-outline-variant text-center font-label text-label-md text-light-on-surface hover:border-light-primary"
            >
              View Full Details
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
