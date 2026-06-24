/**
 * Server Entry Point
 * 
 * Starts the Express server and handles graceful shutdown.
 * Run: npm start (production) or npm run dev (development with nodemon)
 */

require('dotenv').config();
const app = require('./app');
const { close } = require('./db/connection');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║                                              ║
║   🚀 CodeVector API Server                   ║
║                                              ║
║   Local:   http://localhost:${PORT}             ║
║   Mode:    ${(process.env.NODE_ENV || 'development').padEnd(30)}║
║                                              ║
║   Endpoints:                                 ║
║   GET /api/products       Product listing    ║
║   GET /api/products/:id   Product detail     ║
║   GET /api/categories     Category list      ║
║   GET /api/health         Health check       ║
║                                              ║
╚══════════════════════════════════════════════╝
  `);
});

// ── Graceful Shutdown ──────────────────────────────────────
// Close database pool and HTTP server on process exit signals
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  server.close(async () => {
    console.log('HTTP server closed.');
    await close();
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
