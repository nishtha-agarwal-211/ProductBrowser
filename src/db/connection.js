/**
 * Database Connection Pool
 * 
 * Uses pg.Pool for connection pooling to handle concurrent requests efficiently.
 * - Max 20 connections to stay within Neon free tier limits
 * - Idle timeout of 30s to free unused connections
 * - Connection timeout of 5s to fail fast on DB issues
 */

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail if can't connect in 5s
  // Enable SSL for Neon (production) but not for local dev
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : undefined,
});

// Log pool errors (don't crash the server)
pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err.message);
});

/**
 * Execute a parameterized query against the pool.
 * @param {string} text - SQL query with $1, $2, ... placeholders
 * @param {Array} params - Parameter values
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  // Log slow queries (> 200ms) for debugging
  if (duration > 200) {
    console.warn(`Slow query (${duration}ms):`, text.substring(0, 100));
  }

  return result;
};

/**
 * Get a dedicated client from the pool (for transactions).
 * Caller MUST call client.release() when done.
 * @returns {Promise<import('pg').PoolClient>}
 */
const getClient = async () => {
  return pool.connect();
};

/**
 * Gracefully close the connection pool.
 */
const close = async () => {
  await pool.end();
  console.log('Database pool closed.');
};

module.exports = { query, getClient, close, pool };
