/**
 * Cursor Utilities for Keyset Pagination
 * 
 * Cursors encode the position of the last item on the current page.
 * This allows the next page to continue exactly where the user left off,
 * even if new data is inserted concurrently.
 * 
 * Format: Base64-encoded JSON containing the sort values and ID.
 * Example decoded: { "created_at": "2024-06-20T10:25:00.000Z", "id": 41 }
 * 
 * Why Base64 JSON?
 * - Human-debuggable (just decode to see contents)
 * - Supports multiple sort fields
 * - Easy to extend for new sort modes
 * - Tamper-evident (invalid JSON = invalid cursor)
 */

/**
 * Encode a cursor from the last record in the current page.
 * 
 * @param {Object} record - The last product record on the page
 * @param {string} sortBy - Sort mode: 'newest', 'oldest', 'price-asc', 'price-desc'
 * @returns {string} Base64-encoded cursor string
 */
function encodeCursor(record, sortBy) {
  const payload = { id: record.id };

  // Include the sort field(s) in the cursor so the next query
  // can resume from the exact right position
  switch (sortBy) {
    case 'price-asc':
    case 'price-desc':
      payload.price = record.price;
      payload.created_at = record.created_at;
      break;
    case 'newest':
    case 'oldest':
    default:
      payload.created_at = record.created_at;
      break;
  }

  payload.sortBy = sortBy;
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

/**
 * Decode and validate a cursor string.
 * 
 * @param {string} cursorString - Base64-encoded cursor
 * @returns {Object|null} Decoded cursor payload, or null if invalid
 */
function decodeCursor(cursorString) {
  if (!cursorString) return null;

  try {
    const json = Buffer.from(cursorString, 'base64').toString('utf8');
    const payload = JSON.parse(json);

    // Validate required fields
    if (!payload.id || typeof payload.id !== 'number') {
      return null;
    }

    // Validate sort-specific fields exist
    if (payload.sortBy === 'price-asc' || payload.sortBy === 'price-desc') {
      if (payload.price === undefined || payload.price === null) return null;
      if (!payload.created_at) return null;
    } else {
      if (!payload.created_at) return null;
    }

    // Validate timestamp is a real date
    if (payload.created_at && isNaN(new Date(payload.created_at).getTime())) {
      return null;
    }

    return payload;
  } catch {
    // Invalid Base64 or JSON → invalid cursor
    return null;
  }
}

module.exports = { encodeCursor, decodeCursor };
