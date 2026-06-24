<p align="center">
  <h1 align="center">🛍️ ProductBrowser</h1>
  <p align="center">
    A high-performance full-stack product browsing application built to handle <strong>200,000+ products</strong> with <strong>cursor-based (keyset) pagination</strong> — ensuring zero duplicates and zero gaps, even under concurrent writes.
  </p>
</p>

<p align="center">
  <a href="https://product-browser-beta.vercel.app"><img src="https://img.shields.io/badge/Frontend-Vercel-black?style=for-the-badge&logo=vercel" alt="Frontend on Vercel" /></a>
  <a href="https://productbrowser-ejeh.onrender.com/api/health"><img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render" alt="Backend on Render" /></a>
  <a href="https://neon.tech"><img src="https://img.shields.io/badge/Database-Neon-00E599?style=for-the-badge&logo=postgresql&logoColor=white" alt="Database on Neon" /></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express-4.x-000000?style=flat-square&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat-square&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" />
</p>

---

## 🌐 Live Demo

| Service               | URL                                                                          |
| --------------------- | ---------------------------------------------------------------------------- |
| **🖥️ Frontend**       | [product-browser-beta.vercel.app](https://product-browser-beta.vercel.app)   |
| **⚙️ Backend API**    | [productbrowser-ejeh.onrender.com](https://productbrowser-ejeh.onrender.com) |
| **💚 Health Check**   | [/api/health](https://productbrowser-ejeh.onrender.com/api/health)                 |
| **📦 Products API**   | [/api/v1/products](https://productbrowser-ejeh.onrender.com/api/v1/products)       |
| **📂 Categories API** | [/api/v1/categories](https://productbrowser-ejeh.onrender.com/api/v1/categories)   |

> **Note:** The backend is hosted on Render's free tier, which spins down after inactivity. The first request may take ~30-50 seconds to wake up — subsequent requests are fast (<100ms).

---

## ✨ Features

### Backend

- **200K+ Products** — Seeded with realistic, categorized product data
- **Cursor-Based Pagination** — Data-consistent browsing with zero duplicates/gaps
- **Category Filtering** — Electronics, Clothing, Home, Books, Sports
- **4 Sort Modes** — Newest, Oldest, Price Low→High, Price High→Low
- **< 100ms Response Time** — Optimized composite indexes for every query pattern
- **API Versioning** — `/api/v1/` routes with backward-compatible unversioned aliases
- **Rate Limiting** — 100 requests per 15 minutes per IP via `express-rate-limit`
- **Structured Logging** — Winston logger with JSON output in production, colorized in dev
- **Parameterized Queries** — SQL injection prevention + prepared statement caching
- **Connection Pooling** — 20 max connections, 2s connect timeout, 30s idle timeout
- **Graceful Shutdown** — Clean database disconnect on SIGTERM/SIGINT

### Frontend

- **Dark-Themed UI** — Modern glassmorphism design with gradients
- **Grid & List Views** — Toggle between card grid and detailed list layouts
- **Real-Time Filtering** — Instant category filtering and sort mode switching
- **Load More Pagination** — Smooth cursor-based infinite loading
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Loading & Error States** — Polished skeleton loaders and error handling

### Developer Experience

- **Comprehensive Tests** — Unit + Integration test suite with Jest
- **Load Testing** — Autocannon-based load test verifying 100+ concurrent connections
- **Modular Architecture** — Clean separation of routes, controllers, services, and middleware
- **Auto-Reload** — Nodemon for backend, Vite HMR for frontend

---

## 🏗️ Architecture

```mermaid
graph TD
    %% Styling
    style Frontend fill:#1a1b26,stroke:#7aa2f7,stroke-width:2px,color:#a9b1d6
    style Backend fill:#1a1b26,stroke:#9ece6a,stroke-width:2px,color:#a9b1d6
    style Database fill:#1a1b26,stroke:#f7768e,stroke-width:2px,color:#a9b1d6

    Frontend["🖥️ React Frontend (Vercel)<br/>Category Filter | Sort | Grid/List | Load More"]
    Backend["⚙️ Express Backend (Render)<br/>CORS | Validation | Controller | Service | Query"]
    Database["🗄️ PostgreSQL Database (Neon)<br/>200K Products | 4 Composite Indexes | SSL"]

    Frontend -->|HTTPS /api/products?cursor=...| Backend
    Backend -->|Keyset Pagination SQL| Database
```

### Project Structure

```
ProductBrowser/
├── src/                              # Backend (Node.js + Express)
│   ├── app.js                        # Express app setup, middleware, routes
│   ├── server.js                     # Server entry point, graceful shutdown
│   ├── db/
│   │   ├── connection.js             # PostgreSQL pool (pg.Pool)
│   │   └── migrate.js                # Schema creation + composite indexes
│   ├── routes/
│   │   └── products.js               # Route definitions
│   ├── controllers/
│   │   └── productController.js      # Request handlers
│   ├── services/
│   │   └── productService.js         # Core pagination logic ⭐
│   ├── middleware/
│   │   ├── errorHandler.js           # Centralized error middleware
│   │   └── validateQuery.js          # Input validation & sanitization
│   └── utils/
│       ├── cursor.js                 # Base64 cursor encode/decode
│       └── logger.js                 # Winston structured logger
│
├── client/                           # Frontend (React + Vite)
│   ├── src/
│   │   ├── App.jsx                   # Main app shell
│   │   ├── index.css                 # Design system (CSS variables, glassmorphism)
│   │   ├── api/products.js           # API client with environment-aware base URL
│   │   ├── hooks/useProducts.js      # Custom hook for data fetching + state
│   │   └── components/
│   │       ├── Header.jsx            # App header with product count
│   │       ├── CategoryFilter.jsx    # Category pill buttons
│   │       ├── SortSelector.jsx      # Sort dropdown
│   │       ├── ViewToggle.jsx        # Grid/List view toggle
│   │       ├── ProductCard.jsx       # Product display card
│   │       ├── ProductGrid.jsx       # Responsive product grid/list layout
│   │       ├── LoadMoreButton.jsx    # Cursor-based load more
│   │       ├── LoadingState.jsx      # Skeleton loading placeholders
│   │       ├── EmptyState.jsx        # No results display
│   │       └── ErrorState.jsx        # Error display with retry
│   ├── index.html
│   └── vite.config.js                # Vite config with API proxy
│
├── scripts/
│   ├── seed-products.js              # 200K product seeder (batch inserts)
│   └── load-test.js                  # Autocannon load test (100+ concurrent)
│
├── tests/
│   ├── unit/
│   │   ├── cursor.test.js            # Cursor encode/decode + edge cases
│   │   └── productService.test.js    # Pagination logic + sort modes
│   └── integration/
│       └── products.test.js          # Full API endpoint tests
│
├── .env.example                      # Environment template
├── .gitignore
└── package.json
```

---

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 14+ (local or [Neon](https://neon.tech) free tier)
- **npm** 9+

### 1. Clone & Install

```bash
git clone https://github.com/nishtha-agarwal-211/ProductBrowser.git
cd ProductBrowser
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL connection string:

```env
# For Neon (cloud):
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require

# For local PostgreSQL:
DATABASE_URL=postgresql://user:pass@localhost:5432/codevector
```

### 3. Run Migrations

```bash
npm run migrate
```

Creates the `products` table with 4 optimized composite indexes.

### 4. Seed 200K Products

```bash
npm run seed
```

Inserts 200,000 products in < 5 seconds using batch inserts (5,000 rows per INSERT).

### 5. Start Development Servers

```bash
# Terminal 1 — Backend (port 3000, auto-reload with nodemon)
npm run dev

# Terminal 2 — Frontend (port 5173, HMR with Vite)
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the Vite dev server proxies `/api` requests to the backend.

---

## 📡 API Documentation

### Base URL

| Environment | URL                                        |
| ----------- | ------------------------------------------ |
| Production  | `https://productbrowser-ejeh.onrender.com` |
| Development | `http://localhost:3000`                    |

### Endpoints

#### `GET /api/v1/products` — List Products (Paginated)

| Parameter  | Type    | Default  | Description                                                  |
| ---------- | ------- | -------- | ------------------------------------------------------------ |
| `category` | string  | —        | Filter: `electronics`, `clothing`, `home`, `books`, `sports` |
| `cursor`   | string  | —        | Pagination cursor from previous response                     |
| `limit`    | integer | `20`     | Items per page (1–100)                                       |
| `sortBy`   | string  | `newest` | Sort: `newest`, `oldest`, `price-asc`, `price-desc`          |

> **Note:** Unversioned `/api/products` still works as a backward-compatible alias.

**Example Request:**

```bash
curl "https://productbrowser-ejeh.onrender.com/api/v1/products?category=electronics&limit=5&sortBy=price-asc"
```

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
    "count": 5,
    "totalEstimate": 200000
  },
  "meta": {
    "category": "electronics",
    "sortBy": "price-asc"
  }
}
```

#### `GET /api/v1/products/:id` — Get Product Detail

```bash
curl "https://productbrowser-ejeh.onrender.com/api/v1/products/42"
```

#### `GET /api/v1/categories` — List All Categories

```bash
curl "https://productbrowser-ejeh.onrender.com/api/v1/categories"
```

#### `GET /api/health` — Health Check

```bash
curl "https://productbrowser-ejeh.onrender.com/api/health"
```

---

## 🔑 Why Keyset Pagination?

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

At 200K rows, `OFFSET 100000` also forces PostgreSQL to scan and discard 100,000 rows — getting slower as you paginate deeper.

### How Keyset Pagination Solves It

Instead of "skip N rows," we say "get everything after this specific product":

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

- `created_at` alone has ties (multiple products created in the same second)
- `id` breaks ties deterministically
- Together they form a **unique, sortable cursor**

**Result:** Even if 50 new products are inserted between page requests, the cursor points to a specific "position" in the sorted data that never shifts. Performance is O(1) regardless of page depth.

---

## ⚡ Performance

### Index Strategy

Each sort mode has a dedicated composite index that PostgreSQL uses for **index-only scans**:

| Index                              | Covers                 | Query Pattern                                 |
| ---------------------------------- | ---------------------- | --------------------------------------------- |
| `idx_products_created_id`          | Default sort           | `ORDER BY created_at DESC, id DESC`           |
| `idx_products_category_created_id` | Category + time sort   | `WHERE category = ? ORDER BY created_at DESC` |
| `idx_products_category_price_id`   | Category + price sort  | `WHERE category = ? ORDER BY price ASC`       |
| `idx_products_price_id`            | Price sort (no filter) | `ORDER BY price ASC, id ASC`                  |

### Other Optimizations

| Optimization                             | Benefit                                                     |
| ---------------------------------------- | ----------------------------------------------------------- |
| **Connection pooling** (20 max)          | Handles concurrent requests efficiently                     |
| **`pg_class.reltuples`** for total count | O(1) instead of `COUNT(*)` which is O(n)                    |
| **Batch seeding** (5,000 rows/INSERT)    | Seeds 200K products in < 5 seconds                          |
| **Parameterized queries**                | Prevents SQL injection + enables prepared statement caching |
| **Limit+1 fetch strategy**               | Determines `hasMore` without a separate COUNT query         |
| **Slow query logging** (> 200ms)         | Identifies performance bottlenecks in production            |

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Unit tests only (no database required)
npm run test:unit

# Integration tests (requires a running, seeded database)
npm run test:integration

# Load test (100+ concurrent connections against deployed API)
npm run test:load
```

### What's Tested

| Suite                | Tests                                                                 |
| -------------------- | --------------------------------------------------------------------- |
| **Cursor Utilities** | Encode/decode, validation, malformed input, SQL injection prevention  |
| **Pagination Logic** | All 4 sort modes, parameter indexing, tiebreaking edge cases          |
| **API Endpoints**    | Pagination flow, category filtering, sort ordering, validation errors |
| **Data Consistency** | Verifies zero duplicates across 5 sequential paginated pages          |

### Load Test Results

Simulated with [autocannon](https://github.com/mcollina/autocannon) against the deployed Render backend:

| Scenario                  | Concurrent | Req/sec | Avg Latency | p99 Latency | Errors |
| ------------------------- | ---------- | ------- | ----------- | ----------- | ------ |
| Product Listing           | 100        | 279/s   | 354ms       | 809ms       | 0      |
| Category Filter           | 100        | 326/s   | 302ms       | 666ms       | 0      |
| Product Detail            | 150        | 379/s   | 388ms       | 890ms       | 0      |
| Stress Test (200 conn)    | 200        | 357/s   | 548ms       | 1,505ms     | 0      |

**15,204 total requests served with zero errors and zero timeouts.**

---

## 🚀 Deployment

This project is deployed across three services (all free tier):

| Service      | Platform                     | Purpose                      |
| ------------ | ---------------------------- | ---------------------------- |
| **Frontend** | [Vercel](https://vercel.com) | React app (static build)     |
| **Backend**  | [Render](https://render.com) | Node.js + Express API server |
| **Database** | [Neon](https://neon.tech)    | PostgreSQL 14 (serverless)   |

### Deploy Your Own

#### 1. Database (Neon)

1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string
3. Run `npm run migrate` and `npm run seed` locally

#### 2. Backend (Render)

1. Create a **Web Service** on [render.com](https://render.com)
2. Connect your GitHub repo
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment Variables:**
   - `DATABASE_URL` = your Neon connection string
   - `NODE_ENV` = `production`

#### 3. Frontend (Vercel)

1. Import your repo on [vercel.com](https://vercel.com)
2. **Root Directory:** `client`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`

---

## 📝 Design Decisions

| Decision                              | Rationale                                                             |
| ------------------------------------- | --------------------------------------------------------------------- |
| **Keyset over OFFSET pagination**     | Zero duplicates/gaps during concurrent writes; O(1) at any page depth |
| **Base64 JSON cursors**               | Human-debuggable, extensible, supports multiple sort fields           |
| **Composite `(field, id)` sort key**  | Guarantees unique sort order even with timestamp ties                 |
| **`pg_class.reltuples` for count**    | O(1) vs O(n) — essential at 200K+ scale                               |
| **Limit+1 fetch strategy**            | Avoids a separate COUNT query to determine `hasMore`                  |
| **PostgreSQL (Neon)**                 | ACID compliance, mature indexing, serverless free tier                |
| **Vanilla CSS with CSS variables**    | Full design control, no framework lock-in, consistent theming         |
| **Separate frontend/backend deploys** | Independent scaling, Vercel CDN edge caching for static assets        |

---

## 🔮 Future Improvements

- **Full-Text Search** — PostgreSQL `tsvector` for product name search
- **Redis Caching** — Cache category lists and hot product pages
- **Infinite Scroll** — Replace "Load More" with IntersectionObserver
- **Product Images** — S3/Cloudinary integration with lazy loading
- **WebSocket Updates** — Real-time product count updates
- **Soft Deletes** — `deleted_at` column for data recovery

---

## 🛠️ Tech Stack

| Layer          | Technology             | Purpose                        |
| -------------- | ---------------------- | ------------------------------ |
| **Runtime**    | Node.js 18+            | Server-side JavaScript         |
| **Framework**  | Express 4.x            | HTTP routing & middleware      |
| **Database**   | PostgreSQL 14+         | Relational data storage        |
| **DB Client**  | node-postgres (pg)     | PostgreSQL driver with pooling |
| **Frontend**   | React 18               | UI component library           |
| **Build Tool** | Vite 5                 | Frontend bundling & HMR        |
| **Testing**    | Jest + Supertest       | Unit & integration tests       |
| **Load Test**  | Autocannon             | Concurrent connection testing  |
| **Logging**    | Winston                | Structured production logging  |
| **Hosting**    | Vercel + Render + Neon | Full-stack cloud deployment    |

---

## 📄 License

MIT
