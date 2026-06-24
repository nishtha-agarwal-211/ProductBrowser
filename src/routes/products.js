/**
 * Product Routes
 * 
 * Defines all product-related API endpoints.
 * Applies validation middleware before controllers.
 */

const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');
const { validateProductQuery, validateProductId } = require('../middleware/validateQuery');

// GET /api/products — List products (paginated)
router.get('/', validateProductQuery, controller.listProducts);

// GET /api/categories — List all categories
router.get('/categories', controller.getCategories);

// GET /api/products/:id — Get single product
router.get('/:id', validateProductId, controller.getProduct);

module.exports = router;
