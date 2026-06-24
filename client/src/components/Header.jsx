/**
 * Header Component
 * 
 * Displays the app branding and total product count.
 */

import React from 'react';

export function Header({ totalEstimate }) {
  const formattedCount = totalEstimate
    ? totalEstimate.toLocaleString()
    : '—';

  return (
    <header className="header" role="banner">
      <div className="header-inner">
        <div className="header-brand">
          <div className="header-logo" aria-hidden="true">CV</div>
          <div>
            <h1 className="header-title">CodeVector</h1>
            <p className="header-subtitle">Product Browser</p>
          </div>
        </div>

        <div className="header-stats" aria-live="polite">
          <div className="stat-item">
            <div className="stat-value">{formattedCount}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>
      </div>
    </header>
  );
}
