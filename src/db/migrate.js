/**
 * Database Migration Script
 * 
 * Creates the products table and all required indexes for 
 * efficient keyset (cursor-based) pagination.
 * 
 * Run: npm run migrate
 * 
 * Index Strategy:
 * ─────────────────────────────────────────────────────────
 * 1. idx_products_created_id
 *    → Default pagination (newest first) without category filter
 *    → ORDER BY created_at DESC, id DESC
 * 
 * 2. idx_products_category_created_id  
 *    → Pagination with category filter (most common query)
 *    → WHERE category = ? ORDER BY created_at DESC, id DESC
 * 
 * 3. idx_products_category_price_id
 *    → Price-sorted pagination with category filter
 *    → WHERE category = ? ORDER BY price ASC, id ASC
 * 
 * 4. idx_products_price_id
 *    → Price-sorted pagination without category filter
 *    → ORDER BY price ASC, id ASC
 */

const { query, close } = require('./connection');

const migrate = async () => {
  console.log('🚀 Starting migration...\n');

  try {
    // ── Create products table ──────────────────────────────
    console.log('Creating products table...');
    await query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price DECIMAL(10, 2) NOT NULL CHECK (price > 0),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ Products table created.\n');

    // ── Create indexes ─────────────────────────────────────
    console.log('Creating indexes...');

    // Index 1: Default sort (newest) — no category filter
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_created_id
      ON products (created_at DESC, id DESC);
    `);
    console.log('  ✅ idx_products_created_id');

    // Index 2: Default sort (newest) — with category filter
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_created_id
      ON products (category, created_at DESC, id DESC);
    `);
    console.log('  ✅ idx_products_category_created_id');

    // Index 3: Price sort — with category filter
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_category_price_id
      ON products (category, price ASC, id ASC);
    `);
    console.log('  ✅ idx_products_category_price_id');

    // Index 4: Price sort — no category filter
    await query(`
      CREATE INDEX IF NOT EXISTS idx_products_price_id
      ON products (price ASC, id ASC);
    `);
    console.log('  ✅ idx_products_price_id');

    console.log('\n🎉 Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await close();
  }
};

// Run migration when called directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
