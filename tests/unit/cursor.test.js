/**
 * Unit Tests — Cursor Utilities
 * 
 * Tests encoding/decoding of pagination cursors across all sort modes.
 */

const { encodeCursor, decodeCursor } = require('../../src/utils/cursor');

describe('Cursor Utilities', () => {
  // ── encodeCursor ─────────────────────────────────────────

  describe('encodeCursor', () => {
    it('encodes a cursor for "newest" sort', () => {
      const record = {
        id: 42,
        name: 'Test Product',
        price: 99.99,
        created_at: '2024-06-20T10:30:00.000Z',
      };

      const cursor = encodeCursor(record, 'newest');
      expect(typeof cursor).toBe('string');
      expect(cursor.length).toBeGreaterThan(0);

      // Verify it decodes correctly
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe(42);
      expect(decoded.created_at).toBe('2024-06-20T10:30:00.000Z');
      expect(decoded.sortBy).toBe('newest');
    });

    it('encodes a cursor for "oldest" sort', () => {
      const record = {
        id: 100,
        created_at: '2024-01-01T00:00:00.000Z',
      };

      const cursor = encodeCursor(record, 'oldest');
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe(100);
      expect(decoded.sortBy).toBe('oldest');
    });

    it('encodes a cursor for "price-asc" sort (includes price)', () => {
      const record = {
        id: 55,
        price: 29.99,
        created_at: '2024-06-15T08:00:00.000Z',
      };

      const cursor = encodeCursor(record, 'price-asc');
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe(55);
      expect(decoded.price).toBe(29.99);
      expect(decoded.created_at).toBe('2024-06-15T08:00:00.000Z');
      expect(decoded.sortBy).toBe('price-asc');
    });

    it('encodes a cursor for "price-desc" sort', () => {
      const record = {
        id: 77,
        price: 499.00,
        created_at: '2024-03-10T12:00:00.000Z',
      };

      const cursor = encodeCursor(record, 'price-desc');
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe(77);
      expect(decoded.price).toBe(499.00);
      expect(decoded.sortBy).toBe('price-desc');
    });
  });

  // ── decodeCursor ─────────────────────────────────────────

  describe('decodeCursor', () => {
    it('returns null for null input', () => {
      expect(decodeCursor(null)).toBeNull();
    });

    it('returns null for undefined input', () => {
      expect(decodeCursor(undefined)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(decodeCursor('')).toBeNull();
    });

    it('returns null for invalid base64', () => {
      expect(decodeCursor('not-valid-base64!!!')).toBeNull();
    });

    it('returns null for valid base64 but invalid JSON', () => {
      const invalidJson = Buffer.from('not json').toString('base64');
      expect(decodeCursor(invalidJson)).toBeNull();
    });

    it('returns null for missing id field', () => {
      const noId = Buffer.from(JSON.stringify({
        created_at: '2024-06-20T10:00:00.000Z',
        sortBy: 'newest',
      })).toString('base64');
      expect(decodeCursor(noId)).toBeNull();
    });

    it('returns null for non-numeric id', () => {
      const stringId = Buffer.from(JSON.stringify({
        id: 'abc',
        created_at: '2024-06-20T10:00:00.000Z',
        sortBy: 'newest',
      })).toString('base64');
      expect(decodeCursor(stringId)).toBeNull();
    });

    it('returns null for missing created_at in time-based sort', () => {
      const noCat = Buffer.from(JSON.stringify({
        id: 1,
        sortBy: 'newest',
      })).toString('base64');
      expect(decodeCursor(noCat)).toBeNull();
    });

    it('returns null for missing price in price-based sort', () => {
      const noPrice = Buffer.from(JSON.stringify({
        id: 1,
        created_at: '2024-06-20T10:00:00.000Z',
        sortBy: 'price-asc',
      })).toString('base64');
      expect(decodeCursor(noPrice)).toBeNull();
    });

    it('returns null for invalid date', () => {
      const badDate = Buffer.from(JSON.stringify({
        id: 1,
        created_at: 'not-a-date',
        sortBy: 'newest',
      })).toString('base64');
      expect(decodeCursor(badDate)).toBeNull();
    });

    it('correctly decodes a valid cursor', () => {
      const payload = {
        id: 42,
        created_at: '2024-06-20T10:30:00.000Z',
        sortBy: 'newest',
      };
      const cursor = Buffer.from(JSON.stringify(payload)).toString('base64');
      const decoded = decodeCursor(cursor);

      expect(decoded).toEqual(payload);
    });

    it('round-trips through encode/decode', () => {
      const record = {
        id: 123,
        price: 59.99,
        created_at: '2024-05-15T14:30:00.000Z',
      };

      const encoded = encodeCursor(record, 'price-asc');
      const decoded = decodeCursor(encoded);

      expect(decoded.id).toBe(123);
      expect(decoded.price).toBe(59.99);
      expect(decoded.created_at).toBe('2024-05-15T14:30:00.000Z');
    });
  });

  // ── Edge Cases ───────────────────────────────────────────

  describe('Edge Cases', () => {
    it('handles price of 0 correctly', () => {
      // Price > 0 is enforced by DB constraint, but cursor should handle it
      const record = { id: 1, price: 0, created_at: '2024-01-01T00:00:00.000Z' };
      const cursor = encodeCursor(record, 'price-asc');
      const decoded = decodeCursor(cursor);
      expect(decoded.price).toBe(0);
    });

    it('handles very large IDs', () => {
      const record = { id: 999999999, created_at: '2024-06-20T10:00:00.000Z' };
      const cursor = encodeCursor(record, 'newest');
      const decoded = decodeCursor(cursor);
      expect(decoded.id).toBe(999999999);
    });

    it('prevents SQL injection via cursor', () => {
      // Even if someone crafts a malicious cursor, decoded values are used
      // as parameterized query values ($1, $2), not string-interpolated
      const malicious = Buffer.from(JSON.stringify({
        id: 1,
        created_at: "'; DROP TABLE products; --",
        sortBy: 'newest',
      })).toString('base64');

      // Should return null due to invalid date
      expect(decodeCursor(malicious)).toBeNull();
    });
  });
});
