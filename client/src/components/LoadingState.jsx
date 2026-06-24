/**
 * LoadingState Component
 * 
 * Displays skeleton loading cards while products are being fetched.
 */

import React from 'react';

export function LoadingState({ count = 8 }) {
  return (
    <div className="skeleton-grid" role="status" aria-label="Loading products">
      <span className="sr-only">Loading products...</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skeleton-card" aria-hidden="true">
          <div className="skeleton-line short" />
          <div className="skeleton-line long" style={{ marginTop: '12px' }} />
          <div className="skeleton-line medium" />
          <div className="skeleton-line price" />
        </div>
      ))}
    </div>
  );
}
