import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DATA_DIR = process.env.DATA_DIR ? path.resolve(process.env.DATA_DIR) : path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'hygienovo.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

const STITCH_IMAGES = {
  heroOffice: '/src/assets/images/hero_office_hygiene_1795433518175.jpg',
  heroWorkspace: '/src/assets/images/b2b_tower_supply_1795433518111.jpg',
  chemicals: '/src/assets/images/multipurpose_cleaner_5l_1795433518786.jpg',
  chemicalsAlt: '/src/assets/images/toilet_descaler_5l_1795433517987.jpg',
  floorCleaner: '/src/assets/images/floor_cleaner_5l_1795433517351.jpg',
  floorCleanerDetail: '/src/assets/images/floor_cleaner_5l_1795433517351.jpg',
  equipment: '/src/assets/images/janitorial_trolley_cart_1795433518991.jpg',
  mopSet: '/src/assets/images/cleaning_equipment_mop_1795433517897.jpg',
  washroom: '/src/assets/images/liquid_hand_wash_1795433517381.jpg',
  paper: '/src/assets/images/interfold_hand_towels_1795433518941.jpg',
  paperAlt: '/src/assets/images/paper_products_bulk_1795433518681.jpg',
  janitorial: '/src/assets/images/microfiber_garbage_bags_1795433541622.jpg',
  microfiber: '/src/assets/images/microfiber_garbage_bags_1795433541622.jpg',
  safety: '/src/assets/images/safety_gloves_signage_1795433608158.jpg',
  gloves: '/src/assets/images/safety_gloves_signage_1795433608158.jpg',
};

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      image TEXT NOT NULL,
      display_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      category_slug TEXT NOT NULL,
      category_name TEXT NOT NULL,
      brand TEXT NOT NULL DEFAULT 'HYGIENOVO Pro',
      pack_size TEXT NOT NULL,
      price_aed REAL NOT NULL,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      featured INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL,
      specifications_json TEXT NOT NULL DEFAULT '[]',
      applications TEXT NOT NULL DEFAULT '',
      usage_safety TEXT NOT NULL DEFAULT '',
      packaging_details TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL,
      gallery_json TEXT NOT NULL DEFAULT '[]',
      variations_json TEXT NOT NULL DEFAULT '[]',
      popularity INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT NOT NULL,
      company_name TEXT NOT NULL DEFAULT '',
      trn TEXT NOT NULL DEFAULT '',
      customer_type TEXT NOT NULL DEFAULT 'business',
      emirate TEXT NOT NULL DEFAULT 'Dubai',
      city TEXT NOT NULL DEFAULT 'Business Bay',
      address TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT NOT NULL UNIQUE,
      user_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      company_name TEXT NOT NULL DEFAULT '',
      trn TEXT NOT NULL DEFAULT '',
      emirate TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      delivery_window TEXT NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      order_status TEXT NOT NULL DEFAULT 'pending',
      discount_code TEXT,
      discount_amount_aed REAL NOT NULL DEFAULT 0,
      subtotal_aed REAL NOT NULL,
      delivery_fee_aed REAL NOT NULL,
      vat_amount_aed REAL NOT NULL,
      total_aed REAL NOT NULL,
      items_json TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS b2b_quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_number TEXT NOT NULL UNIQUE,
      company_name TEXT NOT NULL,
      contact_person TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      business_type TEXT NOT NULL,
      delivery_location TEXT NOT NULL,
      products_required TEXT NOT NULL,
      estimated_quantity TEXT NOT NULL,
      supply_frequency TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discount_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK(type IN ('percent', 'fixed')),
      value REAL NOT NULL,
      min_order_aed REAL NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      usage_count INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS store_settings (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      vat_rate REAL NOT NULL DEFAULT 0.05,
      dubai_delivery_fee REAL NOT NULL DEFAULT 25,
      other_emirates_delivery_fee REAL NOT NULL DEFAULT 45,
      free_delivery_threshold REAL NOT NULL DEFAULT 500,
      cod_enabled INTEGER NOT NULL DEFAULT 1,
      bank_transfer_enabled INTEGER NOT NULL DEFAULT 1,
      uae_gateway_enabled INTEGER NOT NULL DEFAULT 1,
      whatsapp_number TEXT NOT NULL DEFAULT '97140000000',
      admin_password_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const settingsCount = db.prepare('SELECT COUNT(*) AS cnt FROM store_settings').get() as { cnt: number };
  if (settingsCount.cnt === 0) {
    db.prepare(`
      INSERT INTO store_settings (
        id, vat_rate, dubai_delivery_fee, other_emirates_delivery_fee,
        free_delivery_threshold, cod_enabled, bank_transfer_enabled,
        uae_gateway_enabled, whatsapp_number
      ) VALUES (1, 0.05, 25, 45, 500, 1, 1, 1, '97140000000')
    `).run();
  }

  const catCount = db.prepare('SELECT COUNT(*) AS cnt FROM categories').get() as { cnt: number };
  if (catCount.cnt === 0) {
    const insertCat = db.prepare(
      'INSERT INTO categories (slug, name, description, image, display_order) VALUES (?, ?, ?, ?, ?)'
    );
    const seedCategories = [
      [
        'chemicals',
        'Cleaning Chemicals',
        'Concentrated floor, surface, glass, and washroom formulas in 5L packs.',
        STITCH_IMAGES.chemicals,
        1,
      ],
      [
        'equipment',
        'Cleaning Equipment',
        'Heavy-duty mop systems, wringer buckets, trolleys, and floor care tools.',
        STITCH_IMAGES.equipment,
        2,
      ],
      [
        'washroom',
        'Washroom Hygiene',
        'Hand wash refills, touchless dispensers, and commercial odor control.',
        STITCH_IMAGES.washroom,
        3,
      ],
      [
        'paper',
        'Paper Products',
        'Jumbo toilet rolls, C-fold hand towels, and facial tissues in bulk cases.',
        STITCH_IMAGES.paper,
        4,
      ],
      [
        'janitorial',
        'Janitorial Supplies',
        'Heavy-duty garbage bags, color-coded microfiber cloths, and caddies.',
        STITCH_IMAGES.janitorial,
        5,
      ],
      [
        'safety',
        'Safety & Protection',
        'Industrial cleaning gloves, protective eyewear, and caution signage.',
        STITCH_IMAGES.safety,
        6,
      ],
    ] as const;

    for (const c of seedCategories) {
      insertCat.run(c[0], c[1], c[2], c[3], c[4]);
    }
  }

  const prodCount = db.prepare('SELECT COUNT(*) AS cnt FROM products').get() as { cnt: number };
  if (prodCount.cnt === 0) {
    const insertProd = db.prepare(`
      INSERT INTO products (
        sku, slug, name, category_slug, category_name, brand, pack_size,
        price_aed, stock_qty, featured, description, specifications_json,
        applications, usage_safety, packaging_details, image, gallery_json,
        variations_json, popularity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seedProducts = [
      {
        sku: 'HYG-CHM-501',
        slug: 'commercial-floor-cleaner-5l',
        name: 'Commercial Floor Cleaner – 5L',
        categorySlug: 'chemicals',
        categoryName: 'Cleaning Chemicals',
        brand: 'HYGIENOVO Pro',
        packSize: '5L Jerrycan',
        priceAed: 68.0,
        stockQty: 140,
        featured: 1,
        description:
          'Low-foam, streak-free commercial floor cleaning solution formulated for daily maintenance across tiled, marble, vinyl, and sealed concrete floors in high-traffic business premises.',
        specs: [
          { label: 'Product Format', value: 'Liquid Concentrate (5L)' },
          { label: 'Container Material', value: 'Recyclable HDPE Jerrycan' },
          { label: 'Surface Compatibility', value: 'Tile, Vinyl, Sealed Stone' },
          { label: 'Dilution Ratio', value: '1:50 Daily / 1:20 Heavy Soil' },
        ],
        applications:
          'Recommended for daily lobby, corridor, washroom, and back-of-house floor care in office buildings, hotels, schools, and commercial facilities across Dubai and the UAE.',
        usageSafety:
          'Always follow label dilution instructions and wear standard protective gloves during handling. Commercial Safety Data Sheets (SDS) are provided on order confirmation.',
        packagingDetails:
          'Supplied in tamper-evident 5L HDPE jerrycans, individually or in 4 × 5L corrugated commercial cases for palletized UAE delivery.',
        image: STITCH_IMAGES.floorCleaner,
        gallery: [STITCH_IMAGES.floorCleanerDetail, STITCH_IMAGES.chemicalsAlt, STITCH_IMAGES.heroWorkspace],
        variations: [
          { id: '5l-single', label: '5L Jerrycan', skuSuffix: '1PK', priceAed: 68.0, stockQty: 140 },
          { id: '5l-case4', label: 'Case of 4 × 5L (Save 7%)', skuSuffix: '4PK', priceAed: 252.0, stockQty: 45 },
        ],
        popularity: 98,
      },
      {
        sku: 'HYG-CHM-502',
        slug: 'multipurpose-cleaner-5l',
        name: 'Multipurpose Cleaner – 5L',
        categorySlug: 'chemicals',
        categoryName: 'Cleaning Chemicals',
        brand: 'HYGIENOVO Pro',
        packSize: '5L Jerrycan',
        priceAed: 54.0,
        stockQty: 120,
        featured: 1,
        description:
          'Neutral pH all-purpose spray and wipe concentrate engineered for desks, countertops, painted walls, chrome fixtures, and pantry surfaces without leaving residue.',
        specs: [
          { label: 'Product Format', value: 'Neutral Concentrate (5L)' },
          { label: 'pH Range', value: '7.0 – 7.8 (Neutral)' },
          { label: 'Scent Profile', value: 'Fresh Clean Botanical' },
          { label: 'Container Material', value: 'Tamper-Evident HDPE' },
        ],
        applications:
          'Ideal for workstations, reception desks, elevator interiors, break rooms, and residential kitchens.',
        usageSafety:
          'Dilute into labeled trigger bottles before spraying. Avoid direct eye contact and keep sealed away from direct heat.',
        packagingDetails: 'Available as individual 5L jerrycans or 4 × 5L cartons.',
        image: STITCH_IMAGES.chemicals,
        gallery: [STITCH_IMAGES.chemicals, STITCH_IMAGES.chemicalsAlt],
        variations: [
          { id: '5l-single', label: '5L Jerrycan', skuSuffix: '1PK', priceAed: 54.0, stockQty: 120 },
          { id: '5l-case4', label: 'Case of 4 × 5L', skuSuffix: '4PK', priceAed: 199.0, stockQty: 38 },
        ],
        popularity: 92,
      },
      {
        sku: 'HYG-WSH-201',
        slug: 'liquid-hand-wash-5l',
        name: 'Liquid Hand Wash – 5L',
        categorySlug: 'washroom',
        categoryName: 'Washroom Hygiene',
        brand: 'HYGIENOVO Pro',
        packSize: '5L Refill',
        priceAed: 49.0,
        stockQty: 185,
        featured: 1,
        description:
          'Gentle moisturizing commercial liquid hand soap bulk refill designed for high-traffic office washrooms, clinics, hospitality venues, and residential buildings.',
        specs: [
          { label: 'Volume', value: '5 Litre Bulk Refill' },
          { label: 'Formulation', value: 'Skin-Balanced Pearlized Gel' },
          { label: 'Dispenser Fit', value: 'Standard Pump & Bulk-Fill Reservoirs' },
          { label: 'Fragrance', value: 'Mild Aloe & Citrus' },
        ],
        applications:
          'Refills wall-mounted commercial soap dispensers in offices, malls, restaurants, and apartment lobbies.',
        usageSafety: 'External skin cleansing use only. Store upright in a cool dry janitorial closet.',
        packagingDetails: '5L recyclable jerrycan with pour-spout compatibility.',
        image: STITCH_IMAGES.washroom,
        gallery: [STITCH_IMAGES.washroom],
        variations: [
          { id: '5l-single', label: '5L Refill', skuSuffix: '1PK', priceAed: 49.0, stockQty: 185 },
          { id: '5l-case4', label: 'Case of 4 × 5L', skuSuffix: '4PK', priceAed: 184.0, stockQty: 52 },
        ],
        popularity: 94,
      },
      {
        sku: 'HYG-JAN-301',
        slug: 'heavy-duty-garbage-bags-pack',
        name: 'Heavy Duty Garbage Bags – Pack',
        categorySlug: 'janitorial',
        categoryName: 'Janitorial Supplies',
        brand: 'CleanTech Commercial',
        packSize: 'Roll of 50 (80L)',
        priceAed: 38.0,
        stockQty: 260,
        featured: 1,
        description:
          'Puncture-resistant high-density commercial bin liners built for heavy facility waste, pantry bins, and janitorial trolley collection across busy UAE buildings.',
        specs: [
          { label: 'Capacity', value: '80 Litres (Heavy Duty)' },
          { label: 'Roll Count', value: '50 Bags per Roll' },
          { label: 'Thickness', value: '55 Micron Reinforced' },
          { label: 'Seal Type', value: 'Star-Sealed Leakproof Base' },
        ],
        applications: 'Commercial waste stations, pantries, washroom bins, and residential chutes.',
        usageSafety: 'Keep plastic bags away from children and high-temperature heat sources.',
        packagingDetails: 'Compact coreless roll of 50 bags; master cartons contain 10 rolls.',
        image: STITCH_IMAGES.janitorial,
        gallery: [STITCH_IMAGES.janitorial],
        variations: [
          { id: 'roll-50', label: 'Roll of 50 (80L)', skuSuffix: 'R50', priceAed: 38.0, stockQty: 260 },
          { id: 'carton-10', label: 'Master Carton (10 Rolls)', skuSuffix: 'C10', priceAed: 345.0, stockQty: 40 },
        ],
        popularity: 89,
      },
      {
        sku: 'HYG-JAN-302',
        slug: 'microfiber-cleaning-cloth-pack-10',
        name: 'Microfiber Cleaning Cloth – Pack of 10',
        categorySlug: 'janitorial',
        categoryName: 'Janitorial Supplies',
        brand: 'HYGIENOVO Pro',
        packSize: 'Pack of 10',
        priceAed: 45.0,
        stockQty: 210,
        featured: 1,
        description:
          'Color-coded 320 GSM commercial microfiber cloths that trap fine dust and grease without scratching glass, stainless steel, or lacquered cabinetry.',
        specs: [
          { label: 'Dimensions', value: '40 cm × 40 cm' },
          { label: 'Fabric Weight', value: '320 GSM Split Microfiber' },
          { label: 'Wash Durability', value: 'Up to 300 Commercial Wash Cycles' },
          { label: 'Color Coding', value: '4-Color Hygiene Segregation' },
        ],
        applications:
          'Color-coded zone cleaning: blue for general glass/desks, green for kitchens, yellow for washroom sinks, red for sanitary zones.',
        usageSafety: 'Wash separately without fabric softener to preserve electrostatic fiber lift.',
        packagingDetails: 'Sealed poly-pack of 10 cloths ready for janitorial cart deployment.',
        image: STITCH_IMAGES.microfiber,
        gallery: [STITCH_IMAGES.microfiber],
        variations: [
          { id: 'pack-10', label: 'Pack of 10 Cloths', skuSuffix: 'P10', priceAed: 45.0, stockQty: 210 },
          { id: 'pack-50', label: 'Bulk Pack of 50 Cloths', skuSuffix: 'P50', priceAed: 198.0, stockQty: 60 },
        ],
        popularity: 91,
      },
      {
        sku: 'HYG-EQP-101',
        slug: 'professional-mop-bucket-set',
        name: 'Professional Mop & Bucket Set',
        categorySlug: 'equipment',
        categoryName: 'Cleaning Equipment',
        brand: 'CleanTech Commercial',
        packSize: 'Complete Unit',
        priceAed: 195.0,
        stockQty: 65,
        featured: 1,
        description:
          'Heavy-duty 32L side-press wringer mop bucket on smooth non-marking swivel casters, paired with an aluminum handle and high-absorbency looped cotton-blend mop head.',
        specs: [
          { label: 'Bucket Capacity', value: '32 Litres with Divider' },
          { label: 'Wringer Mechanism', value: 'Industrial Down-Press / Side-Press' },
          { label: 'Casters', value: '4 × 360° Non-Marking Rubber' },
          { label: 'Handle Material', value: 'Anodized Aluminum (140 cm)' },
        ],
        applications: 'Commercial corridors, building lobbies, clinics, restaurants, and warehouse floors.',
        usageSafety: 'Pair with wet floor caution signage during active mopping.',
        packagingDetails: 'Ships boxed with bucket, wringer assembly, handle, and 2 mop heads.',
        image: STITCH_IMAGES.mopSet,
        gallery: [STITCH_IMAGES.mopSet, STITCH_IMAGES.equipment],
        variations: [
          { id: 'unit-32l', label: 'Complete 32L Set', skuSuffix: 'SET', priceAed: 195.0, stockQty: 65 },
          { id: 'set-plus-4heads', label: 'Set + 4 Spare Mop Heads', skuSuffix: 'PRO', priceAed: 245.0, stockQty: 30 },
        ],
        popularity: 87,
      },
      {
        sku: 'HYG-CHM-503',
        slug: 'toilet-cleaner-5l',
        name: 'Toilet Cleaner – 5L',
        categorySlug: 'chemicals',
        categoryName: 'Cleaning Chemicals',
        brand: 'HYGIENOVO Pro',
        packSize: '5L Jerrycan',
        priceAed: 58.0,
        stockQty: 110,
        featured: 1,
        description:
          'Thickened cling-action sanitary bowl and urinal descaler formulated to remove hard-water scale, organic stains, and odors in commercial washrooms.',
        specs: [
          { label: 'Viscosity', value: 'High-Cling Gel Formula' },
          { label: 'Volume', value: '5L Jerrycan' },
          { label: 'Target Surfaces', value: 'Porcelain & Ceramic Fixtures' },
          { label: 'Action', value: 'Descaling & Deodorizing' },
        ],
        applications: 'Office washrooms, hospitality restrooms, schools, and public buildings.',
        usageSafety: 'Do not mix with chlorine bleach or alkaline cleaners. Wear nitrile gloves.',
        packagingDetails: '5L HDPE jerrycan with directional pouring neck.',
        image: STITCH_IMAGES.chemicalsAlt,
        gallery: [STITCH_IMAGES.chemicalsAlt, STITCH_IMAGES.chemicals],
        variations: [
          { id: '5l-single', label: '5L Jerrycan', skuSuffix: '1PK', priceAed: 58.0, stockQty: 110 },
          { id: '5l-case4', label: 'Case of 4 × 5L', skuSuffix: '4PK', priceAed: 215.0, stockQty: 28 },
        ],
        popularity: 84,
      },
      {
        sku: 'HYG-SAF-401',
        slug: 'industrial-cleaning-gloves',
        name: 'Industrial Cleaning Gloves',
        categorySlug: 'safety',
        categoryName: 'Safety & Protection',
        brand: 'CleanTech Commercial',
        packSize: 'Box of 50 Pairs',
        priceAed: 32.0,
        stockQty: 300,
        featured: 1,
        description:
          'Powder-free nitrile chemical-resistant utility gloves with textured fingertips for confident wet grip during janitorial and sanitizing operations.',
        specs: [
          { label: 'Material', value: 'Latex-Free Nitrile (6 mil)' },
          { label: 'Box Count', value: '50 Pairs (100 Gloves)' },
          { label: 'Grip Finish', value: 'Diamond-Textured Palm & Fingers' },
          { label: 'Sizes', value: 'Medium / Large Commercial Fit' },
        ],
        applications: 'Chemical dilution, washroom sanitation, waste handling, and food-prep facility cleaning.',
        usageSafety: 'Single-shift disposable PPE; inspect for tears before handling concentrates.',
        packagingDetails: 'Dispensing dispenser box of 50 pairs.',
        image: STITCH_IMAGES.gloves,
        gallery: [STITCH_IMAGES.gloves, STITCH_IMAGES.safety],
        variations: [
          { id: 'box-m', label: 'Size M — Box of 50 Pairs', skuSuffix: 'M50', priceAed: 32.0, stockQty: 160 },
          { id: 'box-l', label: 'Size L — Box of 50 Pairs', skuSuffix: 'L50', priceAed: 32.0, stockQty: 140 },
        ],
        popularity: 90,
      },
      {
        sku: 'HYG-PAP-601',
        slug: 'jumbo-roll-toilet-tissue-case',
        name: 'Jumbo Roll Toilet Tissue – Case',
        categorySlug: 'paper',
        categoryName: 'Paper Products',
        brand: 'HYGIENOVO Pro',
        packSize: 'Case of 12 Rolls',
        priceAed: 92.0,
        stockQty: 95,
        featured: 0,
        description:
          '2-ply virgin pulp jumbo toilet tissue rolls engineered for high-capacity commercial washroom dispensers, reducing refill frequency for building teams.',
        specs: [
          { label: 'Ply & Material', value: '2-Ply Pure Virgin Pulp' },
          { label: 'Roll Length', value: '300 Meters per Roll' },
          { label: 'Core Diameter', value: '76 mm Universal Core' },
          { label: 'Case Quantity', value: '12 Jumbo Rolls' },
        ],
        applications: 'High-footfall office towers, shopping venues, clinics, and commercial facilities.',
        usageSafety: 'Store cases elevated off floor in dry storage rooms.',
        packagingDetails: 'Sealed corrugated case of 12 × 300m jumbo rolls.',
        image: STITCH_IMAGES.paperAlt,
        gallery: [STITCH_IMAGES.paperAlt, STITCH_IMAGES.paper],
        variations: [
          { id: 'case-12', label: 'Case of 12 Jumbo Rolls', skuSuffix: 'C12', priceAed: 92.0, stockQty: 95 },
          { id: 'pallet-24', label: '2-Case Bundle (24 Rolls)', skuSuffix: 'C24', priceAed: 174.0, stockQty: 40 },
        ],
        popularity: 88,
      },
      {
        sku: 'HYG-PAP-602',
        slug: 'interfold-hand-towels-case',
        name: 'C-Fold & Interfold Hand Towels – Case',
        categorySlug: 'paper',
        categoryName: 'Paper Products',
        brand: 'HYGIENOVO Pro',
        packSize: 'Case of 20 Packs (4,000 Sheets)',
        priceAed: 78.0,
        stockQty: 115,
        featured: 0,
        description:
          'High-absorbency 2-ply embossed interfold paper hand towels designed for one-at-a-time hygienic dispensing in office and hospitality washrooms.',
        specs: [
          { label: 'Sheet Count', value: '200 Sheets × 20 Packs (4,000)' },
          { label: 'Ply', value: '2-Ply Soft Embossed' },
          { label: 'Fold Type', value: 'Universal Interfold / V-Fold' },
          { label: 'Sheet Size', value: '21 cm × 23 cm' },
        ],
        applications: 'Executive washrooms, pantry sinks, clinics, and commercial restrooms.',
        usageSafety: 'Fits standard wall-mounted interfold dispensers.',
        packagingDetails: 'Heavy-duty carton containing 20 moisture-wrapped packs.',
        image: STITCH_IMAGES.paper,
        gallery: [STITCH_IMAGES.paper],
        variations: [
          { id: 'case-20', label: 'Case of 20 Packs', skuSuffix: 'C20', priceAed: 78.0, stockQty: 115 },
        ],
        popularity: 82,
      },
      {
        sku: 'HYG-EQP-102',
        slug: 'janitorial-service-trolley-cart',
        name: 'Commercial Janitorial Service Trolley',
        categorySlug: 'equipment',
        categoryName: 'Cleaning Equipment',
        brand: 'CleanTech Commercial',
        packSize: '1 Complete Trolley',
        priceAed: 420.0,
        stockQty: 24,
        featured: 0,
        description:
          'Three-tier commercial housekeeping and janitorial cart with front mop platform, zippered 100L vinyl waste bag, and quiet-roll swivel wheels.',
        specs: [
          { label: 'Dimensions', value: '112 × 51 × 98 cm' },
          { label: 'Frame Material', value: 'High-Impact Structural Polypropylene' },
          { label: 'Waste Bag', value: '100L Heavy Vinyl with Lid' },
          { label: 'Load Capacity', value: '135 kg Distributed' },
        ],
        applications: 'Multi-floor office buildings, hotels, hospitals, and facility contractors.',
        usageSafety: 'Lock front casters when parked on ramps or service elevators.',
        packagingDetails: 'Flat-packed commercial carton with 10-minute tool-free assembly.',
        image: STITCH_IMAGES.equipment,
        gallery: [STITCH_IMAGES.equipment],
        variations: [
          { id: 'trolley-std', label: 'Standard 3-Tier Trolley', skuSuffix: 'STD', priceAed: 420.0, stockQty: 24 },
        ],
        popularity: 79,
      },
      {
        sku: 'HYG-SAF-402',
        slug: 'heavy-duty-wet-floor-caution-sign',
        name: 'Wet Floor Caution A-Frame Sign (Pack of 2)',
        categorySlug: 'safety',
        categoryName: 'Safety & Protection',
        brand: 'CleanTech Commercial',
        packSize: 'Pack of 2 Signs',
        priceAed: 64.0,
        stockQty: 75,
        featured: 0,
        description:
          'High-visibility bilingual Arabic/English folding yellow caution A-frame safety signs compliant with UAE commercial facility safety protocols.',
        specs: [
          { label: 'Height', value: '62 cm Open Height' },
          { label: 'Text', value: 'Bilingual English & Arabic' },
          { label: 'Material', value: 'Weatherproof Virgin Polypropylene' },
          { label: 'Pack Quantity', value: '2 Folding Signs' },
        ],
        applications: 'Lobbies, escalators, washroom entrances, and wet maintenance zones.',
        usageSafety: 'Place clearly ahead of wet floor boundaries.',
        packagingDetails: 'Pack of 2 nested A-frame signs.',
        image: STITCH_IMAGES.safety,
        gallery: [STITCH_IMAGES.safety],
        variations: [
          { id: 'pack-2', label: 'Pack of 2 Signs', skuSuffix: 'P02', priceAed: 64.0, stockQty: 75 },
          { id: 'pack-6', label: 'Facility Pack of 6 Signs', skuSuffix: 'P06', priceAed: 175.0, stockQty: 25 },
        ],
        popularity: 76,
      },
    ];

    for (const p of seedProducts) {
      insertProd.run(
        p.sku,
        p.slug,
        p.name,
        p.categorySlug,
        p.categoryName,
        p.brand,
        p.packSize,
        p.priceAed,
        p.stockQty,
        p.featured,
        p.description,
        JSON.stringify(p.specs),
        p.applications,
        p.usageSafety,
        p.packagingDetails,
        p.image,
        JSON.stringify(p.gallery),
        JSON.stringify(p.variations),
        p.popularity
      );
    }
  }

  const discountCount = db.prepare('SELECT COUNT(*) AS cnt FROM discount_codes').get() as { cnt: number };
  if (discountCount.cnt === 0) {
    const insertDisc = db.prepare(
      'INSERT INTO discount_codes (code, type, value, min_order_aed, active) VALUES (?, ?, ?, ?, ?)'
    );
    insertDisc.run('WELCOME10', 'percent', 10, 100, 1);
    insertDisc.run('DUBAI25', 'fixed', 25, 200, 1);
    insertDisc.run('BULK15', 'percent', 15, 500, 1);
  }

  // Migrate any legacy remote lh3.googleusercontent.com/aida/ URLs to bundled local photography
  const categoryImgMap: Record<string, string> = {
    chemicals: STITCH_IMAGES.chemicals,
    equipment: STITCH_IMAGES.equipment,
    washroom: STITCH_IMAGES.washroom,
    paper: STITCH_IMAGES.paper,
    janitorial: STITCH_IMAGES.janitorial,
    safety: STITCH_IMAGES.safety,
  };
  const updateCatImg = db.prepare('UPDATE categories SET image = ? WHERE slug = ? AND image LIKE ?');
  for (const [slug, imgPath] of Object.entries(categoryImgMap)) {
    updateCatImg.run(imgPath, slug, '%lh3.googleusercontent.com/aida/%');
  }

  const productImgMap: Record<string, { image: string; gallery: string[] }> = {
    'commercial-floor-cleaner-5l': {
      image: STITCH_IMAGES.floorCleaner,
      gallery: [STITCH_IMAGES.floorCleanerDetail, STITCH_IMAGES.chemicalsAlt, STITCH_IMAGES.heroWorkspace],
    },
    'multipurpose-cleaner-5l': {
      image: STITCH_IMAGES.chemicals,
      gallery: [STITCH_IMAGES.chemicals, STITCH_IMAGES.chemicalsAlt],
    },
    'liquid-hand-wash-5l': {
      image: STITCH_IMAGES.washroom,
      gallery: [STITCH_IMAGES.washroom],
    },
    'heavy-duty-garbage-bags-pack': {
      image: STITCH_IMAGES.janitorial,
      gallery: [STITCH_IMAGES.janitorial],
    },
    'microfiber-cleaning-cloth-pack-10': {
      image: STITCH_IMAGES.microfiber,
      gallery: [STITCH_IMAGES.microfiber],
    },
    'professional-mop-bucket-set': {
      image: STITCH_IMAGES.mopSet,
      gallery: [STITCH_IMAGES.mopSet, STITCH_IMAGES.equipment],
    },
    'toilet-cleaner-5l': {
      image: STITCH_IMAGES.chemicalsAlt,
      gallery: [STITCH_IMAGES.chemicalsAlt, STITCH_IMAGES.chemicals],
    },
    'industrial-cleaning-gloves': {
      image: STITCH_IMAGES.gloves,
      gallery: [STITCH_IMAGES.gloves, STITCH_IMAGES.safety],
    },
    'jumbo-roll-toilet-tissue-case': {
      image: STITCH_IMAGES.paperAlt,
      gallery: [STITCH_IMAGES.paperAlt, STITCH_IMAGES.paper],
    },
    'interfold-hand-towels-case': {
      image: STITCH_IMAGES.paper,
      gallery: [STITCH_IMAGES.paper],
    },
    'janitorial-service-trolley-cart': {
      image: STITCH_IMAGES.equipment,
      gallery: [STITCH_IMAGES.equipment],
    },
    'heavy-duty-wet-floor-caution-sign': {
      image: STITCH_IMAGES.safety,
      gallery: [STITCH_IMAGES.safety],
    },
  };
  const updateProdImg = db.prepare(
    'UPDATE products SET image = ?, gallery_json = ? WHERE slug = ? AND (image LIKE ? OR gallery_json LIKE ?)'
  );
  for (const [slug, imgs] of Object.entries(productImgMap)) {
    updateProdImg.run(
      imgs.image,
      JSON.stringify(imgs.gallery),
      slug,
      '%lh3.googleusercontent.com/aida/%',
      '%lh3.googleusercontent.com/aida/%'
    );
  }
}

export function mapProductRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    sku: String(row.sku),
    slug: String(row.slug),
    name: String(row.name),
    categorySlug: String(row.category_slug),
    categoryName: String(row.category_name),
    brand: String(row.brand),
    packSize: String(row.pack_size),
    priceAed: Number(row.price_aed),
    stockQty: Number(row.stock_qty),
    featured: Boolean(row.featured),
    description: String(row.description),
    specifications: JSON.parse(String(row.specifications_json || '[]')),
    applications: String(row.applications || ''),
    usageSafety: String(row.usage_safety || ''),
    packagingDetails: String(row.packaging_details || ''),
    image: String(row.image),
    gallery: JSON.parse(String(row.gallery_json || '[]')),
    variations: JSON.parse(String(row.variations_json || '[]')),
    popularity: Number(row.popularity),
    createdAt: String(row.created_at),
  };
}

export function mapOrderRow(row: Record<string, unknown>) {
  return {
    id: Number(row.id),
    orderNumber: String(row.order_number),
    userId: row.user_id === null || row.user_id === undefined ? null : Number(row.user_id),
    customerName: String(row.customer_name),
    customerEmail: String(row.customer_email),
    customerPhone: String(row.customer_phone),
    companyName: String(row.company_name || ''),
    trn: String(row.trn || ''),
    emirate: String(row.emirate),
    city: String(row.city),
    address: String(row.address),
    deliveryWindow: String(row.delivery_window),
    paymentMethod: String(row.payment_method),
    paymentStatus: String(row.payment_status),
    orderStatus: String(row.order_status),
    discountCode: row.discount_code ? String(row.discount_code) : null,
    discountAmountAed: Number(row.discount_amount_aed),
    subtotalAed: Number(row.subtotal_aed),
    deliveryFeeAed: Number(row.delivery_fee_aed),
    vatAmountAed: Number(row.vat_amount_aed),
    totalAed: Number(row.total_aed),
    items: JSON.parse(String(row.items_json || '[]')),
    notes: String(row.notes || ''),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
