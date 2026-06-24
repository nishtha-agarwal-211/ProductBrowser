/**
 * Product Service — Core Pagination Logic
 * 
 * Implements keyset (cursor-based) pagination for browsing 200K+ products.
 * 
 * ═══════════════════════════════════════════════════════════════
 * WHY KEYSET PAGINATION?
 * ═══════════════════════════════════════════════════════════════
 * 
 * OFFSET-based pagination (SELECT ... LIMIT 20 OFFSET 100) breaks
 * when data changes between page requests:
 * 
 *   1. User fetches page 1 (products 1-20)
 *   2. 50 new products are inserted (newest first)
 *   3. User fetches page 2 with OFFSET 20
 *   4. OFFSET 20 now points to products that WERE on page 1 → DUPLICATES
 * 
 * KEYSET pagination avoids this by using the last seen record's values
 * as the starting point for the next page. Since we query "everything
 * after this specific record," new inserts before that point don't
 * shift the window.
 * 
 * ═══════════════════════════════════════════════════════════════
 * COMPOSITE KEY: (sort_field, id)
 * ═══════════════════════════════════════════════════════════════
 * 
 * Using created_at alone as the cursor would fail if multiple products
 * share the same timestamp. By adding `id` as a tiebreaker, we get
 * a guaranteed-unique sort order:
 * 
 *   WHERE (created_at, id) < ($cursor_timestamp, $cursor_id)
 *   ORDER BY created_at DESC, id DESC
 * 
 * This is equivalent to SQL row-value comparison:
 *   WHERE (created_at < $ts) OR (created_at = $ts AND id < $id)
 * 
 * ═══════════════════════════════════════════════════════════════
 */

const { query } = require('../db/connection');
const { encodeCursor } = require('../utils/cursor');

/**
 * Fetch a paginated list of products with optional category filter.
 * 
 * Algorithm:
 * 1. Parse cursor (or null for first page)
 * 2. Build WHERE clause based on sort mode and cursor
 * 3. Fetch limit + 1 records (extra record tells us if there's a next page)
 * 4. Return first `limit` records + encoded cursor for next page
 * 
 * @param {Object} options
 * @param {string|null} options.category - Category filter (null = all)
 * @param {Object|null} options.cursor - Decoded cursor from previous page
 * @param {number} options.limit - Number of products per page (1-100)
 * @param {string} options.sortBy - Sort mode: 'newest', 'oldest', 'price-asc', 'price-desc'
 * @returns {Promise<Object>} { products, pagination, meta }
 */
async function listProducts({ category, cursor, limit, sortBy }) {
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  // ── Category filter ──────────────────────────────────────
  if (category) {
    conditions.push(`category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  // ── Cursor condition ─────────────────────────────────────
  // Build the keyset WHERE clause based on sort mode.
  // Uses row-value comparison: (sort_field, id) < (cursor_value, cursor_id)
  if (cursor) {
    const cursorCondition = buildCursorCondition(cursor, sortBy, paramIndex);
    conditions.push(cursorCondition.sql);
    params.push(...cursorCondition.params);
    paramIndex += cursorCondition.params.length;
  }

  // ── Build the ORDER BY clause ────────────────────────────
  const orderBy = buildOrderBy(sortBy);

  // ── Assemble query ───────────────────────────────────────
  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  // Fetch limit + 1 to determine if there are more pages
  const sql = `
    SELECT id, name, category, price, created_at, updated_at
    FROM products
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex}
  `;
  params.push(limit + 1);

  const result = await query(sql, params);
  const rows = result.rows;

  // ── Determine hasMore and build next cursor ──────────────
  const hasMore = rows.length > limit;
  const products = hasMore ? rows.slice(0, limit) : rows;

  // Format prices as numbers (pg returns strings for DECIMAL)
  for (const product of products) {
    product.price = parseFloat(product.price);
  }

  // Build next cursor from the last product on this page
  const nextCursor = hasMore && products.length > 0
    ? encodeCursor(products[products.length - 1], sortBy)
    : null;

  // ── Get total estimate (O(1) using pg_class) ─────────────
  const totalEstimate = await getEstimatedCount(category);

  return {
    products,
    pagination: {
      cursor: nextCursor,
      hasMore,
      count: products.length,
      totalEstimate,
    },
    meta: {
      category: category || 'all',
      sortBy,
    },
  };
}

/**
 * Build the cursor WHERE condition for keyset pagination.
 * 
 * For "newest" sort (created_at DESC, id DESC):
 *   (created_at < $cursor_ts) OR (created_at = $cursor_ts AND id < $cursor_id)
 * 
 * For "price-asc" sort (price ASC, id ASC):
 *   (price > $cursor_price) OR (price = $cursor_price AND id > $cursor_id)
 * 
 * @param {Object} cursor - Decoded cursor payload
 * @param {string} sortBy - Current sort mode
 * @param {number} startParamIndex - Starting $N index for params
 * @returns {{ sql: string, params: Array }}
 */
function buildCursorCondition(cursor, sortBy, startParamIndex) {
  let i = startParamIndex;

  switch (sortBy) {
    case 'newest':
      // (created_at < $ts) OR (created_at = $ts AND id < $id)
      return {
        sql: `(created_at < $${i} OR (created_at = $${i} AND id < $${i + 1}))`,
        params: [cursor.created_at, cursor.id],
      };

    case 'oldest':
      // (created_at > $ts) OR (created_at = $ts AND id > $id)
      return {
        sql: `(created_at > $${i} OR (created_at = $${i} AND id > $${i + 1}))`,
        params: [cursor.created_at, cursor.id],
      };

    case 'price-asc':
      // (price > $price) OR (price = $price AND id > $id)
      return {
        sql: `(price > $${i} OR (price = $${i} AND id > $${i + 1}))`,
        params: [cursor.price, cursor.id],
      };

    case 'price-desc':
      // (price < $price) OR (price = $price AND id < $id)
      return {
        sql: `(price < $${i} OR (price = $${i} AND id < $${i + 1}))`,
        params: [cursor.price, cursor.id],
      };

    default:
      return {
        sql: `(created_at < $${i} OR (created_at = $${i} AND id < $${i + 1}))`,
        params: [cursor.created_at, cursor.id],
      };
  }
}

/**
 * Build the ORDER BY clause for the given sort mode.
 * Each sort uses a composite key to guarantee deterministic ordering.
 */
function buildOrderBy(sortBy) {
  switch (sortBy) {
    case 'newest':  return 'created_at DESC, id DESC';
    case 'oldest':  return 'created_at ASC, id ASC';
    case 'price-asc':  return 'price ASC, id ASC';
    case 'price-desc': return 'price DESC, id DESC';
    default: return 'created_at DESC, id DESC';
  }
}

/**
 * Get an estimated total count of products.
 * 
 * Uses pg_class.reltuples for O(1) performance instead of COUNT(*).
 * COUNT(*) on 200K rows takes ~50ms; pg_class takes < 1ms.
 * The estimate is updated by VACUUM and ANALYZE, so it's usually
 * accurate within a few percent.
 * 
 * For category-filtered queries, we fall back to a fast COUNT with
 * the category index.
 */
async function getEstimatedCount(category) {
  if (!category) {
    // Use pg_class for total estimate (O(1))
    const result = await query(`
      SELECT reltuples::bigint AS estimate
      FROM pg_class
      WHERE relname = 'products'
    `);
    return result.rows[0]?.estimate || 0;
  }

  // For category-specific counts, use the index (still fast with the index)
  const result = await query(
    'SELECT COUNT(*) AS count FROM products WHERE category = $1',
    [category]
  );
  return parseInt(result.rows[0].count, 10);
}

/**
 * Get a single product by ID.
 * 
 * @param {number} id - Product ID
 * @returns {Promise<Object|null>} Product record or null
 */
async function getProductById(id) {
  const result = await query(
    'SELECT id, name, category, price, created_at, updated_at FROM products WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) return null;

  const product = result.rows[0];
  product.price = parseFloat(product.price);
  return product;
}

/**
 * Get all distinct product categories.
 * 
 * @returns {Promise<string[]>} Array of category names
 */
async function getCategories() {
  const result = await query(
    'SELECT DISTINCT category FROM products ORDER BY category ASC'
  );
  return result.rows.map(row => row.category);
}

module.exports = {
  listProducts,
  getProductById,
  getCategories,
  // Exported for testing
  buildCursorCondition,
  buildOrderBy,
  getEstimatedCount,
};
