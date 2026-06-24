/**
 * App — Main Application Shell
 * 
 * Orchestrates the product browsing experience:
 * - Header with product count
 * - Category filter pills
 * - Sort selector dropdown
 * - Grid/list view toggle
 * - Product grid with cursor-based pagination
 * - Loading, empty, and error states
 * 
 * URL parameters are synced for shareable links:
 *   /products?category=electronics&sortBy=price-asc
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.jsx';
import { CategoryFilter } from './components/CategoryFilter.jsx';
import { SortSelector } from './components/SortSelector.jsx';
import { ViewToggle } from './components/ViewToggle.jsx';
import { ProductGrid } from './components/ProductGrid.jsx';
import { LoadMoreButton } from './components/LoadMoreButton.jsx';
import { LoadingState } from './components/LoadingState.jsx';
import { EmptyState } from './components/EmptyState.jsx';
import { ErrorState } from './components/ErrorState.jsx';
import { useProducts } from './hooks/useProducts.js';
import { fetchCategories } from './api/products.js';

// Default categories (fallback if API fails)
const DEFAULT_CATEGORIES = ['electronics', 'clothing', 'home', 'books', 'sports'];

function App() {
  // ── State ──────────────────────────────────────────────
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  // Fetch products using the custom hook
  const {
    products,
    loading,
    loadingMore,
    error,
    hasMore,
    totalEstimate,
    loadMore,
    retry,
  } = useProducts({ category: activeCategory, sortBy });

  // ── Load categories from API ───────────────────────────
  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch(() => {
        // Fall back to defaults if API fails
        setCategories(DEFAULT_CATEGORIES);
      });
  }, []);

  // ── URL sync (read on mount, update on change) ────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlCategory = params.get('category');
    const urlSortBy = params.get('sortBy');

    if (urlCategory && DEFAULT_CATEGORIES.includes(urlCategory)) {
      setActiveCategory(urlCategory);
    }
    if (urlSortBy && ['newest', 'oldest', 'price-asc', 'price-desc'].includes(urlSortBy)) {
      setSortBy(urlSortBy);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeCategory) params.set('category', activeCategory);
    if (sortBy !== 'newest') params.set('sortBy', sortBy);

    const search = params.toString();
    const newUrl = search ? `?${search}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  }, [activeCategory, sortBy]);

  // ── Handlers ───────────────────────────────────────────
  const handleCategoryChange = useCallback((category) => {
    setActiveCategory(category);
  }, []);

  const handleSortChange = useCallback((sort) => {
    setSortBy(sort);
  }, []);

  const handleViewChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      <Header totalEstimate={totalEstimate} />

      <nav className="toolbar" role="navigation" aria-label="Product filters">
        <div className="toolbar-inner">
          <CategoryFilter
            categories={categories}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
          />
          <div className="toolbar-right">
            <SortSelector
              activeSort={sortBy}
              onSortChange={handleSortChange}
            />
            <ViewToggle
              viewMode={viewMode}
              onViewChange={handleViewChange}
            />
          </div>
        </div>
      </nav>

      <main className="app-container product-section" role="main">
        {/* Loading state — first page */}
        {loading && <LoadingState count={8} />}

        {/* Error state */}
        {!loading && error && (
          <ErrorState message={error} onRetry={retry} />
        )}

        {/* Empty state — no products match */}
        {!loading && !error && products.length === 0 && (
          <EmptyState category={activeCategory} />
        )}

        {/* Product grid */}
        {!loading && !error && products.length > 0 && (
          <>
            <ProductGrid
              products={products}
              viewMode={viewMode}
            />
            <LoadMoreButton
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadMore}
              loadedCount={products.length}
              totalEstimate={totalEstimate}
            />
          </>
        )}
      </main>
    </>
  );
}

export default App;
