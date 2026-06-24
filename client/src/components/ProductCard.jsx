/**
 * ProductCard Component
 * 
 * Displays a single product with name, category badge, price, and date.
 * Features hover animations and category-specific accent colors.
 */

import React from 'react';

/**
 * Format a date string to a human-readable relative or absolute format.
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Format price with USD currency.
 */
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);
}

export function ProductCard({ product, index = 0 }) {
  const { id, name, category, price, created_at } = product;

  return (
    <article
      className="product-card"
      data-category={category}
      style={{ animationDelay: `${Math.min(index * 30, 500)}ms` }}
      aria-label={`${name}, $${formatPrice(price)}`}
    >
      <div className="product-card-header">
        <span
          className="product-category-badge"
          data-category={category}
        >
          {category}
        </span>
        <span className="product-id">#{id}</span>
      </div>

      <h2 className="product-name" title={name}>
        {name}
      </h2>

      <div className="product-footer">
        <div className="product-price">
          <span className="currency">$</span>
          {formatPrice(price)}
        </div>
        <div className="product-date">
          {formatDate(created_at)}
        </div>
      </div>
    </article>
  );
}
