/**
 * ErrorState Component
 * 
 * Displayed when an API request fails.
 * Provides a retry button to attempt the request again.
 */

import React from 'react';

export function ErrorState({ message, onRetry }) {
  return (
    <div className="error-state" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <h2 className="error-title">Something went wrong</h2>
      <p className="error-message">
        {message || 'An unexpected error occurred while fetching products. Please try again.'}
      </p>
      {onRetry && (
        <button
          className="error-retry-btn"
          onClick={onRetry}
          id="error-retry-button"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
