import { useState } from 'react';
import QuestionRow from './QuestionRow.jsx';

export default function CategoryGroup({ category, entries, collapsedCategories, visitedEntryIds, onSelect, onToggleCollapse }) {
  const isCollapsed = collapsedCategories.includes(category);
  const [hovered, setHovered] = useState(false);

  return (
    <div>
      {/* Sticky header — carries data attributes for IntersectionObserver */}
      <button
        data-category-header
        data-category={category}
        onClick={() => onToggleCollapse(category)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        aria-expanded={!isCollapsed}
        aria-label={`${category} — ${isCollapsed ? 'expand' : 'collapse'}`}
        style={{
          position: 'sticky', top: 0, zIndex: 10,
          width: '100%', height: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', background: '#0f0f0f',
          cursor: 'pointer', border: 'none',
        }}
      >
        <span style={{
          fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
          color: hovered ? '#D97706' : '#9ca3af', letterSpacing: '0.05em',
          transition: 'color 80ms',
        }}>
          {category} ({entries.length})
        </span>
        <span style={{
          fontSize: 14, color: '#9ca3af',
          transform: isCollapsed ? 'rotate(0deg)' : 'rotate(90deg)',
          transition: 'transform 100ms',
          display: 'inline-block',
        }}>
          ›
        </span>
      </button>

      {/* Entry rows */}
      {!isCollapsed && entries.map((entry) => (
        <QuestionRow
          key={entry.id}
          entry={entry}
          isVisited={visitedEntryIds.has(entry.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
