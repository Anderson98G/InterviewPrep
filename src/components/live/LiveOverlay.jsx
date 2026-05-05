import { useLayoutEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import { useQAStore } from '../../store/useQAStore.js';
import QuestionIndex from './QuestionIndex.jsx';
import AnswerView from './AnswerView.jsx';

const DEFAULT_SIZE = { width: 600, height: 400 };
const DRAG_HANDLE = 'live-overlay-drag-handle';

function clampOverlayPosition(pos, size, vw, vh) {
  if (!pos) return null;
  const w = size?.width ?? DEFAULT_SIZE.width;
  const h = size?.height ?? DEFAULT_SIZE.height;
  const x = Math.max(0, Math.min(pos.x, vw - w));
  const y = Math.max(0, Math.min(pos.y, vh - h));
  return { x, y };
}

export default function LiveOverlay({ onModeToggle }) {
  const overlayPosition = useQAStore((s) => s.ui.overlayPosition);
  const overlaySize = useQAStore((s) => s.ui.overlaySize);
  const setOverlayPosition = useQAStore((s) => s.setOverlayPosition);
  const setOverlaySize = useQAStore((s) => s.setOverlaySize);
  const mode = useQAStore((s) => s.ui.mode);

  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const savedSize = overlaySize ?? DEFAULT_SIZE;

  // Derive controlled position: clamp saved position or default to bottom-right.
  const [position, setPosition] = useState(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    if (overlayPosition) {
      const clamped = clampOverlayPosition(overlayPosition, savedSize, vw, vh);
      return clamped ?? { x: vw - savedSize.width - 20, y: vh - savedSize.height - 20 };
    }
    return { x: vw - savedSize.width - 20, y: vh - savedSize.height - 20 };
  });

  const [size, setSize] = useState(savedSize);

  // Clamp position on mount in case viewport changed since last save.
  useLayoutEffect(() => {
    const clamped = clampOverlayPosition(position, size, window.innerWidth, window.innerHeight);
    if (clamped && (clamped.x !== position.x || clamped.y !== position.y)) {
      setPosition(clamped);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (isMinimized) {
    return (
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: 200, height: 28,
          background: '#1a1a1a',
          border: '1px solid #D97706',
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 8px',
          zIndex: 9000,
          cursor: 'default',
          userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 12, color: '#D97706', fontWeight: 600 }}>Interview Prep</span>
        <button
          onClick={() => setIsMinimized(false)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#9ca3af', fontSize: 14, padding: '0 2px',
          }}
          aria-label="Restore overlay"
        >
          □
        </button>
      </div>
    );
  }

  return (
    <Rnd
      position={position}
      size={size}
      minWidth={280}
      minHeight={160}
      dragHandleClassName={DRAG_HANDLE}
      style={{ zIndex: 9000 }}
      onDragStop={(_, d) => {
        const next = { x: d.x, y: d.y };
        setPosition(next);
        setOverlayPosition(next);
      }}
      onResizeStop={(_, __, ref, ___, pos) => {
        const next = { width: ref.offsetWidth, height: ref.offsetHeight };
        const nextPos = { x: pos.x, y: pos.y };
        setSize(next);
        setPosition(nextPos);
        setOverlaySize(next);
        setOverlayPosition(nextPos);
      }}
    >
      <div style={{
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column',
        background: '#1a1a1a',
        border: '1px solid #D97706',
        borderRadius: 4,
        overflow: 'hidden',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Header — drag handle */}
        <div
          className={DRAG_HANDLE}
          style={{
            height: 36, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 8px',
            background: '#0f0f0f',
            borderBottom: '1px solid #D97706',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: '#D97706', letterSpacing: '0.05em' }}>
            INTERVIEW PREP
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* Mode toggle pill */}
            <button
              role="switch"
              aria-checked={mode === 'prep'}
              aria-label="Toggle between Prep and Live mode"
              onClick={(e) => { e.stopPropagation(); onModeToggle(); }}
              style={{
                display: 'flex', width: 72, height: 24, borderRadius: 12,
                overflow: 'hidden', border: 'none', padding: 0,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 500,
                background: mode === 'prep' ? '#16A34A' : '#374151',
                color: mode === 'prep' ? '#fff' : '#9ca3af',
              }}>Prep</span>
              <span style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, fontWeight: 500,
                background: mode === 'live' ? '#D97706' : '#374151',
                color: mode === 'live' ? '#1a1a1a' : '#9ca3af',
              }}>Live</span>
            </button>

            {/* Minimize */}
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#9ca3af', fontSize: 16, padding: '0 4px', lineHeight: 1,
              }}
              aria-label="Minimize overlay"
            >
              −
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'hidden', minHeight: 0, position: 'relative' }}>
          {/* QuestionIndex — hidden (not unmounted) when AnswerView is showing */}
          <div style={{
            display: selectedEntry ? 'none' : 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
            <QuestionIndex
              isMinimized={false}
              onSelectEntry={setSelectedEntry}
              onModeToggle={onModeToggle}
            />
          </div>

          {/* AnswerView */}
          {selectedEntry && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <AnswerView
                entry={selectedEntry}
                onBack={() => setSelectedEntry(null)}
              />
            </div>
          )}
        </div>
      </div>
    </Rnd>
  );
}
