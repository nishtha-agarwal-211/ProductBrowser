/**
 * ProductGrid Component
 * 
 * Renders a responsive grid of product cards with grid/list view toggle.
 */

import React from 'react';
import { ProductCard } from './ProductCard.jsx';

export function ProductGrid({ products, viewMode = 'grid', startIndex = 0 }) {
  return (
    <div
      className={`product-grid ${viewMode === 'list' ? 'list-view' : ''}`}
      id="product-grid"
      role="tabpanel"
      aria-label="Product results"
    >
      {products.map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={startIndex + i}
        />
      ))}
    </div>
  );
}
