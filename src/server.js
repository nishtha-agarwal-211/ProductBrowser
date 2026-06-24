/**
 * Server Entry Point
 * 
 * Starts the Express server and handles graceful shutdown.
 * Run: npm start (production) or npm run dev (development with nodemon)
 */

require('dotenv').config();
const app = require('./app');
const { close } = require('./db/connection');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 CodeVector API Server started`, {
    port: PORT,
    mode: process.env.NODE_ENV || 'development',
    endpoints: [
      'GET /api/v1/products       Product listing',
      'GET /api/v1/products/:id   Product detail',
      'GET /api/v1/categories     Category list',
      'GET /api/health            Health check',
    ],
  });
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 CodeVector API Server                   ║
║                                              ║
║   Local:   http://localhost:${PORT}             ║
║   Mode:    ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║                                              ║
║   Endpoints:                                 ║
║   GET /api/v1/products    Product listing    ║
║   GET /api/v1/products/:id Product detail    ║
║   GET /api/v1/categories  Category list      ║
║   GET /api/health         Health check       ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ──────────────────────────────────────
// Close database pool and HTTP server on process exit signals
function gracefulShutdown(signal) {
  logger.info(`${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    await close();
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
