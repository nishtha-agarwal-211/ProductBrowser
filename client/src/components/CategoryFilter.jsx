/**
 * CategoryFilter Component
 * 
 * Displays category pills for filtering products.
 * Supports "All" + each category with colored dot indicators.
 */

import React from 'react';

// Category colors matching the CSS design system
const CATEGORY_COLORS = {
  electronics: '#6c5ce7',
  clothing: '#fd79a8',
  home: '#fdcb6e',
  books: '#00cec9',
  sports: '#00b894',
};

export function CategoryFilter({ categories, activeCategory, onCategoryChange }) {
  return (
    <div className="toolbar-left" role="tablist" aria-label="Filter by category">
      {/* "All" pill */}
      <button
        className={`category-pill ${!activeCategory ? 'active' : ''}`}
        onClick={() => onCategoryChange(null)}
        role="tab"
        aria-selected={!activeCategory}
        aria-controls="product-grid"
        id="category-all"
      >
        All
      </button>

      {/* Category pills */}
      {categories.map(cat => (
        <button
          key={cat}
          className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
          onClick={() => onCategoryChange(cat)}
          role="tab"
          aria-selected={activeCategory === cat}
          aria-controls="product-grid"
          id={`category-${cat}`}
        >
          <span
            className="pill-dot"
            style={{ backgroundColor: CATEGORY_COLORS[cat] || 'var(--text-tertiary)' }}
            aria-hidden="true"
          />
          {cat}
        </button>
      ))}
    </div>
  );
}
