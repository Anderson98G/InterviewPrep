import { useEffect } from 'react';
import { useQAStore } from '../../store/useQAStore.js';
import { getActiveVersion } from '../../utils/versionUtils.js';

export default function AnswerView({ entry, onBack }) {
  const activeSessionId = useQAStore((s) => s.activeSessionId);
  const addSessionVisit = useQAStore((s) => s.addSessionVisit);

  // Record visit on mount — idempotent.
  useEffect(() => {
    if (activeSessionId) addSessionVisit(activeSessionId, entry.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const active = getActiveVersion(entry);
  const anchorLines = active?.anchor ? active.anchor.split('\n').filter(Boolean) : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#1a1a1a' }}>
      {/* Header */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', gap: 8,
        padding: '0 12px', borderBottom: '1px solid #4b5563', flexShrink: 0,
      }}>
        <button
          onClick={onBack}
          style={{
            minWidth: 32, minHeight: 32, padding: '0 8px',
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#D97706', fontSize: 14, fontWeight: 500,
            display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          ← Back
        </button>
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 500, color: '#e8e8e8',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {entry.question}
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
        {/* Anchor outline — only if anchor exists */}
        {anchorLines.length > 0 && (
          <div style={{
            background: '#0f0f0f', padding: 12, marginBottom: 12, borderRadius: 4,
            maxHeight: 120, overflowY: 'auto',
          }}>
            {anchorLines.map((line, i) => (
              <p key={i} style={{
                margin: i === 0 ? 0 : '4px 0 0', fontSize: 14, fontWeight: 600,
                color: '#D97706', lineHeight: 1.5,
              }}>
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Answer prose */}
        <p style={{
          fontSize: 15, fontWeight: 400, color: '#e8e8e8',
          lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {active?.prose ?? ''}
        </p>
      </div>
    </div>
  );
}
