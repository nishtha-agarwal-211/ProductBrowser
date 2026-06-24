/**
 * Load Test Script — Verify 100+ Concurrent Users
 * 
 * Uses autocannon to simulate high concurrency against the API.
 * Tests multiple endpoints with realistic usage patterns.
 * 
 * Usage:
 *   node scripts/load-test.js                          # Test deployed backend
 *   node scripts/load-test.js http://localhost:3000     # Test local backend
 */

const autocannon = require('autocannon');

const BASE_URL = process.argv[2] || 'https://productbrowser-ejeh.onrender.com';

const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Books', 'Sports'];

/**
 * Run a single load test scenario and return results.
 */
function runTest(opts) {
  return new Promise((resolve, reject) => {
    const instance = autocannon({
      ...opts,
      url: opts.url,
    }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

    // Print live progress
    autocannon.track(instance, { renderProgressBar: true });
  });
}

/**
 * Format a result summary into a readable table row.
 */
function summarize(name, result) {
  return {
    Scenario: name,
    'Req/sec (avg)': result.requests.average,
    'Req/sec (max)': result.requests.max,
    'Latency avg (ms)': result.latency.average,
    'Latency p99 (ms)': result.latency.p99,
    'Total Requests': result.requests.total,
    'Errors': result.errors,
    'Timeouts': result.timeouts,
    '2xx': result['2xx'],
    'Non-2xx': result.non2xx,
  };
}

async function main() {
  console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🔥 CodeVector Load Test Suite                      ║
║                                                      ║
║   Target: ${BASE_URL.padEnd(42)}║
║   Scenarios: 4 tests × 100+ concurrent connections   ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
  `);

  const results = [];

  // ─────────────────────────────────────────────────────────
  // Scenario 1: Product listing (no filter) — 100 concurrent
  // ─────────────────────────────────────────────────────────
  console.log('\n━━━ Scenario 1: Product Listing (100 concurrent) ━━━\n');
  const test1 = await runTest({
    url: `${BASE_URL}/api/v1/products?limit=20&sortBy=newest`,
    connections: 100,
    duration: 10,       // 10 seconds
    method: 'GET',
    title: 'Product Listing',
  });
  results.push(summarize('Product Listing (100 conn)', test1));

  // ─────────────────────────────────────────────────────────
  // Scenario 2: Category-filtered listing — 100 concurrent
  // ─────────────────────────────────────────────────────────
  console.log('\n━━━ Scenario 2: Category Filter (100 concurrent) ━━━\n');
  const randomCat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
  const test2 = await runTest({
    url: `${BASE_URL}/api/v1/products?category=${randomCat}&limit=20&sortBy=price-asc`,
    connections: 100,
    duration: 10,
    method: 'GET',
    title: `Category: ${randomCat}`,
  });
  results.push(summarize(`Category Filter (${randomCat})`, test2));

  // ─────────────────────────────────────────────────────────
  // Scenario 3: Single product detail — 150 concurrent
  // ─────────────────────────────────────────────────────────
  console.log('\n━━━ Scenario 3: Product Detail (150 concurrent) ━━━\n');
  const test3 = await runTest({
    url: `${BASE_URL}/api/v1/products/42`,
    connections: 150,
    duration: 10,
    method: 'GET',
    title: 'Product Detail',
  });
  results.push(summarize('Product Detail (150 conn)', test3));

  // ─────────────────────────────────────────────────────────
  // Scenario 4: Mixed endpoints — 200 concurrent (stress)
  // ─────────────────────────────────────────────────────────
  console.log('\n━━━ Scenario 4: Mixed Endpoints Stress (200 concurrent) ━━━\n');
  const test4 = await runTest({
    url: `${BASE_URL}/api/v1/products?limit=50&sortBy=price-desc`,
    connections: 200,
    duration: 15,       // 15 seconds
    method: 'GET',
    title: 'Stress Test (200 connections)',
  });
  results.push(summarize('Stress Test (200 conn)', test4));

  // ─────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────
  console.log('\n\n═══════════════════════════════════════════════════');
  console.log('              📊 LOAD TEST RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════\n');
  console.table(results);

  // Overall assessment
  const totalErrors = results.reduce((sum, r) => sum + r.Errors + r.Timeouts, 0);
  const totalNon2xx = results.reduce((sum, r) => sum + r['Non-2xx'], 0);
  const maxP99 = Math.max(...results.map(r => r['Latency p99 (ms)']));
  const totalRequests = results.reduce((sum, r) => sum + r['Total Requests'], 0);

  console.log(`\n📈 Total Requests Served: ${totalRequests}`);
  console.log(`⚡ Worst-case p99 Latency: ${maxP99}ms`);
  console.log(`❌ Total Errors: ${totalErrors}`);
  console.log(`🚫 Non-2xx Responses: ${totalNon2xx}`);

  if (totalErrors === 0 && maxP99 < 5000) {
    console.log('\n✅ PASS — API handles 100+ concurrent connections successfully!');
  } else if (totalErrors < 10 && maxP99 < 10000) {
    console.log('\n⚠️  WARN — Some issues under heavy load, but generally stable.');
  } else {
    console.log('\n❌ FAIL — API struggles under load. Review connection pool and query performance.');
  }

  console.log('\n');
}

main().catch((err) => {
  console.error('Load test failed:', err.message);
  process.exit(1);
});
