/**
 * Integration Tests — Product API Endpoints
 * 
 * Tests the full request/response cycle using supertest.
 * Requires a running PostgreSQL database with seeded data.
 * 
 * Run: npm run test:integration
 * 
 * Note: These tests require DATABASE_URL to be set and the
 * database to be migrated and seeded. They test against real
 * data to verify cursor pagination correctness.
 */

const request = require('supertest');
const app = require('../../src/app');
const { close } = require('../../src/db/connection');

// Clean up database connections after all tests
afterAll(async () => {
  await close();
});

describe('GET /api/products', () => {
  // ── Basic Pagination ─────────────────────────────────────

  it('returns 20 products by default', async () => {
    const res = await request(app).get('/api/products');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(20);
    expect(res.body.pagination.count).toBe(20);
    expect(res.body.pagination.hasMore).toBe(true);
    expect(res.body.pagination.cursor).toBeTruthy();
  });

  it('respects custom limit', async () => {
    const res = await request(app).get('/api/products?limit=5');
    
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(5);
    expect(res.body.pagination.count).toBe(5);
  });

  it('returns products sorted by newest first by default', async () => {
    const res = await request(app).get('/api/products?limit=10');
    const products = res.body.data;

    // Verify descending order by created_at
    for (let i = 0; i < products.length - 1; i++) {
      const current = new Date(products[i].created_at);
      const next = new Date(products[i + 1].created_at);
      expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }
  });

  // ── Cursor Pagination ────────────────────────────────────

  it('follows cursor to get next page', async () => {
    const page1 = await request(app).get('/api/products?limit=10');
    expect(page1.body.pagination.cursor).toBeTruthy();

    const page2 = await request(app)
      .get(`/api/products?limit=10&cursor=${page1.body.pagination.cursor}`);
    
    expect(page2.status).toBe(200);
    expect(page2.body.data).toHaveLength(10);
  });

  it('never returns duplicate products across pages', async () => {
    const seenIds = new Set();

    // Fetch 5 pages of 20 products each
    let cursor = null;
    for (let page = 0; page < 5; page++) {
      const url = cursor
        ? `/api/products?limit=20&cursor=${cursor}`
        : '/api/products?limit=20';
      
      const res = await request(app).get(url);
      expect(res.status).toBe(200);

      for (const product of res.body.data) {
        // This is the critical data consistency check:
        // No product ID should appear more than once across pages
        expect(seenIds.has(product.id)).toBe(false);
        seenIds.add(product.id);
      }

      cursor = res.body.pagination.cursor;
      if (!res.body.pagination.hasMore) break;
    }

    // We should have fetched 100 unique products
    expect(seenIds.size).toBe(100);
  });

  // ── Category Filtering ───────────────────────────────────

  it('filters by category', async () => {
    const res = await request(app).get('/api/products?category=electronics&limit=10');
    
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    
    // Every product should be in the electronics category
    for (const product of res.body.data) {
      expect(product.category).toBe('electronics');
    }

    expect(res.body.meta.category).toBe('electronics');
  });

  it('cursor pagination works within a category', async () => {
    const page1 = await request(app)
      .get('/api/products?category=books&limit=10');
    
    const page2 = await request(app)
      .get(`/api/products?category=books&limit=10&cursor=${page1.body.pagination.cursor}`);
    
    expect(page2.status).toBe(200);
    
    // All products should be books
    for (const product of page2.body.data) {
      expect(product.category).toBe('books');
    }

    // No overlap between pages
    const page1Ids = new Set(page1.body.data.map(p => p.id));
    for (const product of page2.body.data) {
      expect(page1Ids.has(product.id)).toBe(false);
    }
  });

  // ── Sort Modes ───────────────────────────────────────────

  it('sorts by oldest first', async () => {
    const res = await request(app).get('/api/products?sortBy=oldest&limit=10');
    const products = res.body.data;

    for (let i = 0; i < products.length - 1; i++) {
      const current = new Date(products[i].created_at);
      const next = new Date(products[i + 1].created_at);
      expect(current.getTime()).toBeLessThanOrEqual(next.getTime());
    }
  });

  it('sorts by price ascending', async () => {
    const res = await request(app).get('/api/products?sortBy=price-asc&limit=10');
    const products = res.body.data;

    for (let i = 0; i < products.length - 1; i++) {
      expect(products[i].price).toBeLessThanOrEqual(products[i + 1].price);
    }
  });

  it('sorts by price descending', async () => {
    const res = await request(app).get('/api/products?sortBy=price-desc&limit=10');
    const products = res.body.data;

    for (let i = 0; i < products.length - 1; i++) {
      expect(products[i].price).toBeGreaterThanOrEqual(products[i + 1].price);
    }
  });

  // ── Product Data Shape ───────────────────────────────────

  it('returns complete product data', async () => {
    const res = await request(app).get('/api/products?limit=1');
    const product = res.body.data[0];

    expect(product).toHaveProperty('id');
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('category');
    expect(product).toHaveProperty('price');
    expect(product).toHaveProperty('created_at');
    expect(product).toHaveProperty('updated_at');

    expect(typeof product.id).toBe('number');
    expect(typeof product.name).toBe('string');
    expect(typeof product.price).toBe('number');
    expect(product.price).toBeGreaterThan(0);
  });

  // ── Validation Errors ────────────────────────────────────

  it('rejects invalid category', async () => {
    const res = await request(app).get('/api/products?category=invalid');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_CATEGORY');
  });

  it('rejects invalid sortBy', async () => {
    const res = await request(app).get('/api/products?sortBy=invalid');
    
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INVALID_SORT');
  });

  it('rejects limit > 100', async () => {
    const res = await request(app).get('/api/products?limit=200');
    
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('LIMIT_EXCEEDED');
  });

  it('rejects limit < 1', async () => {
    const res = await request(app).get('/api/products?limit=0');
    
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_LIMIT');
  });

  it('rejects malformed cursor', async () => {
    const res = await request(app).get('/api/products?cursor=totally-invalid');
    
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_CURSOR');
  });
});

// ── Product Detail ─────────────────────────────────────────

describe('GET /api/products/:id', () => {
  it('returns a product by ID', async () => {
    // First, get a product ID from the listing
    const listing = await request(app).get('/api/products?limit=1');
    const productId = listing.body.data[0].id;

    const res = await request(app).get(`/api/products/${productId}`);
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(productId);
  });

  it('returns 404 for non-existent product', async () => {
    const res = await request(app).get('/api/products/999999999');
    
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });

  it('rejects invalid product ID', async () => {
    const res = await request(app).get('/api/products/abc');
    
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_ID');
  });
});

// ── Categories ─────────────────────────────────────────────

describe('GET /api/categories', () => {
  it('returns an array of categories', async () => {
    const res = await request(app).get('/api/categories');
    
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('includes expected categories', async () => {
    const res = await request(app).get('/api/categories');
    
    expect(res.body.data).toContain('electronics');
    expect(res.body.data).toContain('clothing');
    expect(res.body.data).toContain('home');
    expect(res.body.data).toContain('books');
    expect(res.body.data).toContain('sports');
  });
});

// ── Health Check ───────────────────────────────────────────

describe('GET /api/health', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/api/health');
    
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeTruthy();
  });
});
