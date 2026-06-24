/**
 * ViewToggle Component
 * 
 * Toggle between grid and list view modes.
 */

import React from 'react';

export function ViewToggle({ viewMode, onViewChange }) {
  return (
    <div className="view-toggle" role="group" aria-label="View mode">
      <button
        className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => onViewChange('grid')}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
        title="Grid view"
      >
        ▦
      </button>
      <button
        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => onViewChange('list')}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
        title="List view"
      >
        ☰
      </button>
    </div>
  );
}
