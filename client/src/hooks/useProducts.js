/**
 * useProducts — Custom Hook for Product Fetching
 * 
 * Manages the product browsing state including:
 * - Cursor-based pagination (append on load more)
 * - Category filtering (reset on change)
 * - Sort mode (reset on change)
 * - Loading, error, and empty states
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchProducts } from '../api/products';

/**
 * @param {Object} options
 * @param {string|null} options.category - Active category filter
 * @param {string} options.sortBy - Active sort mode
 * @param {number} options.limit - Items per page
 * @returns {Object} { products, loading, loadingMore, error, hasMore, totalEstimate, loadMore, retry }
 */
export function useProducts({ category = null, sortBy = 'newest', limit = 20 } = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState(null);
  const [totalEstimate, setTotalEstimate] = useState(0);

  // Track current request to prevent race conditions
  const requestIdRef = useRef(0);

  /**
   * Fetch the first page of products.
   * Resets all state (called when category or sort changes).
   */
  const fetchFirstPage = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);
    setProducts([]);
    setCursor(null);
    setHasMore(false);

    try {
      const result = await fetchProducts({ category, sortBy, limit });

      // Ignore stale responses (user changed category/sort before response arrived)
      if (requestId !== requestIdRef.current) return;

      setProducts(result.data);
      setCursor(result.pagination.cursor);
      setHasMore(result.pagination.hasMore);
      setTotalEstimate(result.pagination.totalEstimate);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [category, sortBy, limit]);

  /**
   * Fetch the next page of products (Load More).
   * Appends results to the existing products array.
   */
  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;

    const requestId = requestIdRef.current; // Don't increment — this is a continuation
    setLoadingMore(true);

    try {
      const result = await fetchProducts({ category, cursor, sortBy, limit });

      // Ignore if user changed filters during load
      if (requestId !== requestIdRef.current) return;

      setProducts(prev => [...prev, ...result.data]);
      setCursor(result.pagination.cursor);
      setHasMore(result.pagination.hasMore);
      setTotalEstimate(result.pagination.totalEstimate);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingMore(false);
      }
    }
  }, [cursor, loadingMore, category, sortBy, limit]);

  /**
   * Retry the last failed request.
   */
  const retry = useCallback(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  // Fetch first page when category or sort changes
  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage]);

  return {
    products,
    loading,
    loadingMore,
    error,
    hasMore,
    totalEstimate,
    loadMore,
    retry,
  };
}
