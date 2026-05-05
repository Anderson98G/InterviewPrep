import { useEffect, useRef, useState } from 'react';
import { useQAStore } from '../../store/useQAStore.js';
import ConfirmDialog from '../shared/ConfirmDialog.jsx';

export default function DebriefScreen({ visitedEntryIds, endSession, exitDebrief, skipSession, setMode }) {
  const entries = useQAStore((s) => s.entries);
  const [notes, setNotes] = useState(new Map()); // Map<entryId, string>
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const firstTextareaRef = useRef(null);

  const visitedEntries = entries.filter((e) => visitedEntryIds.has(e.id));
  const hasAnyNote = [...notes.values()].some((v) => v.trim().length > 0);

  // Focus first note field on mount.
  useEffect(() => {
    firstTextareaRef.current?.focus();
  }, []);

  function handleNoteChange(entryId, value) {
    setNotes((prev) => {
      const next = new Map(prev);
      next.set(entryId, value);
      return next;
    });
  }

  function handleBack() {
    if (hasAnyNote) {
      setShowDiscardDialog(true);
    } else {
      exitDebrief();
    }
  }

  function handleDiscardConfirm() {
    setShowDiscardDialog(false);
    setNotes(new Map());
    exitDebrief();
  }

  function handleSave() {
    endSession(notes);
    setMode('prep');
  }

  function handleSkip() {
    skipSession();
    setMode('prep');
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: '#252525', display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        height: 52, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: '#1a1a1a',
        borderBottom: '1px solid #4b5563',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={handleBack}
            aria-label="Back to Live Mode"
            style={{
              background: 'transparent', border: '1px solid #4b5563',
              borderRadius: 4, cursor: 'pointer',
              color: '#e8e8e8', fontSize: 13, fontWeight: 500,
              padding: '6px 12px',
            }}
          >
            ← Back to Live
          </button>
          <span style={{ fontSize: 16, fontWeight: 600, color: '#e8e8e8' }}>
            Interview Debrief
          </span>
          <span style={{ fontSize: 13, color: '#9ca3af' }}>
            {visitedEntries.length} question{visitedEntries.length !== 1 ? 's' : ''} visited
          </span>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSkip}
            aria-label="Skip debrief and end session"
            style={{
              background: 'transparent', border: '1px solid #4b5563',
              borderRadius: 4, cursor: 'pointer',
              color: '#9ca3af', fontSize: 13, fontWeight: 500,
              padding: '6px 12px',
            }}
          >
            Skip
          </button>
          <button
            onClick={handleSave}
            disabled={!hasAnyNote}
            aria-label="Save notes and end session"
            style={{
              background: hasAnyNote ? '#D97706' : '#374151',
              border: 'none', borderRadius: 4,
              cursor: hasAnyNote ? 'pointer' : 'not-allowed',
              color: hasAnyNote ? '#1a1a1a' : '#6b7280',
              fontSize: 13, fontWeight: 600,
              padding: '6px 16px',
              opacity: hasAnyNote ? 1 : 0.6,
            }}
          >
            Save &amp; End Session
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left — 35%: question list */}
        <div style={{
          width: '35%', borderRight: '1px solid #374151',
          overflowY: 'auto', padding: '12px 0',
        }}>
          {visitedEntries.map((entry, idx) => (
            <button
              key={entry.id}
              onClick={() => {
                document.getElementById(`note-${entry.id}`)?.focus();
              }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '10px 16px', background: 'transparent', border: 'none',
                borderBottom: '1px solid #2d2d2d',
                cursor: 'pointer', color: '#e8e8e8', fontSize: 13, lineHeight: 1.4,
              }}
            >
              <span style={{
                display: 'inline-block', marginRight: 8,
                fontSize: 11, fontWeight: 600, color: '#D97706',
              }}>
                {idx + 1}.
              </span>
              {entry.question}
              {notes.get(entry.id)?.trim() && (
                <span style={{
                  display: 'inline-block', marginLeft: 8,
                  width: 6, height: 6, borderRadius: '50%',
                  background: '#D97706', verticalAlign: 'middle',
                }} />
              )}
            </button>
          ))}
        </div>

        {/* Right — 65%: note fields */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {visitedEntries.length === 0 ? (
            <p style={{ color: '#9ca3af', fontSize: 14 }}>No questions were visited this session.</p>
          ) : (
            visitedEntries.map((entry, idx) => (
              <div key={entry.id} style={{ marginBottom: 24 }}>
                <p style={{
                  fontSize: 13, fontWeight: 600, color: '#D97706',
                  marginBottom: 6, lineHeight: 1.4,
                }}>
                  {idx + 1}. {entry.question}
                </p>
                <textarea
                  id={`note-${entry.id}`}
                  ref={idx === 0 ? firstTextareaRef : undefined}
                  value={notes.get(entry.id) ?? ''}
                  onChange={(e) => handleNoteChange(entry.id, e.target.value)}
                  placeholder="Add a note about how this question went…"
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: '#1a1a1a', border: '1px solid #4b5563',
                    borderRadius: 4, color: '#e8e8e8',
                    fontSize: 14, lineHeight: 1.5,
                    padding: '8px 10px', resize: 'vertical',
                    fontFamily: 'Inter, sans-serif',
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#D97706'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#4b5563'; }}
                />
              </div>
            ))
          )}
        </div>
      </div>

      {showDiscardDialog && (
        <ConfirmDialog
          title="Discard notes?"
          message="You've typed notes that haven't been saved. Going back will discard them."
          confirmLabel="Discard"
          onConfirm={handleDiscardConfirm}
          onCancel={() => setShowDiscardDialog(false)}
        />
      )}
    </div>
  );
}
