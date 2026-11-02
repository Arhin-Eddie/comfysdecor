require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');
const r2 = require('./r2');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'comfy2026';
const AUTH_SECRET = process.env.AUTH_SECRET || 'cda-secret-auth-salt-key-9821';

// Token generation & verification using HMAC-SHA256
function generateAdminToken(admin = {}) {
  const payload = {
    id: admin.id || 'admin-001',
    username: admin.username || 'admin',
    role: admin.role || 'admin',
    time: Date.now()
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', AUTH_SECRET).update(data).digest('base64url');
  try {
    const isSigMatch = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    if (isSigMatch) {
      const payload = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
      // Valid for 30 days
      if (Date.now() - payload.time < 30 * 24 * 60 * 60 * 1000) {
        return payload;
      }
    }
  } catch (_) {
    return null;
  }
  return null;
}

// Authentication middleware to lock down admin routes
function requireAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Admin authentication required.' });
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Invalid or expired admin session. Please log in.' });
  }
  req.adminUser = payload;
  next();
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lazy DB initialization helper (critical for Vercel serverless functions & local dev)
let isDbInitialized = false;
let dbInitPromise = null;

async function ensureDbReady() {
  if (isDbInitialized) return;
  if (!dbInitPromise) {
    dbInitPromise = db.initDb()
      .then(() => {
        isDbInitialized = true;
      })
      .catch((err) => {
        dbInitPromise = null;
        console.error('Failed to initialize Neon PostgreSQL database:', err);
      });
  }
  await dbInitPromise;
}

// Middleware ensuring Neon DB schema is ready before API handling
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/sitemap.xml') {
    try {
      await ensureDbReady();
    } catch (err) {
      console.warn('Database readiness check warning:', err.message);
    }
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString(), database: 'Neon PostgreSQL' });
});

// Production SEO: Dynamic XML Sitemap (Includes live Neon database products & images)
function escapeXml(unsafe) {
  return String(unsafe || '').replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

app.get('/sitemap.xml', async (req, res) => {
  try {
    const host = req.get('host') || 'comfysdecor.com';
    const proto = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = `${proto}://${host}`;
    const products = await db.getAllProducts();

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

    // Homepage
    xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${new Date().toISOString().slice(0, 10)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n`;
    xml += `    <image:image>\n      <image:loc>${baseUrl}/assets/comfys_flyer.png</image:loc>\n      <image:title>Comfy's Decor Accessories</image:title>\n    </image:image>\n  </url>\n`;

    // Category Anchors
    const categories = ['living-room', 'kitchen', 'office', 'sculptures', 'vases', 'tabletop', 'lighting', 'wall-decor'];
    for (const cat of categories) {
      xml += `  <url>\n    <loc>${baseUrl}/#${cat}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }

    // Individual Products
    if (Array.isArray(products)) {
      for (const p of products) {
        if (p.published) {
          xml += `  <url>\n    <loc>${baseUrl}/#product-${p.id}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n`;
          if (p.images && p.images.length > 0) {
            const imgUrl = p.images[0].startsWith('http') ? p.images[0] : `${baseUrl}${p.images[0]}`;
            xml += `    <image:image>\n      <image:loc>${escapeXml(imgUrl)}</image:loc>\n      <image:title>${escapeXml(p.title)}</image:title>\n    </image:image>\n`;
          }
          xml += `  </url>\n`;
        }
      }
    }

    xml += '</urlset>';
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.sendFile(path.join(__dirname, 'sitemap.xml'));
  }
});

app.get('/robots.txt', (req, res) => {
  res.sendFile(path.join(__dirname, 'robots.txt'));
});

// Serve static assets and static files
app.use(express.static(path.join(__dirname)));

// Admin Authentication Endpoints (Verified directly against Neon PostgreSQL)
app.post('/api/admin/login', async (req, res) => {
  const { username, email, password } = req.body || {};
  const identifier = username || email || 'admin';
  if (!password) {
    return res.status(400).json({ success: false, error: 'Admin password is required.' });
  }

  try {
    const admin = await db.verifyAdminCredentials(identifier, password);
    if (admin) {
      const token = generateAdminToken(admin);
      return res.json({
        success: true,
        token,
        user: {
          id: admin.id,
          username: admin.username,
          email: admin.email,
          fullName: admin.fullName,
          role: admin.role,
          lastLogin: admin.lastLogin
        }
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid username or password. Access denied.' });
    }
  } catch (err) {
    console.error('Error verifying admin credentials in Neon DB:', err);
    return res.status(500).json({ success: false, error: 'Database authentication error.' });
  }
});

app.get('/api/admin/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, valid: false });
  }
  const token = authHeader.slice(7).trim();
  const payload = verifyAdminToken(token);
  if (payload) {
    return res.json({ success: true, valid: true, user: payload });
  }
  return res.status(401).json({ success: false, valid: false });
});

app.get('/api/admin/profile', requireAdminAuth, (req, res) => {
  res.json({ success: true, user: req.adminUser });
});

// API: Get store info & contact details (Public storefront access)
app.get('/api/store-info', async (req, res) => {
  try {
    const info = await db.getStoreInfo();
    res.json({ success: true, data: info });
  } catch (err) {
    console.error('Error fetching store info:', err);
    res.status(500).json({ success: false, error: 'Database error fetching store info' });
  }
});

// API: Update store info & contact details (Protected Admin Only)
app.put('/api/store-info', requireAdminAuth, async (req, res) => {
  try {
    const updated = await db.updateStoreInfo(req.body);
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating store info:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error updating store info' });
  }
});

// Public Image Stream Route from Cloudflare R2
app.get('/api/media/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const r2Obj = await r2.getImageObject(key);
    if (!r2Obj || !r2Obj.Body) {
      return res.status(404).send('Image not found in storage');
    }
    res.setHeader('Content-Type', r2Obj.ContentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    r2Obj.Body.pipe(res);
  } catch (err) {
    res.status(404).send('Image not found');
  }
});

// API: Cloudflare R2 Image Upload & Storage Status (Admin Only)
app.get('/api/storage/status', (req, res) => {
  res.json({
    success: true,
    r2Configured: r2.isR2Configured(),
    bucket: process.env.R2_BUCKET_NAME || null,
    storageType: r2.isR2Configured() ? 'Cloudflare R2' : 'Local Fallback (/assets/uploads)'
  });
});

app.post('/api/upload', requireAdminAuth, async (req, res) => {
  try {
    const { imageBase64, filename, contentType } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: 'imageBase64 data is required' });
    }

    let mimeType = contentType || 'image/jpeg';
    let base64Clean = imageBase64;
    const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      base64Clean = match[2];
    }

    const buffer = Buffer.from(base64Clean, 'base64');
    if (buffer.length > 15 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Image size exceeds maximum 15MB limit' });
    }

    const result = await r2.uploadImage(buffer, filename || 'product-image.jpg', mimeType);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Upload handler error:', err);
    res.status(500).json({ success: false, error: err.message || 'Image upload error' });
  }
});

// API: Get all products (Public storefront access)
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getAllProducts();
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ success: false, error: 'Database error fetching products' });
  }
});

// API: Get single product (Public storefront access)
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ success: false, error: 'Database error fetching product' });
  }
});

// ==========================================
// PROTECTED MUTATING ENDPOINTS (ADMIN ONLY)
// ==========================================

// API: Create new product
app.post('/api/products', requireAdminAuth, async (req, res) => {
  try {
    const created = await db.createProduct(req.body);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    console.error('Error creating product:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error creating product' });
  }
});

// API: Update product
app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error updating product' });
  }
});

// API: Adjust stock
app.patch('/api/products/:id/stock', requireAdminAuth, async (req, res) => {
  try {
    const { stockQty } = req.body;
    const updated = await db.updateStock(req.params.id, stockQty);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ success: false, error: 'Database error updating stock' });
  }
});

// API: Toggle publish
app.patch('/api/products/:id/publish', requireAdminAuth, async (req, res) => {
  try {
    const updated = await db.togglePublish(req.params.id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: updated });
  } catch (err) {
    console.error('Error toggling publish:', err);
    res.status(500).json({ success: false, error: 'Database error toggling publish status' });
  }
});

// API: Delete product
app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const deleted = await db.deleteProduct(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: deleted });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ success: false, error: 'Database error deleting product' });
  }
});

// API: Reset products to seed
app.post('/api/products/reset', requireAdminAuth, async (req, res) => {
  try {
    const resetList = await db.resetProducts();
    res.json({ success: true, count: resetList.length, data: resetList });
  } catch (err) {
    console.error('Error resetting products:', err);
    res.status(500).json({ success: false, error: 'Database error resetting products' });
  }
});

// API: Import JSON products
app.post('/api/products/import', requireAdminAuth, async (req, res) => {
  try {
    const items = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, error: 'Expected array of items' });
    }
    // Wipe and re-import
    await db.pool.query('TRUNCATE TABLE products');
    for (const item of items) {
      await db.createProduct(item);
    }
    const all = await db.getAllProducts();
    res.json({ success: true, count: all.length, data: all });
  } catch (err) {
    console.error('Error importing products:', err);
    res.status(500).json({ success: false, error: err.message || 'Database error importing' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Export app for Vercel Serverless Functions
module.exports = app;

// Start server if executed directly (e.g. npm start / node server.js / Render / Railway)
if (require.main === module) {
  ensureDbReady()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Comfy's Decor Accessories running at http://localhost:${PORT}`);
        console.log('Connected to Neon PostgreSQL database.');
      });
    })
    .catch((err) => {
      console.error('Failed to initialize Neon PostgreSQL database:', err);
      process.exit(1);
    });
}
