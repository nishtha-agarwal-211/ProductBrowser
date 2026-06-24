# CodeVector — Product Browsing Backend

A high-performance backend system for browsing 200,000+ products with **cursor-based (keyset) pagination** that guarantees zero duplicates and zero gaps, even when data changes during user navigation.

## ✨ Features

- **200K+ Products** — Seeded with realistic, categorized data
- **Cursor-Based Pagination** — Data-consistent browsing (no duplicates/gaps)
- **Category Filtering** — Electronics, Clothing, Home, Books, Sports
- **4 Sort Modes** — Newest, Oldest, Price Low→High, Price High→Low
- **< 100ms Response Time** — Optimized indexes for every query pattern
- **React Frontend** — Dark-themed UI with glassmorphism, grid/list views
- **Comprehensive Tests** — Unit + Integration test suite

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** 14+ (local or [Neon](https://neon.tech) free tier)
- **npm** 9+

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd codevector
npm install
cd client && npm install && cd ..
```

### 2. Configure Database

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your PostgreSQL connection string
# For Neon: postgresql://user:pass@host/dbname?sslmode=require
# For local: postgresql://user:pass@localhost:5432/codevector
```

### 3. Run Migrations

```bash
npm run migrate
```

This creates the `products` table with optimized indexes.

### 4. Seed 200K Products

```bash
npm run seed
```

Inserts 200,000 products in < 5 seconds using batch inserts.

### 5. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 6. Start the Frontend (Development)

```bash
cd client
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies API calls to the backend.

### 7. Build Frontend for Production

```bash
cd client
npm run build
```

The built files are served by the Express backend automatically.

---

## 📡 API Documentation

### List Products (Paginated)

```
GET /api/products
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | — | Filter: `electronics`, `clothing`, `home`, `books`, `sports` |
| `cursor` | string | — | Pagination cursor from previous response |
| `limit` | integer | 20 | Items per page (1–100) |
| `sortBy` | string | `newest` | Sort: `newest`, `oldest`, `price-asc`, `price-desc` |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 42,
      "name": "Wireless Headphones Pro",
      "category": "electronics",
      "price": 129.99,
      "created_at": "2024-06-20T10:30:00.000Z",
      "updated_at": "2024-06-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "cursor": "eyJpZCI6NDIsImNyZWF0ZWRfYXQiOi...",
    "hasMore": true,
    "count": 20,
    "totalEstimate": 200000
  },
  "meta": {
    "category": "electronics",
    "sortBy": "newest"
  }
}
```

### Get Product Detail

```
GET /api/products/:id
```

### List Categories

```
GET /api/categories
```

### Health Check

```
GET /api/health
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│  Category Filter │ Sort │ Grid/List │ Load More  │
└──────────────────┬──────────────────────────────┘
                   │ /api/products?cursor=...
┌──────────────────▼──────────────────────────────┐
│               Express Backend                    │
│  Validation → Controller → Service → DB Query   │
└──────────────────┬──────────────────────────────┘
                   │ Keyset Pagination Query
┌──────────────────▼──────────────────────────────┐
│            PostgreSQL (Neon)                      │
│  200K products │ 4 composite indexes             │
└─────────────────────────────────────────────────┘
```

### Project Structure

```
codevector/
├── src/
│   ├── app.js                    # Express app setup
│   ├── server.js                 # Server entry point
│   ├── db/
│   │   ├── connection.js         # PostgreSQL pool
│   │   └── migrate.js            # Schema + indexes
│   ├── routes/
│   │   └── products.js           # Route definitions
│   ├── controllers/
│   │   └── productController.js  # Request handlers
│   ├── services/
│   │   └── productService.js     # Pagination logic ⭐
│   ├── middleware/
│   │   ├── errorHandler.js       # Error middleware
│   │   └── validateQuery.js      # Input validation
│   └── utils/
│       └── cursor.js             # Cursor encode/decode
├── scripts/
│   └── seed-products.js          # 200K product seeder
├── tests/
│   ├── unit/
│   │   ├── cursor.test.js        # Cursor utility tests
│   │   └── productService.test.js # Pagination logic tests
│   └── integration/
│       └── products.test.js      # Full API tests
├── client/                       # React frontend
│   ├── src/
│   │   ├── App.jsx               # Main app shell
│   │   ├── index.css             # Design system
│   │   ├── api/products.js       # API client
│   │   ├── hooks/useProducts.js  # Data fetching hook
│   │   └── components/
│   │       ├── Header.jsx
│   │       ├── CategoryFilter.jsx
│   │       ├── SortSelector.jsx
│   │       ├── ViewToggle.jsx
│   │       ├── ProductCard.jsx
│   │       ├── ProductGrid.jsx
│   │       ├── LoadMoreButton.jsx
│   │       ├── LoadingState.jsx
│   │       ├── EmptyState.jsx
│   │       └── ErrorState.jsx
│   └── index.html
└── package.json
```

---

## 🔑 Data Consistency: Keyset Pagination

### The Problem with OFFSET Pagination

```sql
-- Page 1: Get products 1-20
SELECT * FROM products ORDER BY created_at DESC LIMIT 20 OFFSET 0;

-- User is viewing page 1...
-- 50 NEW products are inserted!

-- Page 2: Get products 21-40
SELECT * FROM products ORDER BY created_at DESC LIMIT 20 OFFSET 20;
-- ❌ OFFSET 20 now includes products from page 1! → DUPLICATES
```

### How Keyset Pagination Solves It

Instead of saying "skip N rows," we say "get everything after this specific product":

```sql
-- Page 1 (no cursor)
SELECT * FROM products
ORDER BY created_at DESC, id DESC
LIMIT 21;  -- Fetch limit+1 to check hasMore

-- Page 2 (cursor = last item from page 1)
SELECT * FROM products
WHERE (created_at < '2024-06-20T10:25:00Z'
   OR (created_at = '2024-06-20T10:25:00Z' AND id < 41))
ORDER BY created_at DESC, id DESC
LIMIT 21;
```

**Why `(created_at, id)` composite key?**
- `created_at` alone has ties (multiple products same second)
- `id` breaks ties deterministically
- Together they form a unique, sortable cursor

**Result:** Even if 50 new products are inserted between page requests, the cursor points to a specific "position" in the sorted data that never shifts.

---

## ⚡ Performance

### Index Strategy

| Index | Covers | Query Pattern |
|-------|--------|---------------|
| `idx_products_created_id` | Default sort | `ORDER BY created_at DESC, id DESC` |
| `idx_products_category_created_id` | Category + time sort | `WHERE category = ? ORDER BY created_at DESC` |
| `idx_products_category_price_id` | Category + price sort | `WHERE category = ? ORDER BY price ASC` |
| `idx_products_price_id` | Price sort (no filter) | `ORDER BY price ASC, id ASC` |

### Optimizations

- **Connection pooling**: 20 max connections via `pg.Pool`
- **O(1) total count**: Uses `pg_class.reltuples` instead of `COUNT(*)`
- **Batch seeding**: 5,000 rows per INSERT (200K in < 5s)
- **Parameterized queries**: Prevent SQL injection + enable prepared statement caching

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only (no DB required)
npm run test:unit

# Integration tests (requires seeded DB)
npm run test:integration
```

### Test Coverage

- **Cursor utilities**: Encode/decode, validation, edge cases, SQL injection prevention
- **Pagination logic**: All sort modes, parameter indexing, tiebreaking
- **API endpoints**: Pagination, filtering, sorting, validation errors, data consistency
- **Data consistency**: Verifies zero duplicates across 5 sequential pages

---

## 🚀 Deployment

### Backend → Render

1. Create a [Render](https://render.com) account
2. Create a new **Web Service** from your GitHub repo
3. Set environment variables:
   - `DATABASE_URL` → Your Neon connection string
   - `NODE_ENV` → `production`
4. Build command: `npm install && cd client && npm install && npm run build`
5. Start command: `npm start`

### Database → Neon

1. Create a [Neon](https://neon.tech) project (free tier = 0.5 GiB)
2. Copy the connection string
3. Run migrations: `npm run migrate`
4. Run seeder: `npm run seed`

---

## 📝 Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Keyset over OFFSET** | Zero duplicates/gaps during concurrent writes |
| **Base64 JSON cursors** | Debuggable, extensible, supports multiple sort fields |
| **Composite (field, id) key** | Guarantees unique sort order even with timestamp ties |
| **`pg_class` for count** | O(1) vs O(n) — essential at 200K+ scale |
| **Limit+1 strategy** | Avoids a separate COUNT query to determine `hasMore` |
| **PostgreSQL** | ACID compliance, mature indexing, Neon free tier |
| **Vanilla CSS** | Full control, no framework lock-in |

---

## 🔮 Future Improvements

- **Full-text search** — PostgreSQL `tsvector` for product name search
- **Redis caching** — Cache category lists and hot product pages
- **Infinite scroll** — Replace "Load More" with IntersectionObserver
- **Product images** — S3/Cloudinary integration
- **Rate limiting** — Express rate-limit middleware
- **Soft deletes** — `deleted_at` column for data recovery
- **API versioning** — `/api/v1/products` for backward compatibility
- **WebSocket updates** — Real-time product count updates

---

## 📄 License

MIT
