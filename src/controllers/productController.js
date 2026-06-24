/**
 * Product Controller
 * 
 * Handles HTTP requests for product endpoints.
 * Delegates business logic to productService.
 */

const productService = require('../services/productService');
const { AppError } = require('../middleware/errorHandler');

/**
 * GET /api/products
 * List products with cursor-based pagination and optional category filter.
 */
async function listProducts(req, res, next) {
  try {
    const { category, decodedCursor, limit, sortBy } = req.query;

    const result = await productService.listProducts({
      category,
      cursor: decodedCursor,
      limit,
      sortBy,
    });

    res.json({
      success: true,
      data: result.products,
      pagination: result.pagination,
      meta: result.meta,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:id
 * Get a single product by its ID.
 */
async function getProduct(req, res, next) {
  try {
    const product = await productService.getProductById(req.params.id);

    if (!product) {
      throw new AppError('Product not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/categories
 * Get all available product categories.
 */
async function getCategories(req, res, next) {
  try {
    const categories = await productService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listProducts, getProduct, getCategories };
