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
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
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

// ── Rate Limiting ──────────────────────────────────────────
// Prevent abuse and protect free tier resources (Render, Neon)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // limit each IP to 100 requests per windowMs
  standardHeaders: true,     // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false,      // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
    statusCode: 429,
  },
});
app.use('/api/', apiLimiter);

// ── Structured Request Logging ─────────────────────────────
// Uses Winston for structured, leveled logging (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const logData = {
        method: req.method,
        url: req.originalUrl,
        status,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
      };

      if (status >= 400) {
        logger.warn('Request failed', logData);
      } else {
        logger.info('Request completed', logData);
      }
    });
    next();
  });
}

// ── Serve Frontend Static Files ────────────────────────────
// In production, serve the built React frontend
const clientBuildPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

// ── API Routes ─────────────────────────────────────────────
// Versioned routes (v1) — recommended for future compatibility
app.use('/api/v1/products', productRoutes);

// Backward-compatible unversioned routes (alias to v1)
app.use('/api/products', productRoutes);

// GET /api/v1/categories — convenience alias
app.get('/api/v1/categories', async (req, res, next) => {
  try {
    const productService = require('./services/productService');
    const categories = await productService.getCategories();
    res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
});

// GET /api/categories — backward-compatible unversioned alias
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
    version: 'v1',
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
          products: '/api/v1/products',
          categories: '/api/v1/categories',
          health: '/api/health',
        },
      });
    }
  });
});

// ── Error Handler (must be last) ───────────────────────────
app.use(errorHandler);

module.exports = app;
