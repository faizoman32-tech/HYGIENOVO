import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';
import type { CartItem, Category, CustomerUser, Product, ProductVariation, StoreConfig } from '../types';

interface StoreContextValue {
  categories: Category[];
  storeConfig: StoreConfig;
  cart: CartItem[];
  wishlist: number[];
  customer: CustomerUser | null;
  customerToken: string | null;
  adminToken: string | null;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  addToCart: (product: Product, qty?: number, variation?: ProductVariation | null) => void;
  updateCartQty: (productId: number, variationId: string, qty: number) => void;
  removeFromCart: (productId: number, variationId: string) => void;
  clearCart: () => void;
  toggleWishlist: (productId: number) => void;
  setCustomerSession: (token: string, user: CustomerUser) => void;
  logoutCustomer: () => void;
  setAdminToken: (token: string | null) => void;
  refreshStoreMetadata: () => Promise<void>;
}

const DEFAULT_CONFIG: StoreConfig = {
  vatRate: 0.05,
  dubaiDeliveryFee: 25,
  otherEmiratesDeliveryFee: 45,
  freeDeliveryThreshold: 500,
  codEnabled: true,
  bankTransferEnabled: true,
  uaeGatewayEnabled: true,
  uaeGatewayConfigured: false,
  whatsappNumber: '97140000000',
};

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = 'hygienovo_cart_v1';
const WISHLIST_STORAGE_KEY = 'hygienovo_wishlist_v1';

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [storeConfig, setStoreConfig] = useState<StoreConfig>(DEFAULT_CONFIG);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });
  const [wishlist, setWishlist] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((n) => typeof n === 'number');
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Auth tokens are strictly held in React memory (never persisted to localStorage/sessionStorage)
  const [customerToken, setCustomerToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // ignore
    }
  }, [wishlist]);

  const refreshStoreMetadata = useCallback(async () => {
    try {
      const [cats, cfg] = await Promise.all([
        apiFetch<Category[]>('/api/categories'),
        apiFetch<StoreConfig>('/api/store-config'),
      ]);
      setCategories(cats);
      setStoreConfig(cfg);
    } catch {
      // Keep defaults on transient load
    }
  }, []);

  useEffect(() => {
    refreshStoreMetadata();
  }, [refreshStoreMetadata]);

  const addToCart = useCallback(
    (product: Product, qty = 1, variation?: ProductVariation | null) => {
      const chosen = variation || product.variations[0] || {
        id: 'default',
        label: product.packSize,
        skuSuffix: '1PK',
        priceAed: product.priceAed,
        stockQty: product.stockQty,
      };
      const maxStock = Math.min(product.stockQty, chosen.stockQty);
      if (maxStock <= 0) {
        showToast(`${product.name} is currently out of stock.`);
        return;
      }

      setCart((prev) => {
        const idx = prev.findIndex(
          (item) => item.productId === product.id && item.variationId === chosen.id
        );
        if (idx >= 0) {
          const updated = [...prev];
          const nextQty = Math.min(maxStock, updated[idx].qty + qty);
          updated[idx] = { ...updated[idx], qty: nextQty, priceAed: chosen.priceAed, maxStock };
          return updated;
        }
        return [
          ...prev,
          {
            productId: product.id,
            sku: chosen.skuSuffix ? `${product.sku}-${chosen.skuSuffix}` : product.sku,
            slug: product.slug,
            name: product.name,
            categoryName: product.categoryName,
            variationId: chosen.id,
            variationLabel: chosen.label,
            priceAed: chosen.priceAed,
            qty: Math.min(maxStock, Math.max(1, qty)),
            image: product.image,
            maxStock,
          },
        ];
      });
      showToast(`Added ${product.name} (${chosen.label}) to cart`);
    },
    [showToast]
  );

  const updateCartQty = useCallback((productId: number, variationId: string, qty: number) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variationId === variationId
          ? { ...item, qty: Math.min(item.maxStock || 999, qty) }
          : item
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: number, variationId: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variationId === variationId))
    );
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleWishlist = useCallback(
    (productId: number) => {
      setWishlist((prev) => {
        const exists = prev.includes(productId);
        showToast(exists ? 'Removed from saved wishlist' : 'Saved to wishlist');
        return exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      });
    },
    [showToast]
  );

  const setCustomerSession = useCallback((token: string, user: CustomerUser) => {
    setCustomerToken(token);
    setCustomer(user);
  }, []);

  const logoutCustomer = useCallback(() => {
    setCustomerToken(null);
    setCustomer(null);
    showToast('Signed out of your account');
  }, [showToast]);

  return (
    <StoreContext.Provider
      value={{
        categories,
        storeConfig,
        cart,
        wishlist,
        customer,
        customerToken,
        adminToken,
        toastMessage,
        showToast,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toggleWishlist,
        setCustomerSession,
        logoutCustomer,
        setAdminToken,
        refreshStoreMetadata,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
