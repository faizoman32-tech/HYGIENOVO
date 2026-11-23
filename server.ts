import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, initDatabase, mapOrderRow, mapProductRow } from './server/db.ts';
import {
  hashPassword,
  optionalAuth,
  requireAdminAuth,
  requireCustomerAuth,
  signToken,
  timingSafeCompareStrings,
  verifyPassword,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import {
  cleanText,
  isSafeImageUrl,
  isValidEmail,
  isValidEmirate,
  isValidUaePhone,
  isValidUaeTrn,
  slugify,
} from './server/validation.ts';

initDatabase();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

function getSettingsRow() {
  return db.prepare('SELECT * FROM store_settings WHERE id = 1').get() as Record<string, unknown>;
}

function formatStoreConfig() {
  const s = getSettingsRow();
  return {
    vatRate: Number(s.vat_rate),
    dubaiDeliveryFee: Number(s.dubai_delivery_fee),
    otherEmiratesDeliveryFee: Number(s.other_emirates_delivery_fee),
    freeDeliveryThreshold: Number(s.free_delivery_threshold),
    codEnabled: Boolean(s.cod_enabled),
    bankTransferEnabled: Boolean(s.bank_transfer_enabled),
    uaeGatewayEnabled: Boolean(s.uae_gateway_enabled),
    uaeGatewayConfigured: Boolean(process.env.UAE_PAYMENT_GATEWAY_KEY && process.env.UAE_PAYMENT_GATEWAY_KEY.trim()),
    whatsappNumber: String(s.whatsapp_number || '97140000000'),
  };
}

function roundMoney(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

// ============================================================================
// PUBLIC STOREFRONT API
// ============================================================================

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', brand: 'HYGIENOVO' });
});

app.get('/api/store-config', (_req, res) => {
  res.json(formatStoreConfig());
});

app.get('/api/categories', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_slug = c.slug) AS product_count
       FROM categories c ORDER BY c.display_order ASC, c.id ASC`
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      id: Number(r.id),
      slug: String(r.slug),
      name: String(r.name),
      description: String(r.description),
      image: String(r.image),
      displayOrder: Number(r.display_order),
      productCount: Number(r.product_count),
    }))
  );
});

app.get('/api/products', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const maxPrice = req.query.maxPrice ? Number(req.query.maxPrice) : null;
  const inStockOnly = req.query.inStock === 'true';
  const featuredOnly = req.query.featured === 'true';
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'featured';

  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (category && category !== 'all') {
    clauses.push('category_slug = ?');
    params.push(category);
  }
  if (search) {
    clauses.push('(LOWER(name) LIKE ? OR LOWER(sku) LIKE ? OR LOWER(category_name) LIKE ? OR LOWER(description) LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (maxPrice !== null && Number.isFinite(maxPrice)) {
    clauses.push('price_aed <= ?');
    params.push(maxPrice);
  }
  if (inStockOnly) {
    clauses.push('stock_qty > 0');
  }
  if (featuredOnly) {
    clauses.push('featured = 1');
  }

  let orderBy = 'featured DESC, popularity DESC, id ASC';
  if (sort === 'popular') orderBy = 'popularity DESC, id ASC';
  else if (sort === 'price-asc') orderBy = 'price_aed ASC, id ASC';
  else if (sort === 'price-desc') orderBy = 'price_aed DESC, id ASC';
  else if (sort === 'newest') orderBy = 'created_at DESC, id DESC';

  const whereSql = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM products ${whereSql} ORDER BY ${orderBy}`).all(...params) as Array<
    Record<string, unknown>
  >;

  res.json(rows.map(mapProductRow));
});

app.get('/api/products/:slugOrId', (req, res) => {
  const param = req.params.slugOrId;
  const row = (/^\d+$/.test(param)
    ? db.prepare('SELECT * FROM products WHERE id = ?').get(Number(param))
    : db.prepare('SELECT * FROM products WHERE slug = ?').get(param)) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  const product = mapProductRow(row);
  const relatedRows = db
    .prepare('SELECT * FROM products WHERE id != ? ORDER BY (category_slug = ?) DESC, popularity DESC LIMIT 3')
    .all(product.id, product.categorySlug) as Array<Record<string, unknown>>;

  res.json({
    product,
    related: relatedRows.map(mapProductRow),
  });
});

app.post('/api/discount/validate', (req, res) => {
  const rawCode = cleanText(req.body?.code, 40).toUpperCase();
  const subtotalAed = Number(req.body?.subtotalAed ?? 0);

  if (!rawCode) {
    res.status(400).json({ error: 'Please enter a discount code.' });
    return;
  }
  if (!Number.isFinite(subtotalAed) || subtotalAed < 0) {
    res.status(400).json({ error: 'Invalid cart subtotal.' });
    return;
  }

  const disc = db.prepare('SELECT * FROM discount_codes WHERE UPPER(code) = ?').get(rawCode) as
    | Record<string, unknown>
    | undefined;

  if (!disc || !disc.active) {
    res.status(404).json({ error: 'Discount code is invalid or inactive.' });
    return;
  }

  if (disc.expires_at && new Date(String(disc.expires_at)).getTime() < Date.now()) {
    res.status(400).json({ error: 'This discount code has expired.' });
    return;
  }

  const minOrder = Number(disc.min_order_aed);
  if (subtotalAed < minOrder) {
    res.status(400).json({ error: `Minimum order of AED ${minOrder.toFixed(2)} required for ${rawCode}.` });
    return;
  }

  const discountAmount =
    disc.type === 'percent'
      ? roundMoney((subtotalAed * Number(disc.value)) / 100)
      : roundMoney(Math.min(subtotalAed, Number(disc.value)));

  res.json({
    code: String(disc.code),
    type: String(disc.type),
    value: Number(disc.value),
    minOrderAed: minOrder,
    discountAmountAed: discountAmount,
  });
});

app.post('/api/orders', optionalAuth, (req: AuthenticatedRequest, res) => {
  const body = req.body ?? {};
  const customerName = cleanText(body.customerName, 120);
  const customerEmail = cleanText(body.customerEmail, 160).toLowerCase();
  const customerPhone = cleanText(body.customerPhone, 30);
  const companyName = cleanText(body.companyName, 140);
  const trn = cleanText(body.trn, 20);
  const emirate = cleanText(body.emirate, 40);
  const city = cleanText(body.city, 80);
  const address = cleanText(body.address, 260);
  const deliveryWindow = cleanText(body.deliveryWindow, 100) || 'Standard UAE Business Hours (9:00 AM – 5:00 PM)';
  const paymentMethod = cleanText(body.paymentMethod, 30);
  const discountCodeInput = cleanText(body.discountCode, 40).toUpperCase();
  const notes = cleanText(body.notes, 500);
  const rawItems = Array.isArray(body.items) ? body.items : [];

  if (!customerName) {
    res.status(400).json({ error: 'Contact name is required.' });
    return;
  }
  if (!isValidEmail(customerEmail)) {
    res.status(400).json({ error: 'Valid email address is required.' });
    return;
  }
  if (!isValidUaePhone(customerPhone)) {
    res.status(400).json({ error: 'Enter a valid UAE phone number (e.g., +971 50 123 4567 or 04 123 4567).' });
    return;
  }
  if (!isValidUaeTrn(trn)) {
    res.status(400).json({ error: 'UAE TRN must be exactly 15 digits when provided.' });
    return;
  }
  if (!isValidEmirate(emirate)) {
    res.status(400).json({ error: 'Select a valid UAE Emirate.' });
    return;
  }
  if (!city || !address) {
    res.status(400).json({ error: 'City and street delivery address are required.' });
    return;
  }
  if (!['cod', 'bank_transfer', 'uae_gateway'].includes(paymentMethod)) {
    res.status(400).json({ error: 'Unsupported payment method.' });
    return;
  }
  if (rawItems.length === 0) {
    res.status(400).json({ error: 'Your cart is empty.' });
    return;
  }

  const config = formatStoreConfig();
  if (paymentMethod === 'cod' && !config.codEnabled) {
    res.status(400).json({ error: 'Cash on Delivery is currently disabled.' });
    return;
  }
  if (paymentMethod === 'bank_transfer' && !config.bankTransferEnabled) {
    res.status(400).json({ error: 'Bank Transfer is currently disabled.' });
    return;
  }
  if (paymentMethod === 'uae_gateway' && !config.uaeGatewayEnabled) {
    res.status(400).json({ error: 'Online UAE Card Gateway is currently disabled.' });
    return;
  }

  // Recompute all prices & verify stock on the server
  const verifiedItems: Array<{
    productId: number;
    sku: string;
    name: string;
    variationId: string;
    variationLabel: string;
    unitPriceAed: number;
    qty: number;
    lineTotalAed: number;
    image: string;
  }> = [];

  let subtotalAed = 0;

  try {
    db.exec('BEGIN IMMEDIATE');

    for (const rawItem of rawItems) {
      const productId = Number(rawItem?.productId);
      const qty = Math.floor(Number(rawItem?.qty));
      const variationId = cleanText(rawItem?.variationId, 60);

      if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1 || qty > 1000) {
        throw new Error('Invalid cart item quantity.');
      }

      const prodRow = db.prepare('SELECT * FROM products WHERE id = ?').get(productId) as
        | Record<string, unknown>
        | undefined;
      if (!prodRow) {
        throw new Error('One of the products in your cart is no longer available.');
      }
      const product = mapProductRow(prodRow);

      let unitPrice = product.priceAed;
      let variationLabel = product.packSize;
      let sku = product.sku;
      let availableStock = product.stockQty;

      if (product.variations.length > 0 && variationId) {
        const matched = product.variations.find((v: { id: string }) => v.id === variationId);
        if (matched) {
          unitPrice = matched.priceAed;
          variationLabel = matched.label;
          sku = `${product.sku}-${matched.skuSuffix}`;
          availableStock = Math.min(product.stockQty, matched.stockQty);
        }
      }

      if (availableStock < qty) {
        throw new Error(`Insufficient stock for ${product.name} (${variationLabel}). Available: ${availableStock}.`);
      }

      const lineTotal = roundMoney(unitPrice * qty);
      subtotalAed = roundMoney(subtotalAed + lineTotal);

      verifiedItems.push({
        productId: product.id,
        sku,
        name: product.name,
        variationId: variationId || 'default',
        variationLabel,
        unitPriceAed: unitPrice,
        qty,
        lineTotalAed: lineTotal,
        image: product.image,
      });

      db.prepare('UPDATE products SET stock_qty = MAX(0, stock_qty - ?), popularity = popularity + ? WHERE id = ?').run(
        qty,
        qty,
        product.id
      );
    }

    let appliedCode: string | null = null;
    let discountAmountAed = 0;

    if (discountCodeInput) {
      const disc = db.prepare('SELECT * FROM discount_codes WHERE UPPER(code) = ?').get(discountCodeInput) as
        | Record<string, unknown>
        | undefined;
      if (!disc || !disc.active) {
        throw new Error('Discount code is invalid or inactive.');
      }
      if (disc.expires_at && new Date(String(disc.expires_at)).getTime() < Date.now()) {
        throw new Error('Discount code has expired.');
      }
      const minOrder = Number(disc.min_order_aed);
      if (subtotalAed < minOrder) {
        throw new Error(`Minimum order of AED ${minOrder.toFixed(2)} required for code ${discountCodeInput}.`);
      }
      discountAmountAed =
        disc.type === 'percent'
          ? roundMoney((subtotalAed * Number(disc.value)) / 100)
          : roundMoney(Math.min(subtotalAed, Number(disc.value)));
      appliedCode = String(disc.code);
      db.prepare('UPDATE discount_codes SET usage_count = usage_count + 1 WHERE id = ?').run(Number(disc.id));
    }

    const discountedSubtotal = Math.max(0, roundMoney(subtotalAed - discountAmountAed));
    const baseDelivery = emirate === 'Dubai' ? config.dubaiDeliveryFee : config.otherEmiratesDeliveryFee;
    const deliveryFeeAed =
      config.freeDeliveryThreshold > 0 && discountedSubtotal >= config.freeDeliveryThreshold ? 0 : baseDelivery;

    const vatAmountAed = roundMoney((discountedSubtotal + deliveryFeeAed) * config.vatRate);
    const totalAed = roundMoney(discountedSubtotal + deliveryFeeAed + vatAmountAed);

    const paymentStatus =
      paymentMethod === 'cod'
        ? 'cod_pending'
        : paymentMethod === 'bank_transfer'
          ? 'awaiting_bank_transfer'
          : 'awaiting_gateway_payment';

    const orderNumber = `HYG-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`;
    const userId = req.auth?.role === 'customer' ? Number(req.auth.sub) : null;

    const insertRes = db
      .prepare(
        `INSERT INTO orders (
          order_number, user_id, customer_name, customer_email, customer_phone,
          company_name, trn, emirate, city, address, delivery_window,
          payment_method, payment_status, order_status, discount_code,
          discount_amount_aed, subtotal_aed, delivery_fee_aed, vat_amount_aed,
          total_aed, items_json, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        orderNumber,
        userId,
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
        paymentStatus,
        appliedCode,
        discountAmountAed,
        subtotalAed,
        deliveryFeeAed,
        vatAmountAed,
        totalAed,
        JSON.stringify(verifiedItems),
        notes
      );

    db.exec('COMMIT');

    const createdRow = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(insertRes.lastInsertRowid)) as Record<
      string,
      unknown
    >;

    res.status(201).json({
      order: mapOrderRow(createdRow),
      gatewayNotice:
        paymentMethod === 'uae_gateway' && !config.uaeGatewayConfigured
          ? 'Your order has been saved as Awaiting Card Payment. Select Cash on Delivery or Corporate Bank Transfer if you prefer immediate dispatch confirmation.'
          : null,
    });
  } catch (err) {
    db.exec('ROLLBACK');
    const message = err instanceof Error ? err.message : 'Unable to place order.';
    res.status(400).json({ error: message });
  }
});

app.get('/api/orders/track/:orderNumber', (req, res) => {
  const orderNumber = cleanText(req.params.orderNumber, 40).toUpperCase();
  const email = cleanText(req.query.email, 160).toLowerCase();

  if (!orderNumber || !isValidEmail(email)) {
    res.status(400).json({ error: 'Order number and customer email are required to track an order.' });
    return;
  }

  const row = db
    .prepare('SELECT * FROM orders WHERE UPPER(order_number) = ? AND LOWER(customer_email) = ?')
    .get(orderNumber, email) as Record<string, unknown> | undefined;

  if (!row) {
    res.status(404).json({ error: 'No matching order found for that order number and email.' });
    return;
  }

  res.json(mapOrderRow(row));
});

app.post('/api/quotes', (req, res) => {
  const body = req.body ?? {};
  const companyName = cleanText(body.companyName, 140);
  const contactPerson = cleanText(body.contactPerson, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = cleanText(body.phone, 30);
  const businessType = cleanText(body.businessType, 100);
  const deliveryLocation = cleanText(body.deliveryLocation, 140);
  const productsRequired = cleanText(body.productsRequired, 400);
  const estimatedQuantity = cleanText(body.estimatedQuantity, 120);
  const supplyFrequency = cleanText(body.supplyFrequency, 80) || 'One-Time Bulk Order';
  const notes = cleanText(body.notes, 800);

  if (
    !companyName ||
    !contactPerson ||
    !isValidEmail(email) ||
    !isValidUaePhone(phone) ||
    !businessType ||
    !deliveryLocation ||
    !productsRequired ||
    !estimatedQuantity
  ) {
    res.status(400).json({ error: 'Please complete all required B2B quotation fields with a valid UAE phone and email.' });
    return;
  }

  const referenceNumber = `HYG-Q-${crypto.randomInt(2050, 9999)}`;
  const info = db
    .prepare(
      `INSERT INTO b2b_quotes (
        reference_number, company_name, contact_person, email, phone,
        business_type, delivery_location, products_required,
        estimated_quantity, supply_frequency, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      referenceNumber,
      companyName,
      contactPerson,
      email,
      phone,
      businessType,
      deliveryLocation,
      productsRequired,
      estimatedQuantity,
      supplyFrequency,
      notes
    );

  res.status(201).json({
    id: Number(info.lastInsertRowid),
    referenceNumber,
  });
});

app.post('/api/newsletter', (req, res) => {
  const email = cleanText(req.body?.email, 160).toLowerCase();
  if (!isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email) VALUES (?)').run(email);
  res.status(201).json({ subscribed: true, email });
});

app.post('/api/contact', (req, res) => {
  const body = req.body ?? {};
  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  const phone = cleanText(body.phone, 30);
  const subject = cleanText(body.subject, 160);
  const message = cleanText(body.message, 1500);

  if (!name || !isValidEmail(email) || !subject || !message) {
    res.status(400).json({ error: 'Name, valid email, subject, and message are required.' });
    return;
  }
  if (phone && !isValidUaePhone(phone)) {
    res.status(400).json({ error: 'Please enter a valid UAE phone number or leave phone blank.' });
    return;
  }

  db.prepare('INSERT INTO contact_messages (name, email, phone, subject, message) VALUES (?, ?, ?, ?, ?)').run(
    name,
    email,
    phone,
    subject,
    message
  );

  res.status(201).json({ received: true });
});

// ============================================================================
// CUSTOMER AUTHENTICATION & ACCOUNT API
// ============================================================================

function formatCustomerRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone),
    companyName: String(row.company_name || ''),
    trn: String(row.trn || ''),
    customerType: String(row.customer_type) as 'business' | 'individual',
    emirate: String(row.emirate),
    city: String(row.city),
    address: String(row.address),
    createdAt: String(row.created_at),
  };
}

app.post('/api/auth/register', (req, res) => {
  const body = req.body ?? {};
  const name = cleanText(body.name, 120);
  const email = cleanText(body.email, 160).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';
  const phone = cleanText(body.phone, 30);
  const customerType = body.customerType === 'individual' ? 'individual' : 'business';
  const companyName = cleanText(body.companyName, 140);
  const trn = cleanText(body.trn, 20);
  const emirate = cleanText(body.emirate, 40) || 'Dubai';
  const city = cleanText(body.city, 80) || 'Business Bay';
  const address = cleanText(body.address, 260);

  if (!name || !isValidEmail(email)) {
    res.status(400).json({ error: 'Valid name and email are required.' });
    return;
  }
  if (password.length < 8 || password.length > 128) {
    res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
    return;
  }
  if (!isValidUaePhone(phone)) {
    res.status(400).json({ error: 'Enter a valid UAE phone number (e.g., +971 50 123 4567).' });
    return;
  }
  if (!isValidUaeTrn(trn)) {
    res.status(400).json({ error: 'UAE TRN must be 15 digits when provided.' });
    return;
  }
  if (!isValidEmirate(emirate)) {
    res.status(400).json({ error: 'Select a valid UAE Emirate.' });
    return;
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const passwordHash = hashPassword(password);
  const info = db
    .prepare(
      `INSERT INTO users (name, email, phone, company_name, trn, customer_type, emirate, city, address, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(name, email, phone, companyName, trn, customerType, emirate, city, address, passwordHash);

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(info.lastInsertRowid)) as Record<
    string,
    unknown
  >;
  const user = formatCustomerRow(userRow);
  const token = signToken({ sub: String(user.id), role: 'customer', email: user.email, name: user.name });

  res.status(201).json({ token, user });
});

app.post('/api/auth/login', (req, res) => {
  const email = cleanText(req.body?.email, 160).toLowerCase();
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!isValidEmail(email) || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  const userRow = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as
    | Record<string, unknown>
    | undefined;
  if (!userRow || !verifyPassword(password, String(userRow.password_hash))) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const user = formatCustomerRow(userRow);
  const token = signToken({ sub: String(user.id), role: 'customer', email: user.email, name: user.name });
  res.json({ token, user });
});

app.get('/api/auth/me', requireCustomerAuth, (req: AuthenticatedRequest, res) => {
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(req.auth?.sub)) as
    | Record<string, unknown>
    | undefined;
  if (!userRow) {
    res.status(404).json({ error: 'User not found.' });
    return;
  }
  res.json({ user: formatCustomerRow(userRow) });
});

app.patch('/api/auth/profile', requireCustomerAuth, (req: AuthenticatedRequest, res) => {
  const userId = Number(req.auth?.sub);
  const body = req.body ?? {};
  const name = cleanText(body.name, 120);
  const phone = cleanText(body.phone, 30);
  const companyName = cleanText(body.companyName, 140);
  const trn = cleanText(body.trn, 20);
  const customerType = body.customerType === 'individual' ? 'individual' : 'business';
  const emirate = cleanText(body.emirate, 40);
  const city = cleanText(body.city, 80);
  const address = cleanText(body.address, 260);

  if (!name || !isValidUaePhone(phone) || !isValidEmirate(emirate) || !isValidUaeTrn(trn)) {
    res.status(400).json({ error: 'Please provide valid name, UAE phone, Emirate, and optional 15-digit TRN.' });
    return;
  }

  db.prepare(
    `UPDATE users SET name = ?, phone = ?, company_name = ?, trn = ?, customer_type = ?, emirate = ?, city = ?, address = ?
     WHERE id = ?`
  ).run(name, phone, companyName, trn, customerType, emirate, city, address, userId);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as Record<string, unknown>;
  res.json({ user: formatCustomerRow(updated) });
});

app.get('/api/orders/mine', requireCustomerAuth, (req: AuthenticatedRequest, res) => {
  const userId = Number(req.auth?.sub);
  const email = String(req.auth?.email || '').toLowerCase();
  const rows = db
    .prepare('SELECT * FROM orders WHERE user_id = ? OR LOWER(customer_email) = ? ORDER BY created_at DESC, id DESC')
    .all(userId, email) as Array<Record<string, unknown>>;
  res.json(rows.map(mapOrderRow));
});

// ============================================================================
// ADMIN AUTHENTICATION & PROTECTED DASHBOARD API
// ============================================================================

app.get('/api/admin/status', (_req, res) => {
  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  const settings = getSettingsRow();
  const hasStoredHash = Boolean(settings.admin_password_hash);
  res.json({
    envConfigured: Boolean(envPasscode),
    needsBootstrap: !envPasscode && !hasStoredHash,
  });
});

app.post('/api/admin/bootstrap', (req, res) => {
  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  if (envPasscode) {
    res.status(409).json({ error: 'Administrator password is already configured.' });
    return;
  }
  const settings = getSettingsRow();
  if (settings.admin_password_hash) {
    res.status(409).json({ error: 'Admin password has already been claimed.' });
    return;
  }
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (password.length < 8 || password.length > 128) {
    res.status(400).json({ error: 'Admin password must be between 8 and 128 characters.' });
    return;
  }
  const hashed = hashPassword(password);
  const update = db
    .prepare('UPDATE store_settings SET admin_password_hash = ? WHERE id = 1 AND admin_password_hash IS NULL')
    .run(hashed);

  if (update.changes === 0) {
    res.status(409).json({ error: 'Admin password has already been claimed.' });
    return;
  }

  const token = signToken({ sub: 'admin', role: 'admin', name: 'HYGIENOVO Admin' });
  res.status(201).json({ token });
});

app.post('/api/admin/login', (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!password) {
    res.status(400).json({ error: 'Admin passcode is required.' });
    return;
  }

  const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
  if (envPasscode) {
    if (!timingSafeCompareStrings(password, envPasscode)) {
      res.status(401).json({ error: 'Invalid admin passcode.' });
      return;
    }
    const token = signToken({ sub: 'admin', role: 'admin', name: 'HYGIENOVO Admin' });
    res.json({ token });
    return;
  }

  const settings = getSettingsRow();
  if (!settings.admin_password_hash) {
    res.status(400).json({ error: 'Admin password has not been configured yet.' });
    return;
  }

  if (!verifyPassword(password, String(settings.admin_password_hash))) {
    res.status(401).json({ error: 'Invalid admin password.' });
    return;
  }

  const token = signToken({ sub: 'admin', role: 'admin', name: 'HYGIENOVO Admin' });
  res.json({ token });
});

app.get('/api/admin/analytics', requireAdminAuth, (_req, res) => {
  const orderRows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all() as Array<
    Record<string, unknown>
  >;
  const orders = orderRows.map(mapOrderRow);
  const activeOrders = orders.filter((o) => o.orderStatus !== 'cancelled');
  const totalRevenueAed = roundMoney(activeOrders.reduce((sum, o) => sum + o.totalAed, 0));
  const totalOrders = orders.length;
  const averageOrderValueAed = activeOrders.length > 0 ? roundMoney(totalRevenueAed / activeOrders.length) : 0;

  const custCount = (db.prepare('SELECT COUNT(*) AS cnt FROM users').get() as { cnt: number }).cnt;
  const pendingQuotes = (
    db.prepare("SELECT COUNT(*) AS cnt FROM b2b_quotes WHERE status IN ('new', 'reviewing')").get() as { cnt: number }
  ).cnt;
  const lowStockProducts = (
    db.prepare('SELECT COUNT(*) AS cnt FROM products WHERE stock_qty <= 25').get() as { cnt: number }
  ).cnt;

  const prodRows = db.prepare('SELECT id, category_name FROM products').all() as Array<{
    id: number;
    category_name: string;
  }>;
  const prodCatMap = new Map<number, string>();
  for (const p of prodRows) {
    prodCatMap.set(Number(p.id), String(p.category_name));
  }

  const catTotals = new Map<string, { revenueAed: number; unitsSold: number }>();
  for (const order of activeOrders) {
    for (const item of order.items) {
      const catName = prodCatMap.get(item.productId) || 'Commercial Supplies';
      const existing = catTotals.get(catName) || { revenueAed: 0, unitsSold: 0 };
      existing.revenueAed = roundMoney(existing.revenueAed + item.lineTotalAed);
      existing.unitsSold += item.qty;
      catTotals.set(catName, existing);
    }
  }

  const statusTotals = new Map<string, number>();
  for (const order of orders) {
    statusTotals.set(order.orderStatus, (statusTotals.get(order.orderStatus) || 0) + 1);
  }

  res.json({
    totalRevenueAed,
    totalOrders,
    averageOrderValueAed,
    totalCustomers: custCount,
    pendingQuotes,
    lowStockProducts,
    revenueByCategory: Array.from(catTotals.entries()).map(([categoryName, v]) => ({
      categoryName,
      revenueAed: v.revenueAed,
      unitsSold: v.unitsSold,
    })),
    ordersByStatus: Array.from(statusTotals.entries()).map(([status, count]) => ({ status, count })),
    recentOrders: orders.slice(0, 6),
  });
});

app.post('/api/admin/upload', requireAdminAuth, (req, res) => {
  const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);

  if (!match) {
    res.status(400).json({ error: 'Only PNG, JPEG, or WEBP image uploads are supported.' });
    return;
  }

  const mime = match[1];
  const base64 = match[2];
  const buffer = Buffer.from(base64, 'base64');

  if (buffer.byteLength === 0 || buffer.byteLength > 3 * 1024 * 1024) {
    res.status(400).json({ error: 'Image size must be under 3 MB.' });
    return;
  }

  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const safeName = `${crypto.randomUUID()}.${ext}`;
  const targetPath = path.resolve(UPLOADS_DIR, safeName);

  if (!targetPath.startsWith(UPLOADS_DIR + path.sep)) {
    res.status(400).json({ error: 'Invalid upload path.' });
    return;
  }

  fs.writeFileSync(targetPath, buffer);
  res.status(201).json({ url: `/uploads/${safeName}` });
});

app.get('/api/admin/products', requireAdminAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY id DESC').all() as Array<Record<string, unknown>>;
  res.json(rows.map(mapProductRow));
});

app.post('/api/admin/products', requireAdminAuth, (req, res) => {
  const body = req.body ?? {};
  const name = cleanText(body.name, 160);
  const sku = cleanText(body.sku, 40).toUpperCase();
  const categorySlug = cleanText(body.categorySlug, 60);
  const brand = cleanText(body.brand, 80) || 'HYGIENOVO Pro';
  const packSize = cleanText(body.packSize, 80);
  const priceAed = Number(body.priceAed);
  const stockQty = Math.floor(Number(body.stockQty ?? 0));
  const featured = body.featured ? 1 : 0;
  const description = cleanText(body.description, 2000);
  const image = cleanText(body.image, 600);
  const applications = cleanText(body.applications, 1000);
  const usageSafety = cleanText(body.usageSafety, 1000);
  const packagingDetails = cleanText(body.packagingDetails, 1000);

  if (!name || !sku || !categorySlug || !packSize || !Number.isFinite(priceAed) || priceAed <= 0 || stockQty < 0) {
    res.status(400).json({ error: 'Valid name, SKU, category, pack size, price, and stock quantity are required.' });
    return;
  }
  if (!isSafeImageUrl(image)) {
    res.status(400).json({ error: 'Valid product image URL or uploaded image path is required.' });
    return;
  }

  const catRow = db.prepare('SELECT name FROM categories WHERE slug = ?').get(categorySlug) as
    | { name: string }
    | undefined;
  if (!catRow) {
    res.status(400).json({ error: 'Selected category does not exist.' });
    return;
  }

  const slug = `${slugify(name)}-${crypto.randomInt(100, 999)}`;
  const specs = Array.isArray(body.specifications) ? body.specifications : [];
  const variations = Array.isArray(body.variations) && body.variations.length > 0
    ? body.variations
    : [{ id: 'default', label: packSize, skuSuffix: '1PK', priceAed, stockQty }];

  try {
    const info = db
      .prepare(
        `INSERT INTO products (
          sku, slug, name, category_slug, category_name, brand, pack_size,
          price_aed, stock_qty, featured, description, specifications_json,
          applications, usage_safety, packaging_details, image, gallery_json, variations_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        sku,
        slug,
        name,
        categorySlug,
        catRow.name,
        brand,
        packSize,
        roundMoney(priceAed),
        stockQty,
        featured,
        description,
        JSON.stringify(specs),
        applications,
        usageSafety,
        packagingDetails,
        image,
        JSON.stringify([image]),
        JSON.stringify(variations)
      );

    const created = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(info.lastInsertRowid)) as Record<
      string,
      unknown
    >;
    res.status(201).json(mapProductRow(created));
  } catch (err) {
    const message = err instanceof Error && messageIncludesUnique(err.message)
      ? 'A product with that SKU already exists.'
      : 'Unable to create product.';
    res.status(400).json({ error: message });
  }
});

function messageIncludesUnique(msg: string): boolean {
  return msg.toLowerCase().includes('unique');
}

app.put('/api/admin/products/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }

  const body = req.body ?? {};
  const name = cleanText(body.name ?? existing.name, 160);
  const sku = cleanText(body.sku ?? existing.sku, 40).toUpperCase();
  const categorySlug = cleanText(body.categorySlug ?? existing.category_slug, 60);
  const brand = cleanText(body.brand ?? existing.brand, 80);
  const packSize = cleanText(body.packSize ?? existing.pack_size, 80);
  const priceAed = Number(body.priceAed ?? existing.price_aed);
  const stockQty = Math.floor(Number(body.stockQty ?? existing.stock_qty));
  const featured = body.featured !== undefined ? (body.featured ? 1 : 0) : Number(existing.featured);
  const description = cleanText(body.description ?? existing.description, 2000);
  const image = cleanText(body.image ?? existing.image, 600);
  const applications = cleanText(body.applications ?? existing.applications, 1000);
  const usageSafety = cleanText(body.usageSafety ?? existing.usage_safety, 1000);
  const packagingDetails = cleanText(body.packagingDetails ?? existing.packaging_details, 1000);

  if (!name || !sku || !packSize || !Number.isFinite(priceAed) || priceAed <= 0 || stockQty < 0) {
    res.status(400).json({ error: 'Invalid product fields.' });
    return;
  }
  if (!isSafeImageUrl(image)) {
    res.status(400).json({ error: 'Invalid product image URL.' });
    return;
  }

  const catRow = db.prepare('SELECT name FROM categories WHERE slug = ?').get(categorySlug) as
    | { name: string }
    | undefined;
  if (!catRow) {
    res.status(400).json({ error: 'Invalid category.' });
    return;
  }

  const specs = Array.isArray(body.specifications)
    ? JSON.stringify(body.specifications)
    : String(existing.specifications_json);
  const variations = Array.isArray(body.variations)
    ? JSON.stringify(body.variations)
    : String(existing.variations_json);
  const gallery = Array.isArray(body.gallery)
    ? JSON.stringify(body.gallery)
    : JSON.stringify([image]);

  db.prepare(
    `UPDATE products SET
      sku = ?, name = ?, category_slug = ?, category_name = ?, brand = ?,
      pack_size = ?, price_aed = ?, stock_qty = ?, featured = ?, description = ?,
      specifications_json = ?, applications = ?, usage_safety = ?,
      packaging_details = ?, image = ?, gallery_json = ?, variations_json = ?
     WHERE id = ?`
  ).run(
    sku,
    name,
    categorySlug,
    catRow.name,
    brand,
    packSize,
    roundMoney(priceAed),
    stockQty,
    featured,
    description,
    specs,
    applications,
    usageSafety,
    packagingDetails,
    image,
    gallery,
    variations,
    id
  );

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Record<string, unknown>;
  res.json(mapProductRow(updated));
});

app.delete('/api/admin/products/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM products WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Product not found.' });
    return;
  }
  res.json({ deleted: true });
});

app.post('/api/admin/categories', requireAdminAuth, (req, res) => {
  const name = cleanText(req.body?.name, 80);
  const description = cleanText(req.body?.description, 300);
  const image = cleanText(req.body?.image, 600);
  const displayOrder = Math.floor(Number(req.body?.displayOrder ?? 10));
  const slug = slugify(cleanText(req.body?.slug, 60) || name);

  if (!name || !slug || !description || !isSafeImageUrl(image)) {
    res.status(400).json({ error: 'Valid category name, description, and image are required.' });
    return;
  }

  try {
    const info = db
      .prepare('INSERT INTO categories (slug, name, description, image, display_order) VALUES (?, ?, ?, ?, ?)')
      .run(slug, name, description, image, displayOrder);
    res.status(201).json({
      id: Number(info.lastInsertRowid),
      slug,
      name,
      description,
      image,
      displayOrder,
    });
  } catch {
    res.status(400).json({ error: 'Category slug already exists.' });
  }
});

app.put('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  const name = cleanText(req.body?.name ?? existing.name, 80);
  const description = cleanText(req.body?.description ?? existing.description, 300);
  const image = cleanText(req.body?.image ?? existing.image, 600);
  const displayOrder = Math.floor(Number(req.body?.displayOrder ?? existing.display_order));

  if (!name || !description || !isSafeImageUrl(image)) {
    res.status(400).json({ error: 'Invalid category fields.' });
    return;
  }

  db.prepare('UPDATE categories SET name = ?, description = ?, image = ?, display_order = ? WHERE id = ?').run(
    name,
    description,
    image,
    displayOrder,
    id
  );
  db.prepare('UPDATE products SET category_name = ? WHERE category_slug = ?').run(name, String(existing.slug));

  res.json({
    id,
    slug: String(existing.slug),
    name,
    description,
    image,
    displayOrder,
  });
});

app.delete('/api/admin/categories/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT slug FROM categories WHERE id = ?').get(id) as { slug: string } | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Category not found.' });
    return;
  }
  const inUse = (
    db.prepare('SELECT COUNT(*) AS cnt FROM products WHERE category_slug = ?').get(existing.slug) as { cnt: number }
  ).cnt;
  if (inUse > 0) {
    res.status(400).json({ error: `Cannot delete category with ${inUse} assigned products.` });
    return;
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ deleted: true });
});

app.get('/api/admin/orders', requireAdminAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC, id DESC').all() as Array<
    Record<string, unknown>
  >;
  res.json(rows.map(mapOrderRow));
});

app.patch('/api/admin/orders/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const orderStatus = cleanText(req.body?.orderStatus, 40);
  const paymentStatus = cleanText(req.body?.paymentStatus, 40);

  const allowedOrderStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
  const allowedPaymentStatuses = [
    'cod_pending',
    'awaiting_bank_transfer',
    'awaiting_gateway_payment',
    'paid',
    'refunded',
  ];

  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Order not found.' });
    return;
  }

  const nextOrderStatus = orderStatus || String(existing.order_status);
  const nextPaymentStatus = paymentStatus || String(existing.payment_status);

  if (!allowedOrderStatuses.includes(nextOrderStatus) || !allowedPaymentStatuses.includes(nextPaymentStatus)) {
    res.status(400).json({ error: 'Invalid order or payment status.' });
    return;
  }

  db.prepare(
    "UPDATE orders SET order_status = ?, payment_status = ?, updated_at = datetime('now') WHERE id = ?"
  ).run(nextOrderStatus, nextPaymentStatus, id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(id) as Record<string, unknown>;
  res.json(mapOrderRow(updated));
});

app.get('/api/admin/customers', requireAdminAuth, (_req, res) => {
  const rows = db
    .prepare(
      `SELECT u.*,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id OR LOWER(o.customer_email) = LOWER(u.email)) AS order_count,
        (SELECT COALESCE(SUM(o.total_aed), 0) FROM orders o WHERE (o.user_id = u.id OR LOWER(o.customer_email) = LOWER(u.email)) AND o.order_status != 'cancelled') AS total_spent_aed
       FROM users u ORDER BY u.created_at DESC, u.id DESC`
    )
    .all() as Array<Record<string, unknown>>;

  res.json(
    rows.map((r) => ({
      ...formatCustomerRow(r),
      orderCount: Number(r.order_count || 0),
      totalSpentAed: roundMoney(Number(r.total_spent_aed || 0)),
    }))
  );
});

app.get('/api/admin/quotes', requireAdminAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM b2b_quotes ORDER BY created_at DESC, id DESC').all() as Array<
    Record<string, unknown>
  >;
  res.json(
    rows.map((r) => ({
      id: Number(r.id),
      referenceNumber: String(r.reference_number),
      companyName: String(r.company_name),
      contactPerson: String(r.contact_person),
      email: String(r.email),
      phone: String(r.phone),
      businessType: String(r.business_type),
      deliveryLocation: String(r.delivery_location),
      productsRequired: String(r.products_required),
      estimatedQuantity: String(r.estimated_quantity),
      supplyFrequency: String(r.supply_frequency),
      notes: String(r.notes || ''),
      status: String(r.status),
      createdAt: String(r.created_at),
    }))
  );
});

app.patch('/api/admin/quotes/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const status = cleanText(req.body?.status, 30);
  if (!['new', 'reviewing', 'quoted', 'approved', 'closed'].includes(status)) {
    res.status(400).json({ error: 'Invalid quote status.' });
    return;
  }
  const info = db.prepare('UPDATE b2b_quotes SET status = ? WHERE id = ?').run(status, id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Quote not found.' });
    return;
  }
  res.json({ id, status });
});

app.get('/api/admin/discounts', requireAdminAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM discount_codes ORDER BY id DESC').all() as Array<Record<string, unknown>>;
  res.json(
    rows.map((r) => ({
      id: Number(r.id),
      code: String(r.code),
      type: String(r.type),
      value: Number(r.value),
      minOrderAed: Number(r.min_order_aed),
      active: Boolean(r.active),
      usageCount: Number(r.usage_count),
      expiresAt: r.expires_at ? String(r.expires_at) : null,
    }))
  );
});

app.post('/api/admin/discounts', requireAdminAuth, (req, res) => {
  const code = cleanText(req.body?.code, 40).toUpperCase();
  const type = req.body?.type === 'fixed' ? 'fixed' : 'percent';
  const value = Number(req.body?.value);
  const minOrderAed = Number(req.body?.minOrderAed ?? 0);
  const active = req.body?.active !== false ? 1 : 0;
  const expiresAt = req.body?.expiresAt ? cleanText(req.body.expiresAt, 40) : null;

  if (!code || !/^[A-Z0-9_-]{3,30}$/.test(code) || !Number.isFinite(value) || value <= 0) {
    res.status(400).json({ error: 'Valid alphanumeric discount code and positive value are required.' });
    return;
  }
  if (type === 'percent' && value > 90) {
    res.status(400).json({ error: 'Percentage discount cannot exceed 90%.' });
    return;
  }

  try {
    const info = db
      .prepare(
        'INSERT INTO discount_codes (code, type, value, min_order_aed, active, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(code, type, roundMoney(value), roundMoney(Math.max(0, minOrderAed)), active, expiresAt);

    res.status(201).json({
      id: Number(info.lastInsertRowid),
      code,
      type,
      value: roundMoney(value),
      minOrderAed: roundMoney(Math.max(0, minOrderAed)),
      active: Boolean(active),
      usageCount: 0,
      expiresAt,
    });
  } catch {
    res.status(400).json({ error: 'Discount code already exists.' });
  }
});

app.put('/api/admin/discounts/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM discount_codes WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined;
  if (!existing) {
    res.status(404).json({ error: 'Discount code not found.' });
    return;
  }
  const active = req.body?.active !== undefined ? (req.body.active ? 1 : 0) : Number(existing.active);
  const value = req.body?.value !== undefined ? Number(req.body.value) : Number(existing.value);
  const minOrderAed = req.body?.minOrderAed !== undefined ? Number(req.body.minOrderAed) : Number(existing.min_order_aed);

  db.prepare('UPDATE discount_codes SET active = ?, value = ?, min_order_aed = ? WHERE id = ?').run(
    active,
    roundMoney(value),
    roundMoney(Math.max(0, minOrderAed)),
    id
  );
  res.json({ id, active: Boolean(active), value: roundMoney(value), minOrderAed: roundMoney(minOrderAed) });
});

app.delete('/api/admin/discounts/:id', requireAdminAuth, (req, res) => {
  const id = Number(req.params.id);
  const info = db.prepare('DELETE FROM discount_codes WHERE id = ?').run(id);
  if (info.changes === 0) {
    res.status(404).json({ error: 'Discount code not found.' });
    return;
  }
  res.json({ deleted: true });
});

app.put('/api/admin/settings', requireAdminAuth, (req, res) => {
  const body = req.body ?? {};
  const vatRate = Number(body.vatRate);
  const dubaiDeliveryFee = Number(body.dubaiDeliveryFee);
  const otherEmiratesDeliveryFee = Number(body.otherEmiratesDeliveryFee);
  const freeDeliveryThreshold = Number(body.freeDeliveryThreshold);
  const codEnabled = body.codEnabled ? 1 : 0;
  const bankTransferEnabled = body.bankTransferEnabled ? 1 : 0;
  const uaeGatewayEnabled = body.uaeGatewayEnabled ? 1 : 0;
  const whatsappNumber = cleanText(body.whatsappNumber, 25).replace(/[^\d]/g, '') || '97140000000';

  if (
    !Number.isFinite(vatRate) ||
    vatRate < 0 ||
    vatRate > 0.25 ||
    !Number.isFinite(dubaiDeliveryFee) ||
    dubaiDeliveryFee < 0 ||
    !Number.isFinite(otherEmiratesDeliveryFee) ||
    otherEmiratesDeliveryFee < 0 ||
    !Number.isFinite(freeDeliveryThreshold) ||
    freeDeliveryThreshold < 0
  ) {
    res.status(400).json({ error: 'Invalid store tax or delivery fee configuration.' });
    return;
  }

  db.prepare(
    `UPDATE store_settings SET
      vat_rate = ?, dubai_delivery_fee = ?, other_emirates_delivery_fee = ?,
      free_delivery_threshold = ?, cod_enabled = ?, bank_transfer_enabled = ?,
      uae_gateway_enabled = ?, whatsapp_number = ?
     WHERE id = 1`
  ).run(
    vatRate,
    roundMoney(dubaiDeliveryFee),
    roundMoney(otherEmiratesDeliveryFee),
    roundMoney(freeDeliveryThreshold),
    codEnabled,
    bankTransferEnabled,
    uaeGatewayEnabled,
    whatsappNumber
  );

  res.json(formatStoreConfig());
});

// ============================================================================
// VITE DEV / PRODUCTION STATIC HOSTING
// ============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HYGIENOVO server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
