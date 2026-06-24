/**
 * Unit Tests — Product Service
 * 
 * Tests the core pagination logic functions: buildCursorCondition and buildOrderBy.
 * These are pure functions that don't require a database connection.
 */

const { buildCursorCondition, buildOrderBy } = require('../../src/services/productService');

describe('Product Service — Pagination Logic', () => {
  // ── buildOrderBy ─────────────────────────────────────────

  describe('buildOrderBy', () => {
    it('returns DESC order for "newest"', () => {
      expect(buildOrderBy('newest')).toBe('created_at DESC, id DESC');
    });

    it('returns ASC order for "oldest"', () => {
      expect(buildOrderBy('oldest')).toBe('created_at ASC, id ASC');
    });

    it('returns price ASC for "price-asc"', () => {
      expect(buildOrderBy('price-asc')).toBe('price ASC, id ASC');
    });

    it('returns price DESC for "price-desc"', () => {
      expect(buildOrderBy('price-desc')).toBe('price DESC, id DESC');
    });

    it('defaults to newest for unknown sort', () => {
      expect(buildOrderBy('invalid')).toBe('created_at DESC, id DESC');
    });

    it('defaults to newest for undefined', () => {
      expect(buildOrderBy(undefined)).toBe('created_at DESC, id DESC');
    });
  });

  // ── buildCursorCondition ─────────────────────────────────

  describe('buildCursorCondition', () => {
    it('builds correct condition for "newest" sort', () => {
      const cursor = { created_at: '2024-06-20T10:00:00.000Z', id: 42 };
      const result = buildCursorCondition(cursor, 'newest', 1);

      expect(result.sql).toBe('(created_at < $1 OR (created_at = $1 AND id < $2))');
      expect(result.params).toEqual(['2024-06-20T10:00:00.000Z', 42]);
    });

    it('builds correct condition for "oldest" sort (ASC)', () => {
      const cursor = { created_at: '2024-01-01T00:00:00.000Z', id: 10 };
      const result = buildCursorCondition(cursor, 'oldest', 1);

      expect(result.sql).toBe('(created_at > $1 OR (created_at = $1 AND id > $2))');
      expect(result.params).toEqual(['2024-01-01T00:00:00.000Z', 10]);
    });

    it('builds correct condition for "price-asc"', () => {
      const cursor = { price: 29.99, id: 55 };
      const result = buildCursorCondition(cursor, 'price-asc', 1);

      expect(result.sql).toBe('(price > $1 OR (price = $1 AND id > $2))');
      expect(result.params).toEqual([29.99, 55]);
    });

    it('builds correct condition for "price-desc"', () => {
      const cursor = { price: 499.00, id: 77 };
      const result = buildCursorCondition(cursor, 'price-desc', 1);

      expect(result.sql).toBe('(price < $1 OR (price = $1 AND id < $2))');
      expect(result.params).toEqual([499.00, 77]);
    });

    it('uses correct parameter indexes when starting from higher index', () => {
      // When category filter is applied, params start at $2 (category is $1)
      const cursor = { created_at: '2024-06-20T10:00:00.000Z', id: 42 };
      const result = buildCursorCondition(cursor, 'newest', 3);

      expect(result.sql).toBe('(created_at < $3 OR (created_at = $3 AND id < $4))');
      expect(result.params).toEqual(['2024-06-20T10:00:00.000Z', 42]);
    });

    it('defaults to newest for unknown sort mode', () => {
      const cursor = { created_at: '2024-06-20T10:00:00.000Z', id: 42 };
      const result = buildCursorCondition(cursor, 'unknown', 1);

      expect(result.sql).toBe('(created_at < $1 OR (created_at = $1 AND id < $2))');
    });
  });

  // ── Composite Key Correctness ────────────────────────────

  describe('Composite Key Logic', () => {
    it('ensures tiebreaking with ID when timestamps match', () => {
      // This validates that the SQL correctly handles products 
      // with identical created_at values by using id as tiebreaker
      const cursor = { created_at: '2024-06-20T10:00:00.000Z', id: 50 };
      const result = buildCursorCondition(cursor, 'newest', 1);

      // The OR condition ensures:
      // 1. created_at < cursor_ts: products before cursor timestamp
      // 2. created_at = cursor_ts AND id < cursor_id: same timestamp, lower id
      expect(result.sql).toContain('OR');
      expect(result.sql).toContain('AND id <');
    });

    it('uses > for ascending sorts', () => {
      const cursor = { price: 10.00, id: 1 };
      const result = buildCursorCondition(cursor, 'price-asc', 1);

      // For ascending, we want "after" the cursor = greater than
      expect(result.sql).toContain('price > $1');
      expect(result.sql).toContain('id > $2');
    });
  });
});
