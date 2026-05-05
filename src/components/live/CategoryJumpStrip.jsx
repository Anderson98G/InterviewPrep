import { useEffect, useRef, useState } from 'react';
import { CATEGORY_LIST } from '../../utils/categories.js';

const PILL_LABELS = {
  'Product sense': 'Prod',
  'Leadership': 'Lead',
  'Strategy': 'Strat',
  'Estimation': 'Est',
  'Execution': 'Exec',
  'Hiring': 'Hire',
  'Team management': 'Team',
};

export default function CategoryJumpStrip({
  scrollRef,
  isMinimized,
  entriesByCategory,
  collapsedCategories,
  onExpandCategory,
}) {
  const [activeCategory, setActiveCategory] = useState(null);
  const intersectingRef = useRef(new Set());

  // IntersectionObserver — watches [data-category-header] elements inside the scroll container.
  useEffect(() => {
    if (isMinimized || !scrollRef.current) return;

    const root = scrollRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const cat = e.target.dataset.category;
          if (e.isIntersecting) intersectingRef.current.add(cat);
          else intersectingRef.current.delete(cat);
        });
        // Active = topmost visible category (first match in canonical order).
        const next = CATEGORY_LIST.find((c) => intersectingRef.current.has(c));
        if (next) setActiveCategory(next);
      },
      { root, threshold: 0.3 }
    );

    root.querySelectorAll('[data-category-header]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isMinimized, scrollRef]);

  function handlePillClick(category) {
    const root = scrollRef.current;
    if (!root) return;

    // Auto-expand collapsed category before scrolling.
    if (collapsedCategories.includes(category)) {
      onExpandCategory(category);
      // Let React re-render first so the header element is visible, then scroll.
      setTimeout(() => scrollToCategory(root, category), 0);
    } else {
      scrollToCategory(root, category);
    }
  }

  function scrollToCategory(root, category) {
    const header = root.querySelector(`[data-category="${category}"]`);
    if (header) header.scrollIntoView({ block: 'start' });
  }

  return (
    <div style={{
      height: 36, display: 'flex', alignItems: 'center', gap: 4,
      padding: '0 8px', borderBottom: '1px solid #D97706', flexShrink: 0,
      background: '#1a1a1a', overflowX: 'auto',
    }}>
      {CATEGORY_LIST.map((cat) => {
        const count = entriesByCategory[cat]?.length ?? 0;
        const isEmpty = count === 0;
        const isActive = activeCategory === cat;

        return (
          <button
            key={cat}
            onClick={() => !isEmpty && handlePillClick(cat)}
            style={{
              height: 28, padding: '4px 8px', flexShrink: 0,
              fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
              background: isActive ? '#0f0f0f' : 'transparent',
              color: isActive ? '#D97706' : '#e8e8e8',
              border: `1px solid ${isActive ? '#D97706' : '#4b5563'}`,
              borderRadius: 4, cursor: isEmpty ? 'default' : 'pointer',
              opacity: isEmpty ? 0.4 : 1,
              pointerEvents: isEmpty ? 'none' : 'auto',
              transition: 'color 80ms, border-color 80ms, background 80ms',
            }}
          >
            {PILL_LABELS[cat]}
          </button>
        );
      })}
    </div>
  );
}
