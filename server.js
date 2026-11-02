require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const db = require('./db');

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
app.use(express.static(path.join(__dirname)));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ success: true, timestamp: new Date().toISOString(), database: 'Neon PostgreSQL' });
});

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

// Start server after ensuring DB connection & tables
db.initDb()
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
