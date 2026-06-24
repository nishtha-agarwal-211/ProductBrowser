/**
 * Product Seeding Script
 * 
 * Generates and bulk-inserts 200,000 realistic products into PostgreSQL.
 * Uses batch inserts of 5,000 rows for speed (target: < 5 seconds).
 * 
 * Run: npm run seed
 * 
 * Product Distribution:
 *   Electronics: 50,000 (25%)
 *   Clothing:    45,000 (22.5%)
 *   Home:        40,000 (20%)
 *   Books:       35,000 (17.5%)
 *   Sports:      30,000 (15%)
 */

const { query, close } = require('../src/db/connection');

// ── Configuration ──────────────────────────────────────────
const TOTAL_PRODUCTS = 200000;
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE, 10) || 5000;

// Category distribution (must sum to TOTAL_PRODUCTS)
const CATEGORIES = [
  { name: 'electronics', count: 50000 },
  { name: 'clothing',    count: 45000 },
  { name: 'home',        count: 40000 },
  { name: 'books',       count: 35000 },
  { name: 'sports',      count: 30000 },
];

// ── Realistic Name Generation ──────────────────────────────
// Adjective + Noun patterns per category for realistic product names
const NAME_PARTS = {
  electronics: {
    adjectives: ['Wireless', 'Smart', 'Digital', 'Portable', 'Pro', 'Ultra', 'Mini', 'HD', 'Bluetooth', 'Premium', 'Advanced', 'Compact', 'High-Speed', 'Solar', 'Noise-Cancelling'],
    nouns: ['Headphones', 'Speaker', 'Charger', 'Keyboard', 'Mouse', 'Monitor', 'Webcam', 'Microphone', 'Router', 'Hub', 'Cable', 'Adapter', 'Tablet', 'Watch', 'Earbuds', 'Power Bank', 'Controller', 'Dock', 'Light Strip', 'Camera'],
  },
  clothing: {
    adjectives: ['Classic', 'Slim', 'Relaxed', 'Vintage', 'Modern', 'Fitted', 'Oversized', 'Lightweight', 'Stretch', 'Premium', 'Organic', 'Soft', 'Durable', 'Breathable', 'Water-Resistant'],
    nouns: ['T-Shirt', 'Jeans', 'Jacket', 'Hoodie', 'Sweater', 'Pants', 'Shorts', 'Dress', 'Blouse', 'Coat', 'Vest', 'Socks', 'Scarf', 'Hat', 'Cardigan', 'Polo', 'Tank Top', 'Skirt', 'Leggings', 'Blazer'],
  },
  home: {
    adjectives: ['Ceramic', 'Bamboo', 'Stainless', 'Crystal', 'Handcrafted', 'Minimal', 'Rustic', 'Modern', 'Elegant', 'Cozy', 'Eco-Friendly', 'Non-Stick', 'Memory Foam', 'Scented', 'Stackable'],
    nouns: ['Lamp', 'Vase', 'Cushion', 'Blanket', 'Candle', 'Frame', 'Planter', 'Rug', 'Mirror', 'Clock', 'Shelf', 'Mug', 'Bowl', 'Cutting Board', 'Towel Set', 'Organizer', 'Diffuser', 'Tray', 'Basket', 'Curtains'],
  },
  books: {
    adjectives: ['Complete', 'Illustrated', 'Essential', 'Definitive', 'Pocket', 'Advanced', 'Beginner\'s', 'Classic', 'Modern', 'Practical', 'Comprehensive', 'Award-Winning', 'Bestselling', 'Updated', 'Deluxe'],
    nouns: ['Guide to Python', 'History of Art', 'Cookbook', 'Novel Collection', 'Science Encyclopedia', 'Travel Journal', 'Mystery Thriller', 'Self-Help Manual', 'Poetry Anthology', 'Business Strategy', 'Design Handbook', 'Photography Book', 'Gardening Guide', 'Fitness Plan', 'Meditation Guide', 'Finance Workbook', 'Leadership Book', 'Memoir', 'Atlas', 'Dictionary'],
  },
  sports: {
    adjectives: ['Professional', 'Training', 'Competition', 'Lightweight', 'Heavy-Duty', 'Adjustable', 'Ergonomic', 'All-Weather', 'Impact-Resistant', 'Quick-Dry', 'Anti-Slip', 'Reflective', 'Carbon Fiber', 'Titanium', 'Reinforced'],
    nouns: ['Running Shoes', 'Yoga Mat', 'Dumbbells', 'Resistance Band', 'Jump Rope', 'Water Bottle', 'Gym Bag', 'Tennis Racket', 'Basketball', 'Soccer Ball', 'Cycling Gloves', 'Swim Goggles', 'Fishing Rod', 'Hiking Boots', 'Boxing Gloves', 'Helmet', 'Knee Pad', 'Backpack', 'Skateboard', 'Foam Roller'],
  },
};

// Price ranges per category (min, max in USD)
const PRICE_RANGES = {
  electronics: [9.99, 999.99],
  clothing:    [12.99, 299.99],
  home:        [7.99, 499.99],
  books:       [4.99, 89.99],
  sports:      [9.99, 399.99],
};

/**
 * Generate a realistic product name for a category.
 * Pattern: "{Adjective} {Noun} {Variant}" where variant is a number for uniqueness.
 */
function generateName(category, index) {
  const parts = NAME_PARTS[category];
  const adj = parts.adjectives[index % parts.adjectives.length];
  const noun = parts.nouns[Math.floor(index / parts.adjectives.length) % parts.nouns.length];
  // Add a variant number for uniqueness (e.g., "Wireless Headphones V42")
  const variant = Math.floor(index / (parts.adjectives.length * parts.nouns.length)) + 1;
  return variant > 1 ? `${adj} ${noun} V${variant}` : `${adj} ${noun}`;
}

/**
 * Generate a random price within the category's range.
 * Returns a value with 2 decimal places.
 */
function randomPrice(category) {
  const [min, max] = PRICE_RANGES[category];
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

/**
 * Generate a random timestamp within the past 90 days.
 * Distributes timestamps evenly for realistic data.
 */
function randomDate(index, total) {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  // Spread timestamps over 90 days with some randomness
  const baseOffset = (index / total) * ninetyDaysMs;
  const jitter = Math.random() * (ninetyDaysMs / total); // Small random jitter
  return new Date(now - baseOffset - jitter);
}

/**
 * Build a bulk INSERT query for a batch of products.
 * Uses parameterized values for safety: INSERT INTO products (...) VALUES ($1,$2,$3,$4,$5), ($6,...), ...
 */
function buildBulkInsert(products) {
  const values = [];
  const params = [];
  let paramIndex = 1;

  for (const product of products) {
    values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4})`);
    params.push(product.name, product.category, product.price, product.created_at, product.updated_at);
    paramIndex += 5;
  }

  const sql = `
    INSERT INTO products (name, category, price, created_at, updated_at)
    VALUES ${values.join(', ')}
  `;

  return { sql, params };
}

// ── Main Seeding Function ──────────────────────────────────
async function seedProducts() {
  console.log('🌱 Starting product seeding...');
  console.log(`   Total products: ${TOTAL_PRODUCTS.toLocaleString()}`);
  console.log(`   Batch size: ${BATCH_SIZE.toLocaleString()}\n`);

  const startTime = Date.now();

  // Build the flat product list based on category distribution
  const allProducts = [];
  let globalIndex = 0;

  for (const cat of CATEGORIES) {
    for (let i = 0; i < cat.count; i++) {
      allProducts.push({
        name: generateName(cat.name, i),
        category: cat.name,
        price: randomPrice(cat.name),
        created_at: randomDate(globalIndex, TOTAL_PRODUCTS),
        updated_at: randomDate(globalIndex, TOTAL_PRODUCTS),
      });
      globalIndex++;
    }
  }

  // Shuffle for realistic mixed ordering
  for (let i = allProducts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allProducts[i], allProducts[j]] = [allProducts[j], allProducts[i]];
  }

  // Insert in batches
  let inserted = 0;
  for (let i = 0; i < allProducts.length; i += BATCH_SIZE) {
    const batch = allProducts.slice(i, i + BATCH_SIZE);
    const { sql, params } = buildBulkInsert(batch);
    await query(sql, params);

    inserted += batch.length;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pct = ((inserted / TOTAL_PRODUCTS) * 100).toFixed(0);
    process.stdout.write(`\r   Progress: ${inserted.toLocaleString()}/${TOTAL_PRODUCTS.toLocaleString()} (${pct}%) — ${elapsed}s`);
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n\n🎉 Seeding complete!`);
  console.log(`   Inserted: ${inserted.toLocaleString()} products`);
  console.log(`   Time: ${totalTime}s`);
  
  if (parseFloat(totalTime) < 5) {
    console.log(`   ✅ Under 5-second target!`);
  } else {
    console.log(`   ⚠️  Exceeded 5-second target. Consider increasing BATCH_SIZE.`);
  }

  // Verify distribution
  console.log('\n📊 Category Distribution:');
  const result = await query(`
    SELECT category, COUNT(*) as count 
    FROM products 
    GROUP BY category 
    ORDER BY count DESC
  `);
  for (const row of result.rows) {
    console.log(`   ${row.category}: ${parseInt(row.count).toLocaleString()}`);
  }
}

// ── Entry Point ────────────────────────────────────────────
(async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing products...\n');
    await query('TRUNCATE TABLE products RESTART IDENTITY');
    
    await seedProducts();
  } catch (err) {
    console.error('\n❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await close();
  }
})();
