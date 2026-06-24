/**
 * API Client for Product Endpoints
 * 
 * Handles communication with the CodeVector backend API.
 * Uses the Vite dev proxy in development and relative URLs in production.
 */

const API_BASE = '/api';

/**
 * Fetch products with pagination, filtering, and sorting.
 * 
 * @param {Object} params
 * @param {string|null} params.category - Category filter
 * @param {string|null} params.cursor - Pagination cursor from previous response
 * @param {number} params.limit - Items per page
 * @param {string} params.sortBy - Sort mode
 * @returns {Promise<Object>} API response with data, pagination, and meta
 */
export async function fetchProducts({ category = null, cursor = null, limit = 20, sortBy = 'newest' } = {}) {
  const params = new URLSearchParams();

  if (category) params.set('category', category);
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  if (sortBy) params.set('sortBy', sortBy);

  const url = `${API_BASE}/products?${params.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch products`);
  }

  return response.json();
}

/**
 * Fetch a single product by ID.
 * 
 * @param {number} id - Product ID
 * @returns {Promise<Object>} API response with product data
 */
export async function fetchProduct(id) {
  const response = await fetch(`${API_BASE}/products/${id}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}: Product not found`);
  }

  return response.json();
}

/**
 * Fetch all available product categories.
 * 
 * @returns {Promise<string[]>} Array of category names
 */
export async function fetchCategories() {
  const response = await fetch(`${API_BASE}/categories`);

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  const data = await response.json();
  return data.data;
}
