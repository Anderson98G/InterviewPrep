import { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useQAStore } from '../../store/useQAStore.js';
import { getActiveVersion, applyVersionSave } from '../../utils/versionUtils.js';
import { formatTimestamp } from '../../utils/formatDate.js';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';

export default function QuestionCard({ entry, onOpenHistory }) {
  const updateEntry = useQAStore((s) => s.updateEntry);
  const updateEntryQuestion = useQAStore((s) => s.updateEntryQuestion);
  const deleteEntry = useQAStore((s) => s.deleteEntry);

  const activeVersion = getActiveVersion(entry);
  const savedProse = activeVersion?.prose ?? '';
  const savedAnchor = activeVersion?.anchor ?? '';
  const savedQuestion = entry.question;

  const [isEditing, setIsEditing] = useState(false);
  const [editQuestion, setEditQuestion] = useState(savedQuestion);
  const [editProse, setEditProse] = useState(savedProse);
  const [editAnchor, setEditAnchor] = useState(savedAnchor);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const isDirty =
    editQuestion !== savedQuestion ||
    editProse !== savedProse ||
    editAnchor !== savedAnchor;

  // useSortable — drag handle gets listeners; card container gets ref + attributes.
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: entry.id,
    data: { category: entry.category },
  });

  const cardStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.2)' : undefined,
    zIndex: isDragging ? 50 : undefined,
    border: `${isEditing ? 2 : 1}px solid ${isEditing ? '#16A34A' : '#e5e7eb'}`,
    borderRadius: 4,
    padding: 12,
    background: '#fff',
    position: 'relative',
  };

  // Keep editor in sync if the entry changes while not editing (cross-tab, etc).
  useEffect(() => {
    if (!isEditing) {
      setEditQuestion(entry.question);
      setEditProse(savedProse);
      setEditAnchor(savedAnchor);
    }
  }, [entry.question, savedProse, savedAnchor, isEditing]);

  function openEditor() {
    setEditQuestion(entry.question);
    setEditProse(savedProse);
    setEditAnchor(savedAnchor);
    setIsEditing(true);
  }

  function handleDiscard() {
    setEditQuestion(savedQuestion);
    setEditProse(savedProse);
    setEditAnchor(savedAnchor);
    setIsEditing(false);
  }

  function handleSave() {
    if (!isDirty) return;
    if (editProse !== savedProse || editAnchor !== savedAnchor) {
      updateEntry(entry.id, (e) => applyVersionSave(e, editProse, editAnchor));
    }
    if (editQuestion !== savedQuestion) {
      updateEntryQuestion(entry.id, editQuestion);
    }
    setIsEditing(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') { handleDiscard(); return; }
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); handleSave(); }
  }

  function wordCount(text) {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }

  const inputStyle = {
    width: '100%', padding: 8, fontSize: 14, border: '1px solid #e5e7eb',
    borderRadius: 4, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
    background: '#fff',
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={cardStyle}
        {...attributes}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onKeyDown={isEditing ? handleKeyDown : undefined}
      >
        {/* Top row: drag handle + question + action buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>

          {/* Drag handle — visible on hover only */}
          <div
            {...listeners}
            aria-label="Drag to reorder"
            style={{
              cursor: isDragging ? 'grabbing' : 'grab',
              color: '#9ca3af', fontSize: 18, lineHeight: 1,
              paddingTop: 2, flexShrink: 0, userSelect: 'none',
              opacity: isHovered || isDragging ? 1 : 0,
              transition: 'opacity 100ms',
            }}
          >
            ⠿
          </div>

          {/* Question */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {isEditing ? (
              <input
                type="text"
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                style={{ ...inputStyle, fontSize: 16, fontWeight: 600, height: 36 }}
                aria-label="Question"
              />
            ) : (
              <p
                onClick={openEditor}
                style={{
                  fontSize: 16, fontWeight: 600, color: '#1a1a1a',
                  margin: 0, lineHeight: 1.5, cursor: 'text',
                }}
              >
                {entry.question}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button
              onClick={() => onOpenHistory(entry.id)}
              aria-label="View version history"
              style={{
                width: 32, height: 32, background: 'transparent', border: 'none',
                cursor: 'pointer', color: '#16A34A', fontSize: 15, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ⏱
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              aria-label="Delete question"
              style={{
                width: 32, height: 32, background: 'transparent', border: 'none',
                cursor: 'pointer', color: '#dc2626', fontSize: 15, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Category + last edited */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: isEditing ? 12 : 8 }}>
          <span style={{
            fontSize: 12, fontWeight: 500, color: '#16A34A',
            background: '#dcfce7', padding: '2px 8px', borderRadius: 12,
          }}>
            {entry.category}
          </span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            Last edited {formatTimestamp(entry.lastEditedAt)}
          </span>
        </div>

        {/* Answer */}
        {isEditing ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>
                Answer
              </label>
              <textarea
                value={editProse}
                onChange={(e) => setEditProse(e.target.value)}
                placeholder="Enter answer"
                style={{ ...inputStyle, minHeight: 200, resize: 'vertical', fontSize: 15, lineHeight: 1.6 }}
                aria-label="Answer"
              />
              <div style={{ fontSize: 12, color: '#9ca3af', textAlign: 'right', marginTop: 2 }}>
                {wordCount(editProse)} words
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>
                Anchor phrases
              </label>
              <textarea
                value={editAnchor}
                onChange={(e) => setEditAnchor(e.target.value)}
                placeholder="Enter anchor phrases, one per line"
                style={{ ...inputStyle, minHeight: 120, resize: 'vertical', lineHeight: 1.5 }}
                aria-label="Anchor phrases"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={handleDiscard}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 4,
                  background: '#e5e7eb', color: '#1a1a1a', border: 'none', cursor: 'pointer', height: 36,
                }}
              >
                Discard
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                style={{
                  padding: '6px 14px', fontSize: 13, fontWeight: 500, borderRadius: 4,
                  background: '#16A34A', color: '#fff', border: 'none',
                  cursor: isDirty ? 'pointer' : 'not-allowed',
                  opacity: isDirty ? 1 : 0.5, height: 36,
                }}
              >
                Save
              </button>
            </div>
          </>
        ) : (
          savedProse && (
            <p
              onClick={openEditor}
              style={{
                fontSize: 15, color: '#374151', margin: 0, lineHeight: 1.6, cursor: 'text',
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}
            >
              {savedProse}
            </p>
          )
        )}
      </div>

      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete this question?"
          message={`"${entry.question}" and all its version history will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={() => { deleteEntry(entry.id); setShowDeleteConfirm(false); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
