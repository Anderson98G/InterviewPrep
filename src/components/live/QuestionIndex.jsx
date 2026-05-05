import { useRef } from 'react';
import { useQAStore } from '../../store/useQAStore.js';
import { CATEGORY_LIST } from '../../utils/categories.js';
import CategoryJumpStrip from './CategoryJumpStrip.jsx';
import CategoryGroup from './CategoryGroup.jsx';

export default function QuestionIndex({ isMinimized, onSelectEntry, onModeToggle }) {
  const entries = useQAStore((s) => s.entries);
  const collapsedCategories = useQAStore((s) => s.ui.collapsedCategories);
  const toggleCategoryCollapse = useQAStore((s) => s.toggleCategoryCollapse);
  const sessions = useQAStore((s) => s.sessions);
  const activeSessionId = useQAStore((s) => s.activeSessionId);

  const scrollRef = useRef(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const visitedEntryIds = new Set(activeSession?.visits.map((v) => v.entryId) ?? []);

  const entriesByCategory = CATEGORY_LIST.reduce((acc, cat) => {
    acc[cat] = entries
      .filter((e) => e.category === cat)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  const hasEntries = entries.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      <CategoryJumpStrip
        scrollRef={scrollRef}
        isMinimized={isMinimized}
        entriesByCategory={entriesByCategory}
        collapsedCategories={collapsedCategories}
        onExpandCategory={(cat) => {
          if (collapsedCategories.includes(cat)) toggleCategoryCollapse(cat);
        }}
      />

      {/* Scrollable list — stays mounted even when AnswerView is active */}
      <div
        ref={scrollRef}
        style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        {!hasEntries ? (
          <div style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 16, color: '#e8e8e8', marginBottom: 8 }}>No questions prepared</p>
            <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 16 }}>Switch to Prep Mode to add questions</p>
            <button
              onClick={onModeToggle}
              style={{
                padding: '8px 16px', fontSize: 13, fontWeight: 500, borderRadius: 4,
                background: '#D97706', color: '#1a1a1a', border: 'none', cursor: 'pointer',
              }}
            >
              Go to Prep Mode
            </button>
          </div>
        ) : (
          CATEGORY_LIST.map((cat) => {
            const catEntries = entriesByCategory[cat];
            if (catEntries.length === 0) return null;
            return (
              <CategoryGroup
                key={cat}
                category={cat}
                entries={catEntries}
                collapsedCategories={collapsedCategories}
                visitedEntryIds={visitedEntryIds}
                onSelect={onSelectEntry}
                onToggleCollapse={toggleCategoryCollapse}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
