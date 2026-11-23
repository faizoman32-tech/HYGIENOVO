export interface ProductVariation {
  id: string;
  label: string;
  skuSuffix: string;
  priceAed: number;
  stockQty: number;
}

export interface ProductSpecification {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  sku: string;
  slug: string;
  name: string;
  categorySlug: string;
  categoryName: string;
  brand: string;
  packSize: string;
  priceAed: number;
  stockQty: number;
  featured: boolean;
  description: string;
  specifications: ProductSpecification[];
  applications: string;
  usageSafety: string;
  packagingDetails: string;
  image: string;
  gallery: string[];
  variations: ProductVariation[];
  popularity: number;
  createdAt: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  description: string;
  image: string;
  displayOrder: number;
  productCount?: number;
}

export interface CartItem {
  productId: number;
  sku: string;
  slug: string;
  name: string;
  categoryName: string;
  variationId: string;
  variationLabel: string;
  priceAed: number;
  qty: number;
  image: string;
  maxStock: number;
}

export interface StoreConfig {
  vatRate: number;
  dubaiDeliveryFee: number;
  otherEmiratesDeliveryFee: number;
  freeDeliveryThreshold: number;
  codEnabled: boolean;
  bankTransferEnabled: boolean;
  uaeGatewayEnabled: boolean;
  uaeGatewayConfigured: boolean;
  whatsappNumber: string;
}

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  companyName: string;
  trn: string;
  customerType: 'business' | 'individual';
  emirate: string;
  city: string;
  address: string;
  createdAt: string;
}

export interface OrderItem {
  productId: number;
  sku: string;
  name: string;
  variationId: string;
  variationLabel: string;
  unitPriceAed: number;
  qty: number;
  lineTotalAed: number;
  image: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  trn: string;
  emirate: string;
  city: string;
  address: string;
  deliveryWindow: string;
  paymentMethod: 'cod' | 'bank_transfer' | 'uae_gateway';
  paymentStatus: 'cod_pending' | 'awaiting_bank_transfer' | 'awaiting_gateway_payment' | 'paid' | 'refunded';
  orderStatus: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  discountCode: string | null;
  discountAmountAed: number;
  subtotalAed: number;
  deliveryFeeAed: number;
  vatAmountAed: number;
  totalAed: number;
  items: OrderItem[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface B2BQuote {
  id: number;
  referenceNumber: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  businessType: string;
  deliveryLocation: string;
  productsRequired: string;
  estimatedQuantity: string;
  supplyFrequency: string;
  notes: string;
  status: 'new' | 'reviewing' | 'quoted' | 'approved' | 'closed';
  createdAt: string;
}

export interface DiscountCode {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  minOrderAed: number;
  active: boolean;
  usageCount: number;
  expiresAt: string | null;
}

export interface AdminAnalytics {
  totalRevenueAed: number;
  totalOrders: number;
  averageOrderValueAed: number;
  totalCustomers: number;
  pendingQuotes: number;
  lowStockProducts: number;
  revenueByCategory: Array<{ categoryName: string; revenueAed: number; unitsSold: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  recentOrders: Order[];
}
