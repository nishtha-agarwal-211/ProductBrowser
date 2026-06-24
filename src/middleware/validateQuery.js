/**
 * Query Parameter Validation Middleware
 * 
 * Validates and sanitizes query parameters for the product listing endpoint.
 * Returns 400 errors with specific error codes for invalid input.
 */

const { AppError } = require('./errorHandler');
const { decodeCursor } = require('../utils/cursor');

// Valid categories (matches seeded data)
const VALID_CATEGORIES = ['electronics', 'clothing', 'home', 'books', 'sports'];

// Valid sort modes
const VALID_SORT_MODES = ['newest', 'oldest', 'price-asc', 'price-desc'];

/**
 * Middleware to validate query parameters for GET /api/products.
 * Attaches sanitized values to req.query for downstream use.
 */
function validateProductQuery(req, res, next) {
  const { category, cursor, limit, sortBy } = req.query;

  // ── Validate category ──────────────────────────────────
  if (category !== undefined && category !== '') {
    const normalizedCategory = category.toLowerCase().trim();
    if (!VALID_CATEGORIES.includes(normalizedCategory)) {
      throw new AppError(
        `Invalid category "${category}". Valid categories: ${VALID_CATEGORIES.join(', ')}`,
        400,
        'INVALID_CATEGORY'
      );
    }
    req.query.category = normalizedCategory;
  } else {
    req.query.category = null; // No filter
  }

  // ── Validate sortBy ────────────────────────────────────
  if (sortBy !== undefined && sortBy !== '') {
    const normalizedSort = sortBy.toLowerCase().trim();
    if (!VALID_SORT_MODES.includes(normalizedSort)) {
      throw new AppError(
        `Invalid sortBy "${sortBy}". Valid options: ${VALID_SORT_MODES.join(', ')}`,
        400,
        'INVALID_SORT'
      );
    }
    req.query.sortBy = normalizedSort;
  } else {
    req.query.sortBy = 'newest'; // Default
  }

  // ── Validate limit ─────────────────────────────────────
  if (limit !== undefined && limit !== '') {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
      throw new AppError(
        'Limit must be a positive integer',
        400,
        'INVALID_LIMIT'
      );
    }
    if (parsedLimit > 100) {
      throw new AppError(
        'Limit cannot exceed 100',
        400,
        'LIMIT_EXCEEDED'
      );
    }
    req.query.limit = parsedLimit;
  } else {
    req.query.limit = 20; // Default
  }

  // ── Validate cursor ────────────────────────────────────
  if (cursor !== undefined && cursor !== '') {
    const decoded = decodeCursor(cursor);
    if (!decoded) {
      throw new AppError(
        'Invalid cursor format. Cursors should be obtained from previous API responses.',
        400,
        'INVALID_CURSOR'
      );
    }
    req.query.decodedCursor = decoded;
  } else {
    req.query.decodedCursor = null;
  }

  next();
}

/**
 * Middleware to validate product ID parameter.
 */
function validateProductId(req, res, next) {
  const { id } = req.params;
  const parsedId = parseInt(id, 10);

  if (isNaN(parsedId) || parsedId < 1) {
    throw new AppError(
      'Product ID must be a positive integer',
      400,
      'INVALID_ID'
    );
  }

  req.params.id = parsedId;
  next();
}

module.exports = { validateProductQuery, validateProductId, VALID_CATEGORIES, VALID_SORT_MODES };
