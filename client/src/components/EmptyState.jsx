/**
 * EmptyState Component
 * 
 * Displayed when no products match the current filters.
 */

import React from 'react';

export function EmptyState({ category }) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-icon" aria-hidden="true">📦</div>
      <h2 className="empty-title">No products found</h2>
      <p className="empty-message">
        {category
          ? `There are no products in the "${category}" category. Try selecting a different category.`
          : 'No products are available at this time. Please check back later.'
        }
      </p>
    </div>
  );
}
