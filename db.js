require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Seed data matching Comfy's Decor Accessories promotional flyer & catalog
const SEED_PRODUCTS = [
  {
    id: 'cda-001',
    sku: 'CDA-LGT-001',
    title: 'Illuminated Astronaut Figurine Moon Lamp',
    category: 'Decorative Lighting',
    price_ghs: 690,
    stock_qty: 5,
    published: true,
    origin: 'Gold Helmet & Textured Moon Sphere',
    material: 'Composite stone resin, warm LED orb with rechargeable base',
    dimensions: '28 × 16 × 14 cm',
    weight: '1.5 kg',
    guild: 'Living Room Console, Bedside Table or Creative Desk',
    description: "Comfy's signature astronaut figurine sitting upon a cratered moon orb, equipped with stylish gold headphones and cradling an illuminated warm-glowing sphere. A captivating contemporary conversation piece for modern home and office interiors.",
    symbolism: 'Warm ambient glow with touch-dimmer switch. Recharge via included USB cable. Dust with a soft dry cloth.',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-002',
    sku: 'CDA-SCU-002',
    title: 'Majestic Rearing Stallion Sculptures (Pair in White & Black Gold)',
    category: 'Sculptures & Figurines',
    price_ghs: 780,
    stock_qty: 4,
    published: true,
    origin: 'Glazed White & Onyx Black with Gold Accents',
    material: 'Fine ceramic composite, hand-applied gold leaf detail',
    dimensions: '32 × 18 × 10 cm each',
    weight: '2.2 kg (Pair)',
    guild: 'Living Room Credenza, Bookshelf or Office Suite',
    description: 'Dynamic duo of rearing equestrian statues featuring one pristine white stallion and one midnight black stallion, accented with lustrous gold manes and hooves. Conveys grace, strength, and modern architectural elegance.',
    symbolism: 'Wipe clean with dry microfiber cloth. Display as a balanced pair or on opposing sides of a console.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-003',
    sku: 'CDA-LGT-003',
    title: 'Tripod Crystal Orb Decorative Lamps (Set of 3)',
    category: 'Decorative Lighting',
    price_ghs: 850,
    stock_qty: 3,
    published: true,
    origin: 'Polished Gold & Crystalline Glass',
    material: 'Spun electroplated brass tripod stands, bubble crystal globes',
    dimensions: 'Small: 18cm, Med: 24cm, Large: 30cm',
    weight: '2.8 kg (Set)',
    guild: 'Coffee Table, Dining Room Buffet or Display Niche',
    description: 'Trio of graduated architectural gold tripod stands crowning luminous bubble crystal spheres. Casts an enchanting prism of warm ambient light across dining and living spaces.',
    symbolism: 'Includes low-voltage warm LED elements with inline switch. Gently wipe glass with lint-free cloth.',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-004',
    sku: 'CDA-FIG-004',
    title: 'Nordic Stag Deer Figurine with Gold Antlers & Solar Disc',
    category: 'Sculptures & Figurines',
    price_ghs: 520,
    stock_qty: 6,
    published: true,
    origin: 'Matte Chalk White & Polished Gold',
    material: 'High-density composite, polished gold electroplated antlers',
    dimensions: '26 × 20 × 11 cm',
    weight: '950 g',
    guild: 'Entryway Console, Coffee Table or Executive Desk',
    description: 'Serene resting deer figurine in silky matte white, crowned with sculptural gold antlers and supporting an illuminated reflective disc. Evokes tranquility and sophisticated nature-inspired modern styling.',
    symbolism: 'Equipped with protective velvet pads under base. Wipe with clean cloth.',
    images: [
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-005',
    sku: 'CDA-KTC-005',
    title: 'Kitchen Countertop Ceramic Canister & Utensil Styling Set',
    category: 'Kitchen Accessories',
    price_ghs: 480,
    stock_qty: 5,
    published: true,
    origin: 'Terracotta, Warm Oatmeal & Natural Wood',
    material: 'Glazed stoneware ceramic, solid acacia wood utensils',
    dimensions: 'Canister: 18 × 12 cm; Board: 30 × 15 cm',
    weight: '1.8 kg (Set)',
    guild: 'Kitchen Island, Countertop or Breakfast Bar',
    description: 'Curated kitchen styling and countertop arrangement featuring fluted ceramic canisters, ribbed jars, and hand-carved wooden spoons. Unites everyday culinary functionality with organic interior decor.',
    symbolism: 'Ceramic jars are food-safe and washable; hand wipe wooden utensils with food-safe oil.',
    images: [
      'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-006',
    sku: 'CDA-VAS-006',
    title: 'Fluted Ceramic Tabletop Vase (Warm Cream & Matte Glaze)',
    category: 'Decorative Vases',
    price_ghs: 380,
    stock_qty: 6,
    published: true,
    origin: 'Warm Cream / Matte Finish',
    material: 'Stoneware ceramic with textured tactile glaze',
    dimensions: '26 × 15 × 15 cm',
    weight: '850 g',
    guild: 'Dining Table, Entryway Console or Open Shelving',
    description: 'Architecturally fluted ceramic vase designed for fresh florals or dried pampas stems. Features a balanced organic silhouette with a velvety matte surface finish.',
    symbolism: 'Water-tight interior. Hand wash with warm soapy water; dry immediately. Pair with neutral botanicals.',
    images: [
      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-007',
    sku: 'CDA-TAB-007',
    title: 'Sculptural Continuous Metal Knot Object (Polished Gold)',
    category: 'Tabletop Accessories',
    price_ghs: 290,
    stock_qty: 8,
    published: true,
    origin: 'High-Gloss Polished Gold',
    material: 'Solid cast aluminum with durable electroplated gold luster',
    dimensions: '15 × 15 × 14 cm',
    weight: '550 g',
    guild: 'Coffee Table Book Stack, Display Tray or TV Unit',
    description: 'Playful yet luxurious three-loop continuous metal knot. A quintessential interior styling accessory that adds height, reflection, and artistic intrigue to book stacks and trays.',
    symbolism: 'Tarnish-resistant mirror finish. Polish lightly with a dry microfiber cloth.',
    images: [
      'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-008',
    sku: 'CDA-OFF-008',
    title: 'Heavyweight Marble Desk Organizer Tray with Gold Handles',
    category: 'Office Décor',
    price_ghs: 450,
    stock_qty: 5,
    published: true,
    origin: 'White Veined Marble & Brushed Gold',
    material: 'Natural polished white marble, gold-plated brass handles',
    dimensions: '30 × 18 × 4 cm',
    weight: '2.1 kg',
    guild: 'Executive Desk, Vanity Table or Hallway Catchall',
    description: 'Premium natural marble catchall tray equipped with dual polished gold side handles. Organizes writing instruments, luxury watches, keys, or daily stationery with timeless composure.',
    symbolism: 'Natural marble exhibits unique organic veining. Wipe with mild damp cloth; avoid acidic liquids.',
    images: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-009',
    sku: 'CDA-KTC-009',
    title: 'Hammered Brass Centerpiece & Fruit Bowl',
    category: 'Kitchen Accessories',
    price_ghs: 490,
    stock_qty: 5,
    published: true,
    origin: 'Hand-Hammered Warm Gold',
    material: 'Food-safe solid spun brass with protective clear sealant',
    dimensions: '30 × 30 × 9 cm',
    weight: '720 g',
    guild: 'Kitchen Island, Breakfast Bar or Dining Centerpiece',
    description: 'Sculptural shallow serving and display bowl crafted with a rhythmic hammered texture that catches ambient kitchen lighting. Suitable for artisan breads, fresh fruits, or decorative accents.',
    symbolism: 'Wipe clean with a soft damp cloth. Avoid harsh chemical cleaners and abrasive scouring pads.',
    images: [
      'https://images.unsplash.com/photo-1584589167171-541ce45f1eea?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-010',
    sku: 'CDA-WAL-010',
    title: 'Architectural Geometric Arch Relief Plaque (Olive & Oatmeal)',
    category: 'Wall Décor',
    price_ghs: 720,
    stock_qty: 3,
    published: true,
    origin: 'Muted Olive & Warm Oatmeal',
    material: 'Textured architectural plaster composite on timber frame',
    dimensions: '45 × 35 × 4 cm',
    weight: '1.9 kg',
    guild: 'Living Room Gallery Wall, Entryway Niche or Office',
    description: 'Tactile three-dimensional relief wall art panel evoking gentle architectural arches and serene shadows under ambient room lighting.',
    symbolism: 'Supplied with heavy-duty recessed hanging brackets. Dust lightly with a soft brush.',
    images: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-011',
    sku: 'CDA-OFF-011',
    title: 'Minimalist The Thinker Figurine (Matte Charcoal & Gold)',
    category: 'Sculptures & Figurines',
    price_ghs: 350,
    stock_qty: 7,
    published: true,
    origin: 'Matte Charcoal / Gold Leaf Detail',
    material: 'Fine density composite resin, hand-buffed matte finish',
    dimensions: '24 × 13 × 10 cm',
    weight: '620 g',
    guild: 'Executive Office Desk, Bookshelf or Coffee Table Tray',
    description: 'Contemporary abstract contemplative figurine capturing a modern introspective pose. Its clean lines and compact footprint make it a versatile decorative accent for home and office.',
    symbolism: 'Equipped with anti-scratch felt protective pads underneath base. Dust with soft dry cloth.',
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80'
    ]
  },
  {
    id: 'cda-012',
    sku: 'CDA-VAS-012',
    title: 'Circular Modernist Donut Ring Vase (Chalk White Ceramic)',
    category: 'Decorative Vases',
    price_ghs: 320,
    stock_qty: 8,
    published: true,
    origin: 'Matte Chalk White',
    material: 'Ceramic earthenware, unglazed porous exterior',
    dimensions: '22 × 20 × 6 cm',
    weight: '750 g',
    guild: 'Console Table, Floating Shelf or Mantelpiece',
    description: 'Trending donut-ring geometric hollow vase with an open center. Beautiful whether styled with solitary dried florals or displayed as a standalone architectural art piece.',
    symbolism: 'Internally sealed for water retention. Wipe exterior gently with a clean dry cloth.',
    images: [
      'https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?w=800&auto=format&fit=crop&q=80'
    ]
  }
];

function formatRowToProduct(row) {
  return {
    id: row.id,
    sku: row.sku,
    title: row.title,
    category: row.category,
    priceGhs: Number(row.price_ghs),
    stockQty: Number(row.stock_qty),
    published: Boolean(row.published),
    origin: row.origin || '',
    material: row.material || '',
    dimensions: row.dimensions || '',
    weight: row.weight || '',
    guild: row.guild || '',
    description: row.description || '',
    symbolism: row.symbolism || '',
    images: typeof row.images === 'string' ? JSON.parse(row.images) : (row.images || [])
  };
}

// Password Hashing with PBKDF2 (100,000 iterations, SHA-512)
function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt };
}

function verifyPassword(password, hash, salt) {
  try {
    const computed = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
  } catch (_) {
    return false;
  }
}

async function initDb() {
  // 1. Ensure products table exists
  const createProductsTableQuery = `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(50) PRIMARY KEY,
      sku VARCHAR(50) UNIQUE NOT NULL,
      title VARCHAR(255) NOT NULL,
      category VARCHAR(100) NOT NULL,
      price_ghs NUMERIC(10, 2) NOT NULL DEFAULT 0,
      stock_qty INTEGER NOT NULL DEFAULT 0,
      published BOOLEAN NOT NULL DEFAULT true,
      origin VARCHAR(255) DEFAULT '',
      material VARCHAR(255) DEFAULT '',
      dimensions VARCHAR(100) DEFAULT '',
      weight VARCHAR(100) DEFAULT '',
      guild VARCHAR(255) DEFAULT '',
      description TEXT DEFAULT '',
      symbolism TEXT DEFAULT '',
      images JSONB DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(createProductsTableQuery);

  // 2. Ensure admins table exists in Neon
  const createAdminsTableQuery = `
    CREATE TABLE IF NOT EXISTS admins (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      email VARCHAR(150) UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      salt VARCHAR(64) NOT NULL,
      full_name VARCHAR(150),
      role VARCHAR(50) DEFAULT 'admin',
      last_login TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(createAdminsTableQuery);

  // Check if products table is empty; if so, seed flyer products
  const countRes = await pool.query('SELECT COUNT(*) FROM products');
  const count = parseInt(countRes.rows[0].count, 10);

  if (count === 0) {
    console.log('Seeding initial products into Neon PostgreSQL...');
    for (const item of SEED_PRODUCTS) {
      await pool.query(
        `INSERT INTO products (
          id, sku, title, category, price_ghs, stock_qty, published, origin,
          material, dimensions, weight, guild, description, symbolism, images
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          item.id,
          item.sku,
          item.title,
          item.category,
          item.price_ghs,
          item.stock_qty,
          item.published,
          item.origin,
          item.material,
          item.dimensions,
          item.weight,
          item.guild,
          item.description,
          item.symbolism,
          JSON.stringify(item.images)
        ]
      );
    }
    console.log(`Successfully seeded ${SEED_PRODUCTS.length} products to Neon.`);
  }

  // Check if admins table is empty; if so, seed default store admin into Neon
  const adminCountRes = await pool.query('SELECT COUNT(*) FROM admins');
  const adminCount = parseInt(adminCountRes.rows[0].count, 10);

  if (adminCount === 0) {
    console.log('Seeding initial admin account into Neon PostgreSQL...');
    const defaultPassword = process.env.ADMIN_PASSWORD || 'comfy2026';
    const { hash, salt } = hashPassword(defaultPassword);
    await pool.query(
      `INSERT INTO admins (id, username, email, password_hash, salt, full_name, role)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        'admin-001',
        'admin',
        'comfysdecor@gmail.com',
        hash,
        salt,
        "Comfy's Store Administrator",
        'superadmin'
      ]
    );
    console.log("Successfully seeded admin user into Neon PostgreSQL: username='admin', email='comfysdecor@gmail.com'");
  }

  // 3. Ensure store_info table exists in Neon for dynamic contact & brand info
  const createStoreInfoTableQuery = `
    CREATE TABLE IF NOT EXISTS store_info (
      id VARCHAR(20) PRIMARY KEY DEFAULT 'main',
      whatsapp_number VARCHAR(50) DEFAULT '233595427789',
      display_phone VARCHAR(50) DEFAULT '059 542 7789',
      snapchat_handle VARCHAR(100) DEFAULT 'comfys_decorate',
      hero_eyebrow VARCHAR(255) DEFAULT 'Do you need a',
      hero_serif VARCHAR(255) DEFAULT 'decorative accessory',
      hero_target VARCHAR(255) DEFAULT 'for your Home, Kitchen or Office?',
      hero_subtext TEXT DEFAULT 'Comfy''s Decor Accessories has got exactly what you need. Browse our curated sculptures, ambient lighting, vases, and interior styling accents.',
      delivery_notice VARCHAR(255) DEFAULT 'Delivery Across Ghana',
      store_location VARCHAR(255) DEFAULT 'Accra, Ghana',
      opening_hours VARCHAR(255) DEFAULT 'Mon - Sat: 8:00 AM - 7:00 PM',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;
  await pool.query(createStoreInfoTableQuery);

  const storeInfoCountRes = await pool.query('SELECT COUNT(*) FROM store_info');
  if (parseInt(storeInfoCountRes.rows[0].count, 10) === 0) {
    await pool.query(`
      INSERT INTO store_info (id, whatsapp_number, display_phone, snapchat_handle, hero_eyebrow, hero_serif, hero_target, hero_subtext, delivery_notice, store_location, opening_hours)
      VALUES ('main', '233595427789', '059 542 7789', 'comfys_decorate', 'Do you need a', 'decorative accessory', 'for your Home, Kitchen or Office?', 'Comfy''s Decor Accessories has got exactly what you need. Browse our curated sculptures, ambient lighting, vases, and interior styling accents.', 'Delivery Across Ghana', 'Accra, Ghana', 'Mon - Sat: 8:00 AM - 7:00 PM')
    `);
    console.log("Successfully seeded default store info and contacts into Neon PostgreSQL.");
  }
}

// Store Settings & Info Helpers
function formatRowToStoreInfo(row) {
  if (!row) return null;
  return {
    whatsappNumber: row.whatsapp_number,
    displayPhone: row.display_phone,
    snapchatHandle: row.snapchat_handle,
    heroEyebrow: row.hero_eyebrow,
    heroSerif: row.hero_serif,
    heroTarget: row.hero_target,
    heroSubtext: row.hero_subtext,
    deliveryNotice: row.delivery_notice,
    storeLocation: row.store_location,
    openingHours: row.opening_hours,
    updatedAt: row.updated_at
  };
}

async function getStoreInfo() {
  const res = await pool.query("SELECT * FROM store_info WHERE id = 'main' LIMIT 1");
  return res.rows.length ? formatRowToStoreInfo(res.rows[0]) : null;
}

async function updateStoreInfo(info) {
  const res = await pool.query(
    `UPDATE store_info SET
      whatsapp_number = COALESCE($1, whatsapp_number),
      display_phone = COALESCE($2, display_phone),
      snapchat_handle = COALESCE($3, snapchat_handle),
      hero_eyebrow = COALESCE($4, hero_eyebrow),
      hero_serif = COALESCE($5, hero_serif),
      hero_target = COALESCE($6, hero_target),
      hero_subtext = COALESCE($7, hero_subtext),
      delivery_notice = COALESCE($8, delivery_notice),
      store_location = COALESCE($9, store_location),
      opening_hours = COALESCE($10, opening_hours),
      updated_at = NOW()
    WHERE id = 'main'
    RETURNING *`,
    [
      info.whatsappNumber,
      info.displayPhone,
      info.snapchatHandle,
      info.heroEyebrow,
      info.heroSerif,
      info.heroTarget,
      info.heroSubtext,
      info.deliveryNotice,
      info.storeLocation,
      info.openingHours
    ]
  );
  return res.rows.length ? formatRowToStoreInfo(res.rows[0]) : null;
}

// Admin Database Helpers
async function getAdminByUsernameOrEmail(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const res = await pool.query(
    'SELECT * FROM admins WHERE LOWER(username) = $1 OR LOWER(email) = $1 LIMIT 1',
    [clean]
  );
  return res.rows[0] || null;
}

async function updateAdminLastLogin(id) {
  await pool.query('UPDATE admins SET last_login = NOW(), updated_at = NOW() WHERE id = $1', [id]);
}

async function verifyAdminCredentials(identifier, password) {
  if (!password) return null;
  const admin = await getAdminByUsernameOrEmail(identifier || 'admin');
  if (!admin) return null;
  const isValid = verifyPassword(password, admin.password_hash, admin.salt);
  if (!isValid) return null;
  await updateAdminLastLogin(admin.id);
  return {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    fullName: admin.full_name,
    role: admin.role,
    lastLogin: admin.last_login
  };
}

async function createAdminUser({ username, email, password, fullName, role = 'admin' }) {
  const id = 'admin-' + Date.now();
  const { hash, salt } = hashPassword(password);
  const res = await pool.query(
    `INSERT INTO admins (id, username, email, password_hash, salt, full_name, role)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, username, email, full_name, role, created_at`,
    [id, username.trim().toLowerCase(), (email || '').trim().toLowerCase(), hash, salt, fullName || username, role]
  );
  return res.rows[0];
}

async function listAdmins() {
  const res = await pool.query(
    'SELECT id, username, email, full_name, role, last_login, created_at FROM admins ORDER BY created_at ASC'
  );
  return res.rows;
}

async function getAllProducts() {
  const res = await pool.query('SELECT * FROM products ORDER BY created_at ASC');
  return res.rows.map(formatRowToProduct);
}

async function getProductById(id) {
  const res = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return res.rows.length ? formatRowToProduct(res.rows[0]) : null;
}

async function createProduct(item) {
  const id = item.id || ('cda-' + Date.now());
  const res = await pool.query(
    `INSERT INTO products (
      id, sku, title, category, price_ghs, stock_qty, published, origin,
      material, dimensions, weight, guild, description, symbolism, images
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING *`,
    [
      id,
      item.sku,
      item.title,
      item.category,
      item.priceGhs,
      item.stockQty,
      item.published !== false,
      item.origin || '',
      item.material || '',
      item.dimensions || '',
      item.weight || '',
      item.guild || '',
      item.description || '',
      item.symbolism || '',
      JSON.stringify(item.images || [])
    ]
  );
  return formatRowToProduct(res.rows[0]);
}

async function updateProduct(id, item) {
  const res = await pool.query(
    `UPDATE products SET
      sku = $2,
      title = $3,
      category = $4,
      price_ghs = $5,
      stock_qty = $6,
      published = $7,
      origin = $8,
      material = $9,
      dimensions = $10,
      weight = $11,
      guild = $12,
      description = $13,
      symbolism = $14,
      images = $15,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *`,
    [
      id,
      item.sku,
      item.title,
      item.category,
      item.priceGhs,
      item.stockQty,
      item.published,
      item.origin,
      item.material,
      item.dimensions,
      item.weight,
      item.guild,
      item.description,
      item.symbolism,
      JSON.stringify(item.images || [])
    ]
  );
  return res.rows.length ? formatRowToProduct(res.rows[0]) : null;
}

async function updateStock(id, newStock) {
  const res = await pool.query(
    'UPDATE products SET stock_qty = $2, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id, Math.max(0, newStock)]
  );
  return res.rows.length ? formatRowToProduct(res.rows[0]) : null;
}

async function togglePublish(id) {
  const res = await pool.query(
    'UPDATE products SET published = NOT published, updated_at = NOW() WHERE id = $1 RETURNING *',
    [id]
  );
  return res.rows.length ? formatRowToProduct(res.rows[0]) : null;
}

async function deleteProduct(id) {
  const res = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
  return res.rows.length ? formatRowToProduct(res.rows[0]) : null;
}

async function resetProducts() {
  await pool.query('TRUNCATE TABLE products');
  for (const item of SEED_PRODUCTS) {
    await pool.query(
      `INSERT INTO products (
        id, sku, title, category, price_ghs, stock_qty, published, origin,
        material, dimensions, weight, guild, description, symbolism, images
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        item.id,
        item.sku,
        item.title,
        item.category,
        item.price_ghs,
        item.stock_qty,
        item.published,
        item.origin,
        item.material,
        item.dimensions,
        item.weight,
        item.guild,
        item.description,
        item.symbolism,
        JSON.stringify(item.images)
      ]
    );
  }
  return getAllProducts();
}

module.exports = {
  pool,
  initDb,
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateStock,
  togglePublish,
  deleteProduct,
  resetProducts,
  // Admin auth exports
  verifyAdminCredentials,
  getAdminByUsernameOrEmail,
  createAdminUser,
  listAdmins,
  hashPassword,
  verifyPassword,
  // Store info exports
  getStoreInfo,
  updateStoreInfo
};
