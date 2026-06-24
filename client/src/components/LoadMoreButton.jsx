/**
 * LoadMoreButton Component
 * 
 * Cursor-based "Load More" button with loading spinner,
 * item count progress, and end-of-list message.
 */

import React from 'react';

export function LoadMoreButton({ 
  hasMore, 
  loadingMore, 
  onLoadMore, 
  loadedCount, 
  totalEstimate 
}) {
  if (!hasMore && loadedCount > 0) {
    return (
      <div className="load-more-container">
        <div className="end-message" aria-live="polite">
          <span aria-hidden="true">✓</span>
          You've browsed all {loadedCount.toLocaleString()} products
        </div>
      </div>
    );
  }

  if (!hasMore) return null;

  return (
    <div className="load-more-container">
      <button
        className="load-more-btn"
        onClick={onLoadMore}
        disabled={loadingMore}
        aria-label={loadingMore ? 'Loading more products...' : 'Load more products'}
        id="load-more-button"
      >
        {loadingMore ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Loading...
          </>
        ) : (
          <>Load More</>
        )}
      </button>

      <div className="load-more-info" aria-live="polite">
        Showing {loadedCount.toLocaleString()} of ~{totalEstimate.toLocaleString()} products
      </div>
    </div>
  );
}
