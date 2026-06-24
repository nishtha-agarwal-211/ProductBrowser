/**
 * Express Application Setup
 * 
 * Configures middleware, routes, and error handling.
 * Separated from server.js to allow supertest to import
 * the app without starting the server.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const productRoutes = require('./routes/products');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Middleware ──────────────────────────────────────────────

// CORS — allow frontend on any origin during development
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || true
    : true,
  methods: ['GET'],
  maxAge: 86400, // Cache preflight for 24h
}));

// Parse JSON request bodies
app.use(express.json());

// Request logging (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const color = status >= 400 ? '\x1b[31m' : '\x1b[32m';
      console.log(`${color}${req.method}\x1b[0m ${req.originalUrl} → ${status} (${duration}ms)`);
    });
    next();
  });
}

// ── Serve Frontend Static Files ────────────────────────────
// In production, serve the built React frontend
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// ── API Routes ─────────────────────────────────────────────
app.use('/api/products', productRoutes);

// GET /api/categories — convenience alias (also available at /api/products/categories)
app.get('/api/categories', async (req, res, next) => {
  try {
    const productService = require('./services/productService');
    const categories = await productService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ── Catch-all: serve frontend for client-side routing ──────
app.get('*', (req, res, next) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      error: 'Endpoint not found',
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  }

  const indexPath = path.join(clientBuildPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      // Frontend not built yet — return a helpful message
      res.status(200).json({
        message: 'API is running. Frontend not built yet.',
        api: {
          products: '/api/products',
          categories: '/api/categories',
          health: '/api/health',
        },
      });
    }
  });
});

// ── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);

module.exports = app;
