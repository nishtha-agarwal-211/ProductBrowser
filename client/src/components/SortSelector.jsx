/**
 * SortSelector Component
 * 
 * Dropdown for selecting the sort order of products.
 * Closes on outside click and Escape key.
 */

import React, { useState, useRef, useEffect } from 'react';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First', icon: '↓' },
  { value: 'oldest', label: 'Oldest First', icon: '↑' },
  { value: 'price-asc', label: 'Price: Low → High', icon: '$↑' },
  { value: 'price-desc', label: 'Price: High → Low', icon: '$↓' },
];

export function SortSelector({ activeSort, onSortChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }

    function handleEscape(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const activeOption = SORT_OPTIONS.find(o => o.value === activeSort) || SORT_OPTIONS[0];

  return (
    <div className="sort-selector" ref={dropdownRef}>
      <button
        className="sort-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Sort: ${activeOption.label}`}
        id="sort-selector-button"
      >
        <span className="sort-icon" aria-hidden="true">⇅</span>
        <span>{activeOption.label}</span>
      </button>

      {isOpen && (
        <div
          className="sort-dropdown"
          role="listbox"
          aria-labelledby="sort-selector-button"
        >
          {SORT_OPTIONS.map(option => (
            <button
              key={option.value}
              className={`sort-option ${activeSort === option.value ? 'active' : ''}`}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              role="option"
              aria-selected={activeSort === option.value}
            >
              <span className="check-icon" aria-hidden="true">
                {activeSort === option.value ? '✓' : ''}
              </span>
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
