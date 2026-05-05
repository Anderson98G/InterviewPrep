import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useQAStore } from '../../store/useQAStore.js';
import { CATEGORY_LIST } from '../../utils/categories.js';
import { needsNormalization, normalizeOrderForCategory } from '../../utils/versionUtils.js';
import QuestionCard from './QuestionCard.jsx';
import VersionHistoryPanel from './VersionHistoryPanel.jsx';

export default function QuestionList({ onAddClick }) {
  const entries = useQAStore((s) => s.entries);
  const activeCategoryFilter = useQAStore((s) => s.ui.activeCategoryFilter);
  const setActiveCategoryFilter = useQAStore((s) => s.setActiveCategoryFilter);
  const reorderEntry = useQAStore((s) => s.reorderEntry);
  const reorderBatch = useQAStore((s) => s.reorderBatch);

  const [historyEntryId, setHistoryEntryId] = useState(null);
  const historyEntry = entries.find((e) => e.id === historyEntryId) ?? null;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;

    const activeEntry = entries.find((e) => e.id === active.id);
    const overEntry = entries.find((e) => e.id === over.id);
    if (!activeEntry || !overEntry) return;

    // Cross-category drag → snap back; no state change.
    if (activeEntry.category !== overEntry.category) return;

    const category = activeEntry.category;
    const catEntries = entries
      .filter((e) => e.category === category)
      .sort((a, b) => a.order - b.order);

    const oldIdx = catEntries.findIndex((e) => e.id === active.id);
    const newIdx = catEntries.findIndex((e) => e.id === over.id);
    const reordered = arrayMove(catEntries, oldIdx, newIdx);

    // Compute new float order for the moved item based on its neighbors.
    const prev = reordered[newIdx - 1];
    const next = reordered[newIdx + 1];
    let newOrder;
    if (!prev) {
      newOrder = next ? next.order / 2 : 1.0;
    } else if (!next) {
      newOrder = prev.order + 1.0;
    } else {
      newOrder = (prev.order + next.order) / 2;
    }

    const finalEntries = reordered.map((e, i) =>
      i === newIdx ? { ...e, order: newOrder } : e
    );

    if (needsNormalization(finalEntries)) {
      reorderBatch(normalizeOrderForCategory(finalEntries));
    } else {
      reorderEntry(active.id, newOrder);
    }
  }

  // ---- Empty states ----

  if (entries.length === 0) {
    return (
      <>
        <div style={{ textAlign: 'center', padding: '64px 24px', color: '#6b7280' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
            No questions prepared yet
          </h2>
          <p style={{ fontSize: 14, marginBottom: 24 }}>
            Create your first Q&A entry to get started
          </p>
          <button
            onClick={onAddClick}
            style={{
              padding: '10px 24px', fontSize: 14, fontWeight: 500, borderRadius: 4,
              background: '#16A34A', color: '#fff', border: 'none', cursor: 'pointer', minHeight: 44,
            }}
          >
            Create First Question
          </button>
        </div>
        <VersionHistoryPanel entry={null} isOpen={false} onClose={() => setHistoryEntryId(null)} />
      </>
    );
  }

  const filtered = activeCategoryFilter
    ? entries.filter((e) => e.category === activeCategoryFilter)
    : entries;

  if (activeCategoryFilter && filtered.length === 0) {
    return (
      <>
        <div style={{ padding: 24 }}>
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 12 }}>
            No entries in {activeCategoryFilter}
          </p>
          <button
            onClick={() => setActiveCategoryFilter(null)}
            style={{
              padding: '8px 16px', fontSize: 14, fontWeight: 500, borderRadius: 4,
              background: 'transparent', color: '#16A34A',
              border: '1px solid #16A34A', cursor: 'pointer',
            }}
          >
            Show All
          </button>
        </div>
        <VersionHistoryPanel entry={null} isOpen={false} onClose={() => setHistoryEntryId(null)} />
      </>
    );
  }

  // ---- Main list with DnD ----

  const shouldGroup = !activeCategoryFilter;

  const byCategory = CATEGORY_LIST.reduce((acc, cat) => {
    acc[cat] = entries.filter((e) => e.category === cat).sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {shouldGroup ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {CATEGORY_LIST.map((cat) => {
              const catEntries = byCategory[cat];
              if (catEntries.length === 0) return null;
              return (
                <section key={cat}>
                  <h3 style={{
                    fontSize: 12, fontWeight: 600, color: '#6b7280',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #e5e7eb',
                    margin: '0 0 8px',
                  }}>
                    {cat} ({catEntries.length})
                  </h3>
                  <SortableContext
                    items={catEntries.map((e) => e.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catEntries.map((entry) => (
                        <QuestionCard
                          key={entry.id}
                          entry={entry}
                          onOpenHistory={(id) => setHistoryEntryId(id)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </section>
              );
            })}
          </div>
        ) : (
          // Filtered single-category view — still sortable.
          <SortableContext
            items={filtered.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...filtered].sort((a, b) => a.order - b.order).map((entry) => (
                <QuestionCard
                  key={entry.id}
                  entry={entry}
                  onOpenHistory={(id) => setHistoryEntryId(id)}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </DndContext>

      <VersionHistoryPanel
        entry={historyEntry}
        isOpen={historyEntryId !== null}
        onClose={() => setHistoryEntryId(null)}
      />
    </>
  );
}
